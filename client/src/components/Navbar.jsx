import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Copy, Play, Menu, X, LogIn, LogOut, Shield } from 'lucide-react';

export function Navbar({
  settings,
  discordUser,
  oauthConfigured,
  onDiscordLogout,
  onToast,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const serverName = settings?.serverName || 'NEW LIFE ROLEPLAY';
  const nameParts = serverName.split(' ');
  const lastWord = nameParts.length > 1 ? nameParts.pop() : '';
  const firstWords = nameParts.join(' ');
  const ip = settings?.serverIp || 'mta.newliferp.es:22003';
  const status = settings?.serverStatus || 'online';

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      onToast('Portapapeles', `IP copiada: ${ip}`, 'success');
    } catch {
      onToast('IP del Servidor', ip, 'info');
    }
  };

  const launchMTA = () => {
    onToast('MTA:SA', `Conectando a mta://${ip}...`, 'success');
    window.location.href = `mtasa://${ip}`;
  };

  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-nl-900/90 backdrop-blur-xl border-b border-gray-800/80">
      {settings?.maintenanceBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-medium text-center py-1.5 px-4">
          {settings.maintenanceBanner}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-nl-800 border border-nl-red/40 flex items-center justify-center p-1 glow-red-sm">
            <img
              src="/logo.png"
              alt="New Life Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-wider text-sm md:text-base uppercase block leading-tight">
              {firstWords}{' '}
              {lastWord && <span className="text-nl-red">{lastWord}</span>}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase block">
              {settings?.serverSubtitle || 'MTA:SA Hardcore'}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-gray-300">
          <Link
            to="/"
            className={`hover:text-nl-red transition-colors ${
              isHome ? 'text-white' : ''
            }`}
          >
            Inicio
          </Link>
          <a
            href={isHome ? '#news' : '/#news'}
            className="hover:text-nl-red transition-colors"
          >
            Noticias
          </a>
          <a
            href={isHome ? '#features' : '/#features'}
            className="hover:text-nl-red transition-colors"
          >
            Características
          </a>
          <Link
            to="/reglamento"
            className={`hover:text-nl-red transition-colors ${
              location.pathname === '/reglamento' ? 'text-nl-red' : ''
            }`}
          >
            Reglamento
          </Link>
          <Link
            to="/whitelist"
            className={`hover:text-nl-red transition-colors flex items-center gap-1.5 ${
              location.pathname === '/whitelist' ? 'text-nl-red' : ''
            }`}
          >
            Whitelist
            {settings?.whitelistEnabled === 'true' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-nl-800 border border-gray-700/60 px-3 py-1.5 rounded-xl">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'online'
                  ? 'bg-emerald-500 animate-pulse'
                  : status === 'maintenance'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-mono text-gray-300 select-all">{ip}</span>
            <button
              onClick={copyIP}
              className="text-gray-400 hover:text-white bg-nl-700 p-1 rounded transition-colors"
              title="Copiar IP"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={launchMTA}
            className="bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white text-xs md:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg glow-red transition-all flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Jugar</span>
          </button>

          {discordUser ? (
            <div className="hidden sm:flex items-center gap-2 bg-nl-800 border border-gray-700/80 pl-2 pr-2.5 py-1 rounded-xl">
              <img
                src={discordUser.avatarUrl}
                alt={discordUser.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-nl-red/40"
              />
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block max-w-[110px] truncate">
                  {discordUser.displayName}
                </span>
                <span className="text-[10px] font-semibold text-nl-red block">
                  {discordUser.isAdmin
                    ? 'Admin'
                    : discordUser.isStaff
                    ? 'Staff'
                    : discordUser.isVip
                    ? 'VIP'
                    : discordUser.isWhitelisted
                    ? 'Whitelist'
                    : 'Miembro'}
                </span>
              </div>
              {(discordUser.isAdmin || discordUser.isStaff) && (
                <Link
                  to="/portal-nl-admin"
                  className="p-1.5 rounded-lg bg-nl-red/15 text-nl-red hover:bg-nl-red hover:text-white transition-colors"
                  title="Panel Administrativo"
                >
                  <Shield className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                onClick={onDiscordLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                title="Cerrar sesión de Discord"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!oauthConfigured) {
                  onToast(
                    'Discord OAuth2',
                    'Configura DISCORD_CLIENT_ID y DISCORD_CLIENT_SECRET en Render/.env para activar el login.',
                    'info'
                  );
                  return;
                }
                window.location.href = '/api/auth/discord';
              }}
              className="hidden sm:flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Discord
            </button>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl bg-nl-800 border border-gray-800 text-gray-300 hover:text-white"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-nl-900 px-6 py-4 space-y-3 text-sm font-semibold">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block py-1.5 text-gray-200 hover:text-nl-red"
          >
            Inicio
          </Link>
          <a
            href="/#news"
            onClick={() => setMobileOpen(false)}
            className="block py-1.5 text-gray-200 hover:text-nl-red"
          >
            Noticias & Parches
          </a>
          <a
            href="/#features"
            onClick={() => setMobileOpen(false)}
            className="block py-1.5 text-gray-200 hover:text-nl-red"
          >
            Características
          </a>
          <Link
            to="/reglamento"
            onClick={() => setMobileOpen(false)}
            className="block py-1.5 text-gray-200 hover:text-nl-red"
          >
            Reglamento
          </Link>
          <Link
            to="/whitelist"
            onClick={() => setMobileOpen(false)}
            className="block py-1.5 text-nl-red"
          >
            Whitelist
          </Link>
          <button
            onClick={copyIP}
            className="w-full mt-2 flex items-center justify-between bg-nl-800 border border-gray-700 px-3 py-2 rounded-xl text-xs font-mono text-gray-300"
          >
            <span>{ip}</span>
            <Copy className="w-3.5 h-3.5 text-nl-red" />
          </button>
        </div>
      )}
    </header>
  );
}
