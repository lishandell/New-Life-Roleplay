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

const router = express.Router();

router.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  if (!username.trim() || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }

  const user = db
    .prepare('SELECT id, username, passwordHash, role FROM admin_users WHERE username = ?')
    .get(username.trim());

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

router.post('/change-password', requireAdmin, (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body || {};
  if (!currentPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: 'La nueva contraseña debe tener al menos 8 caracteres.',
    });
  }

  const user = db
    .prepare('SELECT id, passwordHash FROM admin_users WHERE id = ?')
    .get(req.admin.id);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta.' });
  }

  db.prepare('UPDATE admin_users SET passwordHash = ? WHERE id = ?').run(
    hashPassword(newPassword),
    user.id
  );
  res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
});

router.get('/dashboard', requireStaffOrAdmin, (_req, res) => {
  const settingRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of settingRows) settings[r.key] = r.value;

  const news = db.prepare('SELECT * FROM news ORDER BY id DESC').all();
  const features = db
    .prepare('SELECT * FROM features ORDER BY sortOrder ASC, id ASC')
    .all();
  const staff = db.prepare('SELECT * FROM staff ORDER BY sortOrder ASC, id ASC').all();
  const rules = db.prepare('SELECT * FROM rules ORDER BY sortOrder ASC, id ASC').all();
  const whitelist = db
    .prepare('SELECT * FROM whitelist_applications ORDER BY id DESC')
    .all();

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

router.put('/settings', requireAdmin, (req, res) => {
  const updates = req.body || {};
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  for (const [key, value] of Object.entries(updates)) {
    if (typeof key === 'string' && key.length <= 64) {
      upsert.run(key, String(value ?? ''));
    }
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

  const info = db
    .prepare(
      `INSERT INTO news (title, summary, content, category, badge, icon, accentColor, publishedAt, isPublished, isFeatured, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
      now
    );

  const created = db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid);
  if (created.isPublished === 1) {
    notifyNewsPublished(created).catch(() => {});
  }
  res.status(201).json(created);
});

router.put('/news/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
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
  db.prepare(
    `UPDATE news SET title = ?, summary = ?, content = ?, category = ?, badge = ?, icon = ?, accentColor = ?, publishedAt = ?, isPublished = ?, isFeatured = ?, updatedAt = ? WHERE id = ?`
  ).run(
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
    id
  );

  const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  if (existing.isPublished === 0 && updated.isPublished === 1) {
    notifyNewsPublished(updated).catch(() => {});
  }
  res.json(updated);
});

router.delete('/news/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- FEATURES CRUD ---
router.post('/features', requireAdmin, (req, res) => {
  const { title = '', description = '', icon = 'car', color = 'copper', sortOrder = 0 } =
    req.body || {};
  if (!title.trim() || !description.trim()) {
    return res.status(400).json({ error: 'Título y descripción requeridos.' });
  }
  const info = db
    .prepare(
      'INSERT INTO features (title, description, icon, color, sortOrder) VALUES (?, ?, ?, ?, ?)'
    )
    .run(title.trim(), description.trim(), icon, color, Number(sortOrder) || 0);
  res.status(201).json(db.prepare('SELECT * FROM features WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/features/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM features WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Característica no encontrada.' });

  const {
    title = existing.title,
    description = existing.description,
    icon = existing.icon,
    color = existing.color,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  db.prepare(
    'UPDATE features SET title = ?, description = ?, icon = ?, color = ?, sortOrder = ? WHERE id = ?'
  ).run(title.trim(), description.trim(), icon, color, Number(sortOrder) || 0, id);

  res.json(db.prepare('SELECT * FROM features WHERE id = ?').get(id));
});

router.delete('/features/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM features WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- STAFF CRUD ---
router.post('/staff', requireAdmin, (req, res) => {
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
  const info = db
    .prepare(
      'INSERT INTO staff (name, role, status, color, avatarUrl, sortOrder) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(name.trim(), role.trim(), status.trim(), color, avatarUrl.trim(), Number(sortOrder) || 0);
  res.status(201).json(db.prepare('SELECT * FROM staff WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/staff/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Miembro no encontrado.' });

  const {
    name = existing.name,
    role = existing.role,
    status = existing.status,
    color = existing.color,
    avatarUrl = existing.avatarUrl,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  db.prepare(
    'UPDATE staff SET name = ?, role = ?, status = ?, color = ?, avatarUrl = ?, sortOrder = ? WHERE id = ?'
  ).run(name.trim(), role.trim(), status.trim(), color, avatarUrl.trim(), Number(sortOrder) || 0, id);

  res.json(db.prepare('SELECT * FROM staff WHERE id = ?').get(id));
});

router.delete('/staff/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- RULES CRUD ---
router.post('/rules', requireAdmin, (req, res) => {
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
  const info = db
    .prepare(
      'INSERT INTO rules (category, title, description, severity, sortOrder) VALUES (?, ?, ?, ?, ?)'
    )
    .run(category.trim(), title.trim(), description.trim(), severity, Number(sortOrder) || 0);
  res.status(201).json(db.prepare('SELECT * FROM rules WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/rules/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Regla no encontrada.' });

  const {
    category = existing.category,
    title = existing.title,
    description = existing.description,
    severity = existing.severity,
    sortOrder = existing.sortOrder,
  } = req.body || {};

  db.prepare(
    'UPDATE rules SET category = ?, title = ?, description = ?, severity = ?, sortOrder = ? WHERE id = ?'
  ).run(category.trim(), title.trim(), description.trim(), severity, Number(sortOrder) || 0, id);

  res.json(db.prepare('SELECT * FROM rules WHERE id = ?').get(id));
});

router.delete('/rules/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM rules WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- WHITELIST REVIEW ---
router.patch('/whitelist/:id', requireStaffOrAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM whitelist_applications WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  const { status, staffNote = '' } = req.body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE whitelist_applications SET status = ?, staffNote = ?, reviewedBy = ?, updatedAt = ? WHERE id = ?'
  ).run(status, staffNote.trim(), req.admin.username, now, id);

  const updated = db.prepare('SELECT * FROM whitelist_applications WHERE id = ?').get(id);
  if (status === 'approved' || status === 'rejected') {
    notifyWhitelistResult(updated).catch(() => {});
  }
  if (status === 'approved' && updated.discordId) {
    assignDiscordWhitelistRole(updated.discordId).catch(() => {});
  }

  res.json(updated);
});

router.delete('/whitelist/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM whitelist_applications WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
