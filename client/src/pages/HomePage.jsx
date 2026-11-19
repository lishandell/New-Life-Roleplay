import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  FileCheck2,
} from 'lucide-react';
import { ACCENT_STYLES, DynamicIcon } from '../utils/icons';
import { NewsModal } from '../components/NewsModal';
import { BotConsole } from '../components/BotConsole';

export function HomePage({ data, onToast }) {
  const [newsFilter, setNewsFilter] = useState('all');
  const [selectedNews, setSelectedNews] = useState(null);

  const { settings = {}, news = [], features = [], staff = [] } = data || {};
  const ip = settings.serverIp || 'mta.newliferp.es:22003';

  const filteredNews =
    newsFilter === 'all'
      ? news
      : news.filter((item) => item.category === newsFilter);

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      onToast('Portapapeles', `IP copiada correctamente: ${ip}`, 'success');
    } catch {
      onToast('IP del Servidor', ip, 'info');
    }
  };

  // Highlight a substring inside heroTitle if configured
  const heroTitle = settings.heroTitle || 'Vive tu Nueva Vida sin Reglas Absurdas';
  const highlight = settings.heroHighlight || 'Nueva Vida';
  const titleParts = highlight && heroTitle.includes(highlight)
    ? heroTitle.split(highlight)
    : [heroTitle];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-nl-red/10 via-nl-900/40 to-nl-900 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="flex justify-center mb-2">
            <div className="w-44 sm:w-56 md:w-64 drop-shadow-[0_0_35px_rgba(217,141,117,0.4)]">
              <img
                src="/logo.png"
                alt="New Life Roleplay Logo"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-nl-800/80 border border-nl-red/40 px-4 py-2 rounded-full text-xs font-semibold text-gray-300 glow-red-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                settings.serverStatus === 'online'
                  ? 'bg-emerald-500 animate-pulse'
                  : settings.serverStatus === 'maintenance'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
            <span>
              {settings.serverStatus === 'online'
                ? 'Servidor Activo'
                : settings.serverStatus === 'maintenance'
                ? 'Mantenimiento'
                : 'Servidor Apagado'}{' '}
              •{' '}
              <strong className="text-white">
                {settings.serverStatus === 'offline'
                  ? 0
                  : settings.playersOnline || 0}{' '}
                / {settings.playersMax || 500}
              </strong>{' '}
              Jugadores en línea
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            {titleParts.length > 1 ? (
              <>
                {titleParts[0]}
                <span className="text-nl-red text-glow">{highlight}</span>
                {titleParts.slice(1).join(highlight)}
              </>
            ) : (
              heroTitle
            )}
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            {settings.heroDescription}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={copyIP}
              className="bg-nl-800 hover:bg-nl-700 border border-gray-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all text-sm flex items-center gap-3 group"
            >
              <Server className="w-4 h-4 text-nl-red group-hover:scale-110 transition-transform" />
              Copiar IP: {ip.split(':')[0]}
            </button>

            <Link
              to="/whitelist"
              className="bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white font-bold px-6 py-3.5 rounded-2xl transition-all text-sm flex items-center gap-2.5 shadow-lg glow-red"
            >
              <FileCheck2 className="w-4 h-4" />
              Postular a Whitelist
            </Link>

            <a
              href={settings.discordUrl || 'https://discord.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-6 py-3.5 rounded-2xl transition-all text-sm flex items-center gap-2.5 shadow-lg shadow-[#5865F2]/20"
            >
              <MessageSquare className="w-4 h-4" />
              Discord Oficial
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            <div className="glass-card p-4 rounded-2xl text-center">
              <h4 className="text-2xl md:text-3xl font-extrabold text-white">
                {settings.stat1Value || '0.3s'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {settings.stat1Label || 'Latencia Optimizada'}
              </p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <h4 className="text-2xl md:text-3xl font-extrabold text-nl-red">
                {settings.stat2Value || '100%'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {settings.stat2Label || 'Anti-Cheat Seguro'}
              </p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <h4 className="text-2xl md:text-3xl font-extrabold text-amber-400">
                {settings.stat3Value || '+15'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {settings.stat3Label || 'Facciones Activas'}
              </p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <h4 className="text-2xl md:text-3xl font-extrabold text-emerald-400">
                {settings.stat4Value || '24/7'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {settings.stat4Label || 'Soporte Automatizado'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOTICIAS & CHANGELOGS */}
      <section id="news" className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <span className="text-nl-red text-xs font-bold tracking-widest uppercase">
              Actualizaciones de Contenido
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Últimas Noticias y Changelogs
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-nl-800 p-1 rounded-xl border border-gray-800 text-xs font-semibold">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'update', label: 'Parches' },
              { id: 'event', label: 'Eventos' },
              { id: 'security', label: 'Seguridad' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setNewsFilter(tab.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  newsFilter === tab.id
                    ? 'bg-nl-red text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-gray-400 text-sm">
            No hay noticias publicadas en esta categoría por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredNews.map((item) => {
              const style = ACCENT_STYLES[item.accentColor] || ACCENT_STYLES.copper;
              return (
                <article
                  key={item.id}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
                >
                  <div className="h-48 bg-gradient-to-br from-nl-700 to-nl-800 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/40" />
                    <DynamicIcon
                      name={item.icon}
                      className={`w-14 h-14 relative z-10 ${style.text} group-hover:scale-110 transition-transform duration-300`}
                    />
                    <span
                      className={`absolute top-3 left-3 z-10 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${style.badge}`}
                    >
                      {item.badge}
                    </span>
                    <span className="absolute bottom-3 right-3 z-10 bg-nl-900/80 text-gray-300 text-xs px-2.5 py-1 rounded-lg">
                      {item.publishedAt}
                    </span>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-nl-red transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedNews(item)}
                      className="text-xs font-bold text-nl-red hover:underline flex items-center gap-2 self-start"
                    >
                      Leer notas completas <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CARACTERÍSTICAS */}
      <section id="features" className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-nl-red text-xs font-bold tracking-widest uppercase">
            Mecánicas Únicas
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            ¿Por qué elegir New Life Roleplay?
          </h2>
          <p className="text-xs text-gray-400">
            Diseñado desde cero para ofrecer una experiencia inmersiva, optimizada y sin
            tiempos de carga molestos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const style = ACCENT_STYLES[feat.color] || ACCENT_STYLES.copper;
            return (
              <div
                key={feat.id}
                className="glass-card p-6 rounded-2xl space-y-4 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${style.softBg}`}
                >
                  <DynamicIcon name={feat.icon} className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BOTS & DISCORD */}
      <section id="bots" className="max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-3xl p-8 md:p-12 border border-nl-red/30 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center glow-red-sm">
          <div className="space-y-6">
            <span className="bg-[#5865F2]/20 text-[#818cf8] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Integración Discord Bot
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">
              Bots Inteligentes para tu Control Total
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Nuestro bot oficial en Discord sincroniza automáticamente tu cuenta de
              juego con tus roles, te permite verificar tu serial, consultar saldo
              bancario, reportar bugs y ver el estado en vivo del servidor sin abrir el
              juego.
            </p>
            <div className="space-y-3">
              {[
                'Verificación automática de cuentas y roles VIP.',
                'Alertas en tiempo real de caídas, reinicios y Whitelist.',
                'Sistema de tickets de soporte técnico 24/7.',
              ].map((line, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-nl-red shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <a
                href={settings.discordUrl || 'https://discord.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#5865F2]/20 inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Unirse al Discord Oficial
              </a>
            </div>
          </div>

          <BotConsole settings={settings} />
        </div>
      </section>

      {/* 5. STAFF */}
      <section id="staff" className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-nl-red text-xs font-bold tracking-widest uppercase">
            Equipo de Administración
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Staff al Servicio de la Comunidad
          </h2>
          <p className="text-xs text-gray-400">
            Moderadores, administradores y desarrolladores trabajando para mantener el
            orden.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff.map((member) => {
            const style = ACCENT_STYLES[member.color] || ACCENT_STYLES.copper;
            const initials = member.name.slice(0, 2).toUpperCase();
            return (
              <div
                key={member.id}
                className="glass-card p-5 rounded-2xl text-center space-y-3"
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className={`w-20 h-20 rounded-2xl mx-auto border-2 ${style.border} object-cover`}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-2xl mx-auto border-2 ${style.border} bg-nl-700 flex items-center justify-center text-xl font-black ${style.text}`}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white text-sm">{member.name}</h4>
                  <span className={`text-xs font-semibold ${style.text}`}>
                    {member.role}
                  </span>
                </div>
                <span className="inline-block bg-nl-800 text-gray-300 text-[10px] px-2.5 py-1 rounded-full">
                  {member.status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
