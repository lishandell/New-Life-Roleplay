import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';

const router = express.Router();

function getPublicSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    if (row.key === 'discordWebhookUrl') continue; // Never expose webhook URL publicly
    settings[row.key] = row.value;
  }
  return settings;
}

router.get('/site-data', (_req, res) => {
  const settings = getPublicSettings();
  const news = db
    .prepare(
      'SELECT * FROM news WHERE isPublished = 1 ORDER BY isFeatured DESC, id DESC'
    )
    .all();
  const features = db
    .prepare('SELECT * FROM features ORDER BY sortOrder ASC, id ASC')
    .all();
  const staff = db
    .prepare('SELECT * FROM staff ORDER BY sortOrder ASC, id ASC')
    .all();
  const rules = db
    .prepare('SELECT * FROM rules ORDER BY sortOrder ASC, id ASC')
    .all();

  res.json({ settings, news, features, staff, rules });
});

router.post('/whitelist', async (req, res) => {
  const settings = getPublicSettings();
  if (settings.whitelistEnabled !== 'true') {
    return res
      .status(403)
      .json({ error: 'Las postulaciones a la Whitelist están cerradas temporalmente.' });
  }

  const {
    discordTag = '',
    age,
    country = '',
    mtaSerial = '',
    characterName = '',
    characterBackstory = '',
    rpConcepts = '',
    scenarioAnswer = '',
  } = req.body || {};

  const parsedAge = Number(age);
  if (
    !discordTag.trim() ||
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

  db.prepare(
    `INSERT INTO whitelist_applications
    (trackingCode, discordTag, age, country, mtaSerial, characterName, characterBackstory, rpConcepts, scenarioAnswer, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(
    trackingCode,
    discordTag.trim(),
    parsedAge,
    country.trim(),
    mtaSerial.trim(),
    characterName.trim(),
    characterBackstory.trim(),
    rpConcepts.trim(),
    scenarioAnswer.trim(),
    now,
    now
  );

  // Optional Discord webhook notification
  const webhookRow = db
    .prepare("SELECT value FROM settings WHERE key = 'discordWebhookUrl'")
    .get();
  if (webhookRow?.value && webhookRow.value.startsWith('https://discord.com/api/webhooks/')) {
    fetch(webhookRow.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '📋 Nueva Solicitud de Whitelist',
            color: 0xd98d75,
            fields: [
              { name: 'Código', value: trackingCode, inline: true },
              { name: 'Discord', value: discordTag.trim(), inline: true },
              { name: 'Personaje IC', value: characterName.trim(), inline: true },
              { name: 'Edad / País', value: `${parsedAge} años (${country.trim()})`, inline: true },
            ],
            timestamp: now,
          },
        ],
      }),
    }).catch(() => {});
  }

  res.status(201).json({
    trackingCode,
    status: 'pending',
    message: 'Solicitud enviada correctamente.',
  });
});

router.get('/whitelist/status', (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: 'Ingresa tu código de seguimiento (ej. NL-A1B2-C3D4).' });
  }

  const app = db
    .prepare(
      'SELECT trackingCode, characterName, discordTag, status, staffNote, createdAt, updatedAt FROM whitelist_applications WHERE trackingCode = ?'
    )
    .get(code);

  if (!app) {
    return res.status(404).json({ error: 'No se encontró ninguna solicitud con ese código.' });
  }

  res.json(app);
});

export default router;
