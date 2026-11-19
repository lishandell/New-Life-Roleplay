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
      row.key === 'discordNewsWebhookUrl'
    ) {
      continue;
    }
    settings[row.key] = row.value;
  }
  return settings;
}

router.get('/site-data', async (_req, res) => {
  const [settings, news, features, staff, rules] = await Promise.all([
    getPublicSettings(),
    db.all(
      'SELECT * FROM news WHERE "isPublished" = 1 ORDER BY "isFeatured" DESC, "id" DESC'
    ),
    db.all('SELECT * FROM features ORDER BY "sortOrder" ASC, "id" ASC'),
    db.all('SELECT * FROM staff ORDER BY "sortOrder" ASC, "id" ASC'),
    db.all('SELECT * FROM rules ORDER BY "sortOrder" ASC, "id" ASC'),
  ]);

  res.json({ settings, news, features, staff, rules });
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

export default router;
