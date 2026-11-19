import express from 'express';
import { db } from '../db.js';
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  requireAdmin,
  requireStaffOrAdmin,
  setSessionCookie,
  verifyPassword,
} from '../auth.js';
import {
  assignDiscordWhitelistRole,
  notifyNewsPublished,
  notifyWhitelistResult,
} from '../utils/discordNotify.js';
import {
  refreshLiveMtaStatus,
  sendServerStatusEmbedToDiscord,
} from '../utils/mtaQuery.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username = '', password = '' } = req.body || {};
  if (!username.trim() || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }

  const user = await db.get(
    'SELECT "id", "username", "passwordHash", "role" FROM admin_users WHERE "username" = ?',
    [username.trim()]
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = createSessionToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  setSessionCookie(res, token);

  res.json({
    authenticated: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireStaffOrAdmin, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.admin.id,
      username: req.admin.username,
      role: req.admin.role,
    },
  });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body || {};
  if (!currentPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: 'La nueva contraseña debe tener al menos 8 caracteres.',
    });
  }

  const user = await db.get(
    'SELECT "id", "passwordHash" FROM admin_users WHERE "id" = ?',
    [req.admin.id]
  );
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta.' });
  }

  await db.run('UPDATE admin_users SET "passwordHash" = ? WHERE "id" = ?', [
    hashPassword(newPassword),
    user.id,
  ]);
  res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
});

router.get('/dashboard', requireStaffOrAdmin, async (_req, res) => {
  const [settingRows, news, features, staff, rules, whitelist] = await Promise.all([
    db.all('SELECT "key", "value" FROM settings'),
    db.all('SELECT * FROM news ORDER BY "id" DESC'),
    db.all('SELECT * FROM features ORDER BY "sortOrder" ASC, "id" ASC'),
    db.all('SELECT * FROM staff ORDER BY "sortOrder" ASC, "id" ASC'),
    db.all('SELECT * FROM rules ORDER BY "sortOrder" ASC, "id" ASC'),
    db.all('SELECT * FROM whitelist_applications ORDER BY "id" DESC'),
  ]);

  const settings = {};
  for (const r of settingRows) settings[r.key] = r.value;

  const stats = {
    totalNews: news.length,
    publishedNews: news.filter((n) => n.isPublished === 1).length,
    pendingWhitelist: whitelist.filter((w) => w.status === 'pending').length,
    totalWhitelist: whitelist.length,
    totalStaff: staff.length,
    totalRules: rules.length,
  };

  res.json({ settings, news, features, staff, rules, whitelist, stats });
});

router.put('/settings', requireAdmin, async (req, res) => {
  const updates = req.body || {};
  for (const [key, value] of Object.entries(updates)) {
    if (typeof key === 'string' && key.length <= 64) {
      await db.run(
        'INSERT INTO settings ("key", "value") VALUES (?, ?) ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"',
        [key, String(value ?? '')]
      );
    }
  }
  res.json({ ok: true });
});

router.post('/mta/check', requireAdmin, async (_req, res) => {
  const status = await refreshLiveMtaStatus();
  res.json(status);
});

router.post('/discord/send-status', requireAdmin, async (_req, res) => {
  const result = await sendServerStatusEmbedToDiscord();
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ ok: true });
});

// --- NEWS CRUD ---
router.post('/news', requireAdmin, async (req, res) => {
  const {
    title = '',
    summary = '',
    content = '',
    category = 'update',
    badge = 'Parche',
    icon = 'rocket',
    accentColor = 'copper',
    publishedAt = '',
    isPublished = 1,
    isFeatured = 0,
  } = req.body || {};

  if (!title.trim() || !summary.trim()) {
    return res.status(400).json({ error: 'Título y resumen son obligatorios.' });
  }

  const now = new Date().toISOString();
  const displayDate =
    publishedAt.trim() ||
    new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const newId = await db.insert(
    `INSERT INTO news ("title", "summary", "content", "category", "badge", "icon", "accentColor", "publishedAt", "isPublished", "isFeatured", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      summary.trim(),
      (content || summary).trim(),
      category,
      badge.trim() || 'Actualización',
      icon,
      accentColor,
      displayDate,
      isPublished ? 1 : 0,
      isFeatured ? 1 : 0,
      now,
      now,
    ]
  );

  const created = await db.get('SELECT * FROM news WHERE "id" = ?', [newId]);
  if (created?.isPublished === 1) {
    notifyNewsPublished(created).catch(() => {});
  }
  res.status(201).json(created);
});

router.put('/news/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM news WHERE "id" = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Noticia no encontrada.' });

  const {
    title = existing.title,
    summary = existing.summary,
    content = existing.content,
    category = existing.category,
    badge = existing.badge,
    icon = existing.icon,
    accentColor = existing.accentColor,
    publishedAt = existing.publishedAt,
    isPublished = existing.isPublished,
    isFeatured = existing.isFeatured,
  } = req.body || {};

  const now = new Date().toISOString();
  await db.run(
    `UPDATE news SET "title" = ?, "summary" = ?, "content" = ?, "category" = ?, "badge" = ?, "icon" = ?, "accentColor" = ?, "publishedAt" = ?, "isPublished" = ?, "isFeatured" = ?, "updatedAt" = ? WHERE "id" = ?`,
    [
      title.trim(),
      summary.trim(),
      content.trim(),
      category,
      badge.trim(),
      icon,
      accentColor,
      publishedAt.trim(),
      isPublished ? 1 : 0,
      isFeatured ? 1 : 0,
      now,
      id,
    ]
  );

  const updated = await db.get('SELECT * FROM news WHERE "id" = ?', [id]);
  if (existing.isPublished === 0 && updated?.isPublished === 1) {
    notifyNewsPublished(updated).catch(() => {});
  }
  res.json(updated);
});

router.delete('/news/:id', requireAdmin, async (req, res) => {
  await db.run('DELETE FROM news WHERE "id" = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- FEATURES CRUD ---
router.post('/features', requireAdmin, async (req, res) => {
  const { title = '', description = '', icon = 'car', color = 'copper', sortOrder = 0 } =
    req.body || {};
  if (!title.trim() || !description.trim()) {
    return res.status(400).json({ error: 'Título y descripción requeridos.' });
  }
  const newId = await db.insert(
    'INSERT INTO features ("title", "description", "icon", "color", "sortOrder") VALUES (?, ?, ?, ?, ?)',
    [title.trim(), description.trim(), icon, color, Number(sortOrder) || 0]
  );
  res.status(201).json(await db.get('SELECT * FROM features WHERE "id" = ?', [newId]));
});

router.put('/features/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM features WHERE "id" = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Característica no encontrada.' });

  const {
    title = existing.title,
    description = existing.description,
    icon = existing.icon,
    color = existing.color,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  await db.run(
    'UPDATE features SET "title" = ?, "description" = ?, "icon" = ?, "color" = ?, "sortOrder" = ? WHERE "id" = ?',
    [title.trim(), description.trim(), icon, color, Number(sortOrder) || 0, id]
  );

  res.json(await db.get('SELECT * FROM features WHERE "id" = ?', [id]));
});

router.delete('/features/:id', requireAdmin, async (req, res) => {
  await db.run('DELETE FROM features WHERE "id" = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- STAFF CRUD ---
router.post('/staff', requireAdmin, async (req, res) => {
  const {
    name = '',
    role = '',
    status = 'Activo en Discord',
    color = 'copper',
    avatarUrl = '',
    sortOrder = 0,
  } = req.body || {};
  if (!name.trim() || !role.trim()) {
    return res.status(400).json({ error: 'Nombre y rol requeridos.' });
  }
  const newId = await db.insert(
    'INSERT INTO staff ("name", "role", "status", "color", "avatarUrl", "sortOrder") VALUES (?, ?, ?, ?, ?, ?)',
    [name.trim(), role.trim(), status.trim(), color, avatarUrl.trim(), Number(sortOrder) || 0]
  );
  res.status(201).json(await db.get('SELECT * FROM staff WHERE "id" = ?', [newId]));
});

router.put('/staff/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM staff WHERE "id" = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Miembro no encontrado.' });

  const {
    name = existing.name,
    role = existing.role,
    status = existing.status,
    color = existing.color,
    avatarUrl = existing.avatarUrl,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  await db.run(
    'UPDATE staff SET "name" = ?, "role" = ?, "status" = ?, "color" = ?, "avatarUrl" = ?, "sortOrder" = ? WHERE "id" = ?',
    [name.trim(), role.trim(), status.trim(), color, avatarUrl.trim(), Number(sortOrder) || 0, id]
  );

  res.json(await db.get('SELECT * FROM staff WHERE "id" = ?', [id]));
});

router.delete('/staff/:id', requireAdmin, async (req, res) => {
  await db.run('DELETE FROM staff WHERE "id" = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- RULES CRUD ---
router.post('/rules', requireAdmin, async (req, res) => {
  const {
    category = 'General',
    title = '',
    description = '',
    severity = 'Alta',
    sortOrder = 0,
  } = req.body || {};
  if (!title.trim() || !description.trim()) {
    return res.status(400).json({ error: 'Título y descripción requeridos.' });
  }
  const newId = await db.insert(
    'INSERT INTO rules ("category", "title", "description", "severity", "sortOrder") VALUES (?, ?, ?, ?, ?)',
    [category.trim(), title.trim(), description.trim(), severity, Number(sortOrder) || 0]
  );
  res.status(201).json(await db.get('SELECT * FROM rules WHERE "id" = ?', [newId]));
});

router.put('/rules/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM rules WHERE "id" = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Regla no encontrada.' });

  const {
    category = existing.category,
    title = existing.title,
    description = existing.description,
    severity = existing.severity,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  await db.run(
    'UPDATE rules SET "category" = ?, "title" = ?, "description" = ?, "severity" = ?, "sortOrder" = ? WHERE "id" = ?',
    [category.trim(), title.trim(), description.trim(), severity, Number(sortOrder) || 0, id]
  );

  res.json(await db.get('SELECT * FROM rules WHERE "id" = ?', [id]));
});

router.delete('/rules/:id', requireAdmin, async (req, res) => {
  await db.run('DELETE FROM rules WHERE "id" = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- WHITELIST REVIEW ---
router.patch('/whitelist/:id', requireStaffOrAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get('SELECT * FROM whitelist_applications WHERE "id" = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  const { status, staffNote = '' } = req.body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const now = new Date().toISOString();
  await db.run(
    'UPDATE whitelist_applications SET "status" = ?, "staffNote" = ?, "reviewedBy" = ?, "updatedAt" = ? WHERE "id" = ?',
    [status, staffNote.trim(), req.admin.username, now, id]
  );

  const updated = await db.get('SELECT * FROM whitelist_applications WHERE "id" = ?', [id]);
  if (status === 'approved' || status === 'rejected') {
    notifyWhitelistResult(updated).catch(() => {});
  }
  if (status === 'approved' && updated?.discordId) {
    assignDiscordWhitelistRole(updated.discordId).catch(() => {});
  }

  res.json(updated);
});

router.delete('/whitelist/:id', requireAdmin, async (req, res) => {
  await db.run('DELETE FROM whitelist_applications WHERE "id" = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

export default router;
