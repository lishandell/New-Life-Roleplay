import { db } from '../db.js';

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row?.value || '';
}

export function parseIdList(raw = '') {
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendDiscordEmbed(webhookUrl, embed) {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'New Life Roleplay',
        embeds: [embed],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyNewsPublished(newsItem) {
  const webhookUrl =
    getSetting('discordNewsWebhookUrl') ||
    process.env.DISCORD_NEWS_WEBHOOK_URL ||
    '';
  if (!webhookUrl) return;

  const colorMap = {
    copper: 0xd98d75,
    amber: 0xf59e0b,
    emerald: 0x10b981,
    blue: 0x3b82f6,
    purple: 0xa855f7,
  };

  await sendDiscordEmbed(webhookUrl, {
    title: `📰 ${newsItem.title}`,
    description: `${newsItem.summary}\n\n${
      newsItem.content && newsItem.content !== newsItem.summary
        ? newsItem.content.slice(0, 800)
        : ''
    }`,
    color: colorMap[newsItem.accentColor] || 0xd98d75,
    fields: [
      { name: 'Categoría', value: newsItem.badge || newsItem.category, inline: true },
      { name: 'Fecha', value: newsItem.publishedAt || 'Hoy', inline: true },
    ],
    footer: { text: 'New Life Roleplay • Noticias Oficiales' },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyWhitelistResult(app) {
  const webhookUrl =
    getSetting('discordWebhookUrl') || process.env.DISCORD_WEBHOOK_URL || '';
  if (!webhookUrl) return;

  const approved = app.status === 'approved';
  const mention = app.discordId ? `<@${app.discordId}>` : app.discordTag;

  await sendDiscordEmbed(webhookUrl, {
    title: approved
      ? '✅ Whitelist Aprobada'
      : '❌ Whitelist Rechazada',
    description: `La solicitud **${app.trackingCode}** de ${mention} (**${app.characterName}**) ha sido **${
      approved ? 'APROBADA' : 'RECHAZADA'
    }**.`,
    color: approved ? 0x10b981 : 0xef4444,
    fields: [
      ...(app.staffNote
        ? [{ name: 'Nota del Staff', value: app.staffNote, inline: false }]
        : []),
      { name: 'Revisado por', value: app.reviewedBy || 'Staff', inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}

export async function assignDiscordWhitelistRole(discordId) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleIds = parseIdList(
    getSetting('discordWhitelistRoleIds') || process.env.DISCORD_WHITELIST_ROLE_IDS
  );

  if (!botToken || !guildId || !discordId || roleIds.length === 0) {
    return false;
  }

  const targetRoleId = roleIds[0];
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${targetRoleId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
