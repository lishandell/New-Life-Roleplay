import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getDiscordUserFromRequest } from '../auth.js';
import { getSetting, sendDiscordEmbed } from '../utils/discordNotify.js';

const router = express.Router();

async function getPublicSettings() {
  const rows = await db.all('SELECT "key", "value" FROM settings');
  const settings = {};
  for (const row of rows) {
    if (
      row.key === 'discordWebhookUrl' ||
      row.key === 'discordNewsWebhookUrl' ||
      row.key === 'discordStatusWebhookUrl' ||
      row.key === 'discordFactionsWebhookUrl' ||
      row.key === 'discordSupportWebhookUrl'
    ) {
      continue;
    }
    settings[row.key] = row.value;
  }
  return settings;
}

router.get('/site-data', async (_req, res) => {
  const [settings, news, features, staff, rules, factions, store, gallery] =
    await Promise.all([
      getPublicSettings(),
      db.all(
        'SELECT * FROM news WHERE "isPublished" = 1 ORDER BY "isFeatured" DESC, "id" DESC'
      ),
      db.all('SELECT * FROM features ORDER BY "sortOrder" ASC, "id" ASC'),
      db.all('SELECT * FROM staff ORDER BY "sortOrder" ASC, "id" ASC'),
      db.all('SELECT * FROM rules ORDER BY "sortOrder" ASC, "id" ASC'),
      db.all('SELECT * FROM factions ORDER BY "sortOrder" ASC, "id" ASC'),
      db.all('SELECT * FROM store_items ORDER BY "sortOrder" ASC, "id" ASC'),
      db.all('SELECT * FROM gallery_items ORDER BY "id" DESC'),
    ]);

  res.json({ settings, news, features, staff, rules, factions, store, gallery });
});

router.post('/whitelist', async (req, res) => {
  const settings = await getPublicSettings();
  if (settings.whitelistEnabled !== 'true') {
    return res
      .status(403)
      .json({ error: 'Las postulaciones a la Whitelist están cerradas temporalmente.' });
  }

  const discordUser = getDiscordUserFromRequest(req);

  const {
    discordTag = discordUser?.username || '',
    age,
    country = '',
    mtaSerial = '',
    characterName = '',
    characterBackstory = '',
    rpConcepts = '',
    scenarioAnswer = '',
  } = req.body || {};

  const parsedAge = Number(age);
  const finalDiscordTag = (discordTag || discordUser?.username || '').trim();
  const finalDiscordId = discordUser?.discordId || '';

  if (
    !finalDiscordTag ||
    !Number.isFinite(parsedAge) ||
    parsedAge < 13 ||
    parsedAge > 99 ||
    !country.trim() ||
    !characterName.trim() ||
    characterBackstory.trim().length < 40 ||
    rpConcepts.trim().length < 20 ||
    scenarioAnswer.trim().length < 20
  ) {
    return res.status(400).json({
      error:
        'Completa todos los campos obligatorios con el detalle mínimo requerido (historia min. 40 caracteres, conceptos y escenario min. 20 caracteres).',
    });
  }

  const trackingCode = `NL-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
  const now = new Date().toISOString();

  await db.insert(
    `INSERT INTO whitelist_applications
    ("trackingCode", "discordId", "discordTag", "age", "country", "mtaSerial", "characterName", "characterBackstory", "rpConcepts", "scenarioAnswer", "status", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      trackingCode,
      finalDiscordId,
      finalDiscordTag,
      parsedAge,
      country.trim(),
      mtaSerial.trim(),
      characterName.trim(),
      characterBackstory.trim(),
      rpConcepts.trim(),
      scenarioAnswer.trim(),
      now,
      now,
    ]
  );

  const webhookUrl =
    (await getSetting('discordWebhookUrl')) || process.env.DISCORD_WEBHOOK_URL || '';
  if (webhookUrl) {
    await sendDiscordEmbed(webhookUrl, {
      title: '📋 Nueva Solicitud de Whitelist',
      color: 0xd98d75,
      fields: [
        { name: 'Código', value: trackingCode, inline: true },
        {
          name: 'Discord',
          value: finalDiscordId ? `<@${finalDiscordId}> (${finalDiscordTag})` : finalDiscordTag,
          inline: true,
        },
        { name: 'Personaje IC', value: characterName.trim(), inline: true },
        { name: 'Edad / País', value: `${parsedAge} años (${country.trim()})`, inline: true },
      ],
      timestamp: now,
    });
  }

  res.status(201).json({
    trackingCode,
    status: 'pending',
    message: 'Solicitud enviada correctamente.',
  });
});

router.get('/whitelist/my-applications', async (req, res) => {
  const discordUser = getDiscordUserFromRequest(req);
  if (!discordUser) {
    return res.json([]);
  }
  const apps = await db.all(
    'SELECT "trackingCode", "characterName", "status", "staffNote", "createdAt", "updatedAt" FROM whitelist_applications WHERE "discordId" = ? ORDER BY "id" DESC',
    [discordUser.discordId]
  );
  res.json(apps);
});

router.get('/whitelist/status', async (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: 'Ingresa tu código de seguimiento (ej. NL-A1B2-C3D4).' });
  }

  const app = await db.get(
    'SELECT "trackingCode", "characterName", "discordTag", "status", "staffNote", "createdAt", "updatedAt" FROM whitelist_applications WHERE "trackingCode" = ?',
    [code]
  );

  if (!app) {
    return res.status(404).json({ error: 'No se encontró ninguna solicitud con ese código.' });
  }

  res.json(app);
});

router.post('/factions/apply', async (req, res) => {
  const discordUser = getDiscordUserFromRequest(req);
  const {
    factionId,
    discordTag = discordUser?.username || '',
    characterName = '',
    age = 18,
    experience = '',
    motivation = '',
  } = req.body || {};

  const faction = await db.get('SELECT * FROM factions WHERE "id" = ?', [
    Number(factionId),
  ]);
  if (!faction) {
    return res.status(404).json({ error: 'Facción no encontrada.' });
  }
  if (!faction.isOpen) {
    return res
      .status(403)
      .json({ error: 'Las postulaciones para esta facción están cerradas.' });
  }

  const finalDiscordTag = (discordTag || discordUser?.username || '').trim();
  const finalDiscordId = discordUser?.discordId || '';

  if (
    !finalDiscordTag ||
    !characterName.trim() ||
    experience.trim().length < 15 ||
    motivation.trim().length < 15
  ) {
    return res.status(400).json({
      error: 'Completa todos los campos obligatorios con suficiente detalle.',
    });
  }

  const trackingCode = `FAC-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
  const now = new Date().toISOString();

  await db.insert(
    `INSERT INTO faction_applications
    ("trackingCode", "factionId", "factionName", "discordId", "discordTag", "characterName", "age", "experience", "motivation", "status", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      trackingCode,
      faction.id,
      faction.name,
      finalDiscordId,
      finalDiscordTag,
      characterName.trim(),
      Number(age) || 18,
      experience.trim(),
      motivation.trim(),
      now,
      now,
    ]
  );

  const webhookUrl = await getSetting('discordFactionsWebhookUrl');
  if (webhookUrl) {
    await sendDiscordEmbed(webhookUrl, {
      title: `🏛️ Nueva Postulación a Facción: ${faction.name}`,
      color: 0x3b82f6,
      fields: [
        { name: 'Código', value: trackingCode, inline: true },
        {
          name: 'Discord',
          value: finalDiscordId ? `<@${finalDiscordId}> (${finalDiscordTag})` : finalDiscordTag,
          inline: true,
        },
        { name: 'Personaje IC', value: characterName.trim(), inline: true },
      ],
      timestamp: now,
    });
  }

  res.status(201).json({ trackingCode, status: 'pending' });
});

router.post('/support', async (req, res) => {
  const discordUser = getDiscordUserFromRequest(req);
  const {
    type = 'report',
    discordTag = discordUser?.username || '',
    characterName = '',
    mtaSerial = '',
    subject = '',
    description = '',
    evidenceUrl = '',
  } = req.body || {};

  const finalDiscordTag = (discordTag || discordUser?.username || '').trim();
  const finalDiscordId = discordUser?.discordId || '';

  if (!finalDiscordTag || !subject.trim() || description.trim().length < 15) {
    return res.status(400).json({
      error: 'Ingresa tu Discord, asunto y una descripción detallada (mín. 15 caracteres).',
    });
  }

  const ticketCode = `SUP-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
  const now = new Date().toISOString();

  await db.insert(
    `INSERT INTO support_tickets
    ("ticketCode", "type", "discordId", "discordTag", "characterName", "mtaSerial", "subject", "description", "evidenceUrl", "status", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
    [
      ticketCode,
      type,
      finalDiscordId,
      finalDiscordTag,
      characterName.trim(),
      mtaSerial.trim(),
      subject.trim(),
      description.trim(),
      evidenceUrl.trim(),
      now,
      now,
    ]
  );

  const webhookUrl = await getSetting('discordSupportWebhookUrl');
  if (webhookUrl) {
    const typeLabel =
      type === 'appeal'
        ? '⚖️ Apelación de Ban'
        : type === 'bug'
        ? '🐛 Reporte de Bug'
        : '🚨 Reporte de Jugador';
    await sendDiscordEmbed(webhookUrl, {
      title: `${typeLabel} (${ticketCode})`,
      description: description.trim().slice(0, 600),
      color: type === 'appeal' ? 0xf59e0b : 0xef4444,
      fields: [
        { name: 'Asunto', value: subject.trim(), inline: false },
        {
          name: 'Usuario',
          value: finalDiscordId ? `<@${finalDiscordId}> (${finalDiscordTag})` : finalDiscordTag,
          inline: true,
        },
        ...(characterName
          ? [{ name: 'Personaje', value: characterName.trim(), inline: true }]
          : []),
        ...(evidenceUrl
          ? [{ name: 'Pruebas / Clip', value: evidenceUrl.trim(), inline: false }]
          : []),
      ],
      timestamp: now,
    });
  }

  res.status(201).json({ ticketCode, status: 'open' });
});

router.get('/support/status', async (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: 'Ingresa tu código de ticket (ej. SUP-A1B2-C3D4).' });
  }
  const ticket = await db.get(
    'SELECT "ticketCode", "type", "subject", "status", "staffResponse", "reviewedBy", "createdAt", "updatedAt" FROM support_tickets WHERE "ticketCode" = ?',
    [code]
  );
  if (!ticket) {
    return res.status(404).json({ error: 'No se encontró ningún ticket con ese código.' });
  }
  res.json(ticket);
});

router.get('/profile/summary', async (req, res) => {
  const discordUser = getDiscordUserFromRequest(req);
  if (!discordUser) {
    return res.status(401).json({ error: 'Inicia sesión con Discord para ver tu perfil.' });
  }

  const [whitelistApps, factionApps, supportTickets] = await Promise.all([
    db.all(
      'SELECT "trackingCode", "characterName", "status", "staffNote", "createdAt" FROM whitelist_applications WHERE "discordId" = ? ORDER BY "id" DESC',
      [discordUser.discordId]
    ),
    db.all(
      'SELECT "trackingCode", "factionName", "characterName", "status", "staffNote", "createdAt" FROM faction_applications WHERE "discordId" = ? ORDER BY "id" DESC',
      [discordUser.discordId]
    ),
    db.all(
      'SELECT "ticketCode", "type", "subject", "status", "staffResponse", "createdAt" FROM support_tickets WHERE "discordId" = ? ORDER BY "id" DESC',
      [discordUser.discordId]
    ),
  ]);

  res.json({
    user: discordUser,
    whitelistApps,
    factionApps,
    supportTickets,
  });
});

export default router;
