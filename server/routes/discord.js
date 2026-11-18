import express from 'express';
import {
  USER_COOKIE,
  clearCookie,
  createSessionToken,
  getDiscordUserFromRequest,
  setCookie,
} from '../auth.js';
import { getSetting, parseIdList } from '../utils/discordNotify.js';

const router = express.Router();

function getRedirectUri(req) {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}/api/auth/discord/callback`;
}

function isOAuthConfigured() {
  return Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
  );
}

router.get('/me', (req, res) => {
  const user = getDiscordUserFromRequest(req);
  res.json({
    oauthConfigured: isOAuthConfigured(),
    user: user || null,
  });
});

router.post('/logout', (_req, res) => {
  clearCookie(res, USER_COOKIE);
  res.json({ ok: true });
});

router.get('/discord', (req, res) => {
  if (!isOAuthConfigured()) {
    return res.redirect('/?auth_error=discord_not_configured');
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: 'identify guilds.members.read',
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get('/discord/callback', async (req, res) => {
  const code = String(req.query.code || '');
  if (!code || !isOAuthConfigured()) {
    return res.redirect('/?auth_error=oauth_cancelled');
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(req),
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect('/?auth_error=token_exchange_failed');
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Discord user identity
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      return res.redirect('/?auth_error=user_fetch_failed');
    }
    const discordUser = await userRes.json();

    // 3. Fetch server nickname & roles if DISCORD_GUILD_ID is configured
    let inGuild = false;
    let guildNick = '';
    let roleIds = [];
    const guildId = process.env.DISCORD_GUILD_ID;

    if (guildId) {
      const memberRes = await fetch(
        `https://discord.com/api/users/@me/guilds/${guildId}/member`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (memberRes.ok) {
        const member = await memberRes.json();
        inGuild = true;
        guildNick = member.nick || '';
        roleIds = Array.isArray(member.roles) ? member.roles : [];
      }
    }

    // 4. Evaluate role permissions from DB settings or .env
    const adminRoles = parseIdList(
      getSetting('discordAdminRoleIds') || process.env.DISCORD_ADMIN_ROLE_IDS
    );
    const staffRoles = parseIdList(
      getSetting('discordStaffRoleIds') || process.env.DISCORD_STAFF_ROLE_IDS
    );
    const vipRoles = parseIdList(
      getSetting('discordVipRoleIds') || process.env.DISCORD_VIP_ROLE_IDS
    );
    const wlRoles = parseIdList(
      getSetting('discordWhitelistRoleIds') ||
        process.env.DISCORD_WHITELIST_ROLE_IDS
    );

    const hasAny = (targetList) =>
      targetList.some((id) => roleIds.includes(id));

    const isAdmin = hasAny(adminRoles);
    const isStaff = isAdmin || hasAny(staffRoles);
    const isVip = hasAny(vipRoles);
    const isWhitelisted = hasAny(wlRoles);

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${
          Number(BigInt(discordUser.id) % 5n)
        }.png`;

    const displayName =
      guildNick || discordUser.global_name || discordUser.username;

    const sessionPayload = {
      discordId: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name || discordUser.username,
      guildNick,
      displayName,
      avatarUrl,
      inGuild,
      roleIds,
      isAdmin,
      isStaff,
      isVip,
      isWhitelisted,
    };

    const token = createSessionToken(sessionPayload);
    setCookie(res, USER_COOKIE, token);

    res.redirect('/?auth_success=1');
  } catch {
    res.redirect('/?auth_error=unexpected_error');
  }
});

export default router;
