import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usePostgres = Boolean(process.env.DATABASE_URL);

let sqliteDb = null;
let pgPool = null;

if (usePostgres) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });
} else {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  sqliteDb = new DatabaseSync(path.join(dataDir, 'newlife.db'));
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
}

function toPgParams(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export const db = {
  isPostgres: usePostgres,

  async get(sql, params = []) {
    if (usePostgres) {
      const res = await pgPool.query(toPgParams(sql), params);
      return res.rows[0] || null;
    }
    return sqliteDb.prepare(sql).get(...params) || null;
  },

  async all(sql, params = []) {
    if (usePostgres) {
      const res = await pgPool.query(toPgParams(sql), params);
      return res.rows;
    }
    return sqliteDb.prepare(sql).all(...params);
  },

  async run(sql, params = []) {
    if (usePostgres) {
      await pgPool.query(toPgParams(sql), params);
      return { ok: true };
    }
    sqliteDb.prepare(sql).run(...params);
    return { ok: true };
  },

  async insert(sql, params = []) {
    if (usePostgres) {
      const pgSql = `${toPgParams(sql)} RETURNING id`;
      const res = await pgPool.query(pgSql, params);
      return res.rows[0]?.id;
    }
    const info = sqliteDb.prepare(sql).run(...params);
    return Number(info.lastInsertRowid);
  },
};

export async function initDatabase() {
  const idCol = usePostgres
    ? 'SERIAL PRIMARY KEY'
    : 'INTEGER PRIMARY KEY AUTOINCREMENT';

  const ddl = `
    CREATE TABLE IF NOT EXISTS settings (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      "id" ${idCol},
      "title" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'update',
      "badge" TEXT NOT NULL DEFAULT 'Parche',
      "icon" TEXT NOT NULL DEFAULT 'rocket',
      "accentColor" TEXT NOT NULL DEFAULT 'copper',
      "publishedAt" TEXT NOT NULL,
      "isPublished" INTEGER NOT NULL DEFAULT 1,
      "isFeatured" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS features (
      "id" ${idCol},
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT 'car',
      "color" TEXT NOT NULL DEFAULT 'copper',
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS staff (
      "id" ${idCol},
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Activo en Discord',
      "color" TEXT NOT NULL DEFAULT 'copper',
      "avatarUrl" TEXT NOT NULL DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rules (
      "id" ${idCol},
      "category" TEXT NOT NULL DEFAULT 'General',
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "severity" TEXT NOT NULL DEFAULT 'Alta',
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS whitelist_applications (
      "id" ${idCol},
      "trackingCode" TEXT NOT NULL UNIQUE,
      "discordId" TEXT NOT NULL DEFAULT '',
      "discordTag" TEXT NOT NULL,
      "age" INTEGER NOT NULL,
      "country" TEXT NOT NULL,
      "mtaSerial" TEXT NOT NULL DEFAULT '',
      "characterName" TEXT NOT NULL,
      "characterBackstory" TEXT NOT NULL,
      "rpConcepts" TEXT NOT NULL,
      "scenarioAnswer" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "staffNote" TEXT NOT NULL DEFAULT '',
      "reviewedBy" TEXT NOT NULL DEFAULT '',
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      "id" ${idCol},
      "username" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'owner',
      "createdAt" TEXT NOT NULL
    );
  `;

  if (usePostgres) {
    await pgPool.query(ddl);
  } else {
    sqliteDb.exec(ddl);
    try {
      sqliteDb.exec(
        'ALTER TABLE whitelist_applications ADD COLUMN "discordId" TEXT NOT NULL DEFAULT \'\''
      );
    } catch {
      // Already exists
    }
  }

  await seedDefaults();
}

async function seedDefaults() {
  const now = new Date().toISOString();

  // 1. Seed default admin user if empty
  const adminRow = await db.get('SELECT COUNT(*) as count FROM admin_users');
  if (Number(adminRow?.count || 0) === 0) {
    const defaultUser = process.env.ADMIN_USER || 'admin';
    const defaultPass = process.env.ADMIN_PASS || 'NewLife2026!';
    await db.run(
      'INSERT INTO admin_users ("username", "passwordHash", "role", "createdAt") VALUES (?, ?, ?, ?)',
      [defaultUser, hashPassword(defaultPass), 'owner', now]
    );
  }

  // 2. Seed default site settings
  const defaultSettings = {
    serverName: 'NEW LIFE ROLEPLAY',
    serverSubtitle: 'MTA:SA Hardcore',
    serverIp: '172.96.140.62:7323',
    discordUrl: 'https://discord.com',
    playersOnline: '468',
    playersMax: '500',
    serverStatus: 'online',
    heroTitle: 'Vive tu Nueva Vida sin Reglas Absurdas',
    heroHighlight: 'Nueva Vida',
    heroDescription:
      'El servidor de MTA:SA Roleplay definitivo con economía avanzada, facciones legales e ilegales activas, garajes personalizados y soporte 24/7 mediante nuestros bots inteligentes.',
    stat1Value: '0.3s',
    stat1Label: 'Latencia Optimizada',
    stat2Value: '100%',
    stat2Label: 'Anti-Cheat Seguro',
    stat3Value: '+15',
    stat3Label: 'Facciones Activas',
    stat4Value: '24/7',
    stat4Label: 'Soporte Automatizado',
    whitelistEnabled: 'true',
    whitelistMessage:
      'Las postulaciones a la Whitelist están abiertas. Completa tu historia de personaje y conocimientos de rol para unirte a la ciudad.',
    maintenanceBanner: '',
    discordWebhookUrl: '',
    discordNewsWebhookUrl: '',
    discordAdminRoleIds: '',
    discordStaffRoleIds: '',
    discordVipRoleIds: '',
    discordWhitelistRoleIds: '',
    autoStatusEnabled: 'true',
    autoDiscordStatusEnabled: 'false',
    discordStatusIntervalMinutes: '30',
    discordStatusWebhookUrl: '',
    statusEmbedName: 'New Life Roleplay | Roleplay | Español | Latino',
    statusEmbedMode: 'Roleplay',
    statusEmbedAdmin: 'New Life Staff',
    statusEmbedPlayersText: '',
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    await db.run(
      'INSERT INTO settings ("key", "value") VALUES (?, ?) ON CONFLICT ("key") DO NOTHING',
      [k, String(v)]
    );
  }

  // 3. Remove factory/demo news if present (never re-seed demo news)
  await db.run(
    'DELETE FROM news WHERE "title" IN (?, ?, ?)',
    [
      'Actualización Verano 2026: Nuevos Garajes & Tuning',
      'Gran Evento de Carreras Clandestinas en Las Venturas',
      'Mejoras en el Sistema Anti-Cheat y Verificación 2FA',
    ]
  );

  // 4. Remove factory/demo features if present (never re-seed demo features)
  await db.run(
    'DELETE FROM features WHERE "title" IN (?, ?, ?, ?)',
    [
      'Garajes & Tuning Avanzado',
      'Economía Realista',
      'Facciones & Bandas',
      'Soporte In-Game & Bots',
    ]
  );

  // 5. Remove factory/demo staff if present (never re-seed demo staff)
  await db.run(
    'DELETE FROM staff WHERE "name" IN (?, ?, ?, ?)',
    ['Zack_Miller', 'Kira_Yagami', 'Lucas_Gomez', 'Matrix_01']
  );

  // 6. Seed rules if empty
  const rulesRow = await db.get('SELECT COUNT(*) as count FROM rules');
  if (Number(rulesRow?.count || 0) === 0) {
    const sql =
      'INSERT INTO rules ("category", "title", "description", "severity", "sortOrder") VALUES (?, ?, ?, ?, ?)';
    await db.run(sql, [
      'Conceptos Básicos',
      'Metagaming (MG)',
      'Queda estrictamente prohibido utilizar información obtenida fuera del juego (Discord, streams, OOC) para beneficiar a tu personaje dentro del rol (IC).',
      'Alta',
      1,
    ]);
    await db.run(sql, [
      'Conceptos Básicos',
      'Powergaming (PG)',
      'Realizar acciones físicamente imposibles para un ser humano o forzar el rol de otro jugador sin darle oportunidad de responder.',
      'Alta',
      2,
    ]);
    await db.run(sql, [
      'Combate y Rol',
      'Deathmatch (DM) & RDM',
      'Atacar, herir o asesinar a otro jugador sin una razón de rol válida, previa y coherente con la situación.',
      'Crítica',
      3,
    ]);
    await db.run(sql, [
      'Combate y Rol',
      'Revenge Kill (RK)',
      'Regresar al lugar donde tu personaje fue abatido o buscar venganza contra quienes te mataron tras reaparecer.',
      'Alta',
      4,
    ]);
    await db.run(sql, [
      'Comunidad',
      'Respeto OOC & Cero Toxicidad',
      'Cualquier insulto, acoso, discriminación o falta de respeto fuera de personaje (OOC) tanto in-game como en Discord será sancionado.',
      'Crítica',
      5,
    ]);
  }
}
