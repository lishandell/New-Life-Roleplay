import crypto from 'node:crypto';

export const ADMIN_COOKIE = 'nl_admin_session';
export const USER_COOKIE = 'nl_user_session';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return process.env.SESSION_SECRET || 'nlrp_dev_fallback_secret_change_in_env';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function createSessionToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[key] = val;
  }
  return cookies;
}

export function getDiscordUserFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[USER_COOKIE];
  return verifySessionToken(token);
}

export function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);

  // 1. Check classic password admin session
  const adminSession = verifySessionToken(cookies[ADMIN_COOKIE]);
  if (adminSession) {
    req.admin = adminSession;
    return next();
  }

  // 2. Check Discord OAuth2 session with Admin role
  const discordUser = verifySessionToken(cookies[USER_COOKIE]);
  if (discordUser && discordUser.isAdmin) {
    req.admin = {
      id: discordUser.discordId,
      username: discordUser.displayName || discordUser.username,
      role: 'discord_admin',
      discordId: discordUser.discordId,
    };
    return next();
  }

  return res.status(401).json({
    error: 'No autorizado. Inicia sesión como administrador o con tu rol Admin de Discord.',
  });
}

export function requireStaffOrAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const adminSession = verifySessionToken(cookies[ADMIN_COOKIE]);
  if (adminSession) {
    req.admin = adminSession;
    return next();
  }

  const discordUser = verifySessionToken(cookies[USER_COOKIE]);
  if (discordUser && (discordUser.isAdmin || discordUser.isStaff)) {
    req.admin = {
      id: discordUser.discordId,
      username: discordUser.displayName || discordUser.username,
      role: discordUser.isAdmin ? 'discord_admin' : 'discord_staff',
      discordId: discordUser.discordId,
    };
    return next();
  }

  return res.status(401).json({
    error: 'Acceso restringido a Staff o Administradores.',
  });
}

export function setCookie(res, name, value, maxAgeMs = TOKEN_TTL_MS) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (isProd) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearCookie(res, name) {
  res.append('Set-Cookie', `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function setSessionCookie(res, token) {
  setCookie(res, ADMIN_COOKIE, token);
}

export function clearSessionCookie(res) {
  clearCookie(res, ADMIN_COOKIE);
}
