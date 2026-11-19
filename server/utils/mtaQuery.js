import dgram from 'node:dgram';
import { db } from '../db.js';
import { sendDiscordEmbed } from './discordNotify.js';

function parseAsePacket(buf) {
  if (!buf || buf.length < 10) return null;
  const header = buf.subarray(0, 4).toString('ascii');
  if (header !== 'EYE1') return null;

  let offset = 4;
  const fields = [];
  for (let i = 0; i < 9 && offset < buf.length; i++) {
    const len = buf[offset];
    offset += 1;
    if (len <= 1) {
      fields.push('');
      continue;
    }
    const str = buf.subarray(offset, offset + len - 1).toString('utf8');
    offset += len - 1;
    fields.push(str);
  }

  // fields: [0]=game, [1]=port, [2]=serverName, [3]=gamemode, [4]=map, [5]=version, [6]=passworded, [7]=players, [8]=maxPlayers
  if (fields.length < 9) return null;
  return {
    online: true,
    serverName: fields[2] || '',
    gameMode: fields[3] || 'Roleplay',
    mapName: fields[4] || '',
    version: fields[5] || '',
    playersOnline: Number(fields[7]) || 0,
    playersMax: Number(fields[8]) || 0,
  };
}

export function queryMtaAse(host, gamePort, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const asePort = Number(gamePort) + 123;
    if (!host || !Number.isFinite(asePort) || asePort <= 123 || asePort > 65535) {
      return resolve({ online: false });
    }

    const socket = dgram.createSocket('udp4');
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ online: false });
    }, timeoutMs);

    socket.on('error', () => {
      clearTimeout(timer);
      finish({ online: false });
    });

    socket.on('message', (msg) => {
      clearTimeout(timer);
      const parsed = parseAsePacket(msg);
      if (parsed) {
        finish(parsed);
      } else {
        finish({ online: true });
      }
    });

    try {
      socket.send(Buffer.from('s'), asePort, host, (err) => {
        if (err) {
          clearTimeout(timer);
          finish({ online: false });
        }
      });
    } catch {
      clearTimeout(timer);
      finish({ online: false });
    }
  });
}

// Live state cache in memory
export const liveMtaState = {
  lastCheckedAt: null,
  online: false,
  playersOnline: null,
  playersMax: null,
  serverName: '',
  gameMode: '',
};

async function getAllSettingsMap() {
  const rows = await db.all('SELECT "key", "value" FROM settings');
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function refreshLiveMtaStatus() {
  const settings = await getAllSettingsMap();
  const rawIp = (settings.serverIp || '172.96.140.62:7323').trim();
  const [host, portStr] = rawIp.split(':');
  const port = Number(portStr) || 22003;

  const result = await queryMtaAse(host, port);
  liveMtaState.lastCheckedAt = new Date().toISOString();
  liveMtaState.online = Boolean(result.online);

  if (result.online) {
    liveMtaState.playersOnline =
      typeof result.playersOnline === 'number'
        ? result.playersOnline
        : Number(settings.playersOnline) || 0;
    liveMtaState.playersMax =
      typeof result.playersMax === 'number' && result.playersMax > 0
        ? result.playersMax
        : Number(settings.playersMax) || 500;
    liveMtaState.serverName = result.serverName || settings.serverName || '';
    liveMtaState.gameMode = result.gameMode || 'Roleplay';
  }

  // If autoStatusEnabled is true, persist the live status & players to DB settings
  if (settings.autoStatusEnabled === 'true') {
    const newStatus = result.online ? 'online' : 'offline';
    await db.run(
      'INSERT INTO settings ("key", "value") VALUES (?, ?) ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"',
      ['serverStatus', newStatus]
    );
    if (result.online && typeof result.playersOnline === 'number') {
      await db.run(
        'INSERT INTO settings ("key", "value") VALUES (?, ?) ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"',
        ['playersOnline', String(result.playersOnline)]
      );
    }
    if (result.online && typeof result.playersMax === 'number' && result.playersMax > 0) {
      await db.run(
        'INSERT INTO settings ("key", "value") VALUES (?, ?) ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"',
        ['playersMax', String(result.playersMax)]
      );
    }
  }

  return {
    ...liveMtaState,
    host,
    port,
    asePort: port + 123,
  };
}

export async function sendServerStatusEmbedToDiscord() {
  // Always refresh live status right before sending if autoStatusEnabled is on
  let settings = await getAllSettingsMap();
  if (settings.autoStatusEnabled === 'true') {
    await refreshLiveMtaStatus();
    settings = await getAllSettingsMap();
  }

  const webhookUrl = settings.discordStatusWebhookUrl || '';

  if (!webhookUrl) {
    return { ok: false, error: 'No hay Webhook de Discord configurado para el estado.' };
  }

  const isOnline = settings.serverStatus === 'online';
  const isMaint = settings.serverStatus === 'maintenance';

  const statusEmoji = isOnline ? '🟢' : isMaint ? '🟡' : '🔴';
  const statusLabel = isOnline
    ? 'Abierto'
    : isMaint
    ? 'Mantenimiento'
    : 'Apagado';
  const embedColor = isOnline ? 0x22c55e : isMaint ? 0xf59e0b : 0xef4444;

  const embedServerTitle =
    settings.statusEmbedName ||
    `${settings.serverName || 'New Life Roleplay'} | Roleplay | Español | Latino`;
  const embedMode = settings.statusEmbedMode || 'Roleplay';
  const embedAdmin = settings.statusEmbedAdmin || 'New Life Staff';
  const customPlayersText = (settings.statusEmbedPlayersText || '').trim();

  const playersDisplay = customPlayersText
    ? customPlayersText
    : `\`${settings.playersOnline || 0} / ${settings.playersMax || 500}\``;

  const sent = await sendDiscordEmbed(webhookUrl, {
    title: '💻 Información del Servidor',
    color: embedColor,
    fields: [
      {
        name: '📰 Nombre',
        value: `\`${embedServerTitle}\``,
        inline: false,
      },
      {
        name: '🌍 IP',
        value: `\`${settings.serverIp || '172.96.140.62:7323'}\``,
        inline: true,
      },
      {
        name: '🎮 Modo',
        value: `\`${embedMode}\``,
        inline: true,
      },
      {
        name: `${statusEmoji} Estado`,
        value: `\`${statusLabel}\``,
        inline: true,
      },
      {
        name: '👥 Jugadores',
        value: playersDisplay,
        inline: true,
      },
      {
        name: '💸 Administración',
        value: `\`${embedAdmin}\``,
        inline: true,
      },
    ],
    footer: {
      text: settings.serverName || 'New Life Roleplay',
    },
    timestamp: new Date().toISOString(),
  });

  if (!sent) {
    return {
      ok: false,
      error: 'No se pudo enviar el embed a Discord. Verifica la URL del Webhook.',
    };
  }
  return { ok: true };
}

let lastDiscordStatusSentAt = 0;

export function startMtaStatusScheduler() {
  // Initial check after 3 seconds
  setTimeout(() => {
    refreshLiveMtaStatus().catch(() => {});
  }, 3000);

  // Poll MTA server every 60 seconds and check if Discord auto-status is due
  setInterval(async () => {
    try {
      const settings = await getAllSettingsMap();
      if (settings.autoStatusEnabled === 'true') {
        await refreshLiveMtaStatus();
      }

      if (settings.autoDiscordStatusEnabled === 'true') {
        const intervalMin = Math.max(
          5,
          Number(settings.discordStatusIntervalMinutes) || 30
        );
        const intervalMs = intervalMin * 60 * 1000;
        const now = Date.now();
        if (now - lastDiscordStatusSentAt >= intervalMs) {
          const res = await sendServerStatusEmbedToDiscord();
          if (res.ok) {
            lastDiscordStatusSentAt = now;
          }
        }
      }
    } catch {
      // Ignore transient scheduler errors
    }
  }, 60 * 1000);
}
