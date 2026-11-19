import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Shield, FileCheck2, Briefcase, LifeBuoy, LogIn } from 'lucide-react';
import { api } from '../api/client';

export function ProfilePage({ discordUser }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (discordUser) {
      setLoading(true);
      api
        .getProfileSummary()
        .then(setSummary)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [discordUser]);

  if (!discordUser) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-5">
        <div className="glass-card rounded-3xl p-10 space-y-4">
          <UserCheck className="w-12 h-12 text-nl-red mx-auto" />
          <h1 className="text-2xl font-black text-white">Perfil del Ciudadano</h1>
          <p className="text-xs text-gray-400">
            Conecta tu cuenta de Discord para ver tu tarjeta de ciudadano, tus roles
            sincronizados y el estado de todas tus postulaciones y tickets.
          </p>
          <a
            href="/api/auth/discord"
            className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-6 py-3 rounded-xl"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión con Discord
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Citizen ID Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-nl-red/40 flex flex-col sm:flex-row items-center justify-between gap-6 glow-red-sm">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={discordUser.avatarUrl}
            alt={discordUser.displayName}
            className="w-24 h-24 rounded-3xl border-2 border-nl-red object-cover"
          />
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-nl-red">
              Identificación Oficial • New Life RP
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {discordUser.displayName}
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              @{discordUser.username} • Discord ID: {discordUser.discordId}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              {discordUser.isAdmin && (
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-nl-red text-white">
                  Administrador
                </span>
              )}
              {discordUser.isStaff && !discordUser.isAdmin && (
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-blue-500 text-white">
                  Staff
                </span>
              )}
              {discordUser.isVip && (
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-amber-500 text-black">
                  VIP
                </span>
              )}
              {discordUser.isWhitelisted && (
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500 text-white">
                  Whitelist Activa
                </span>
              )}
              <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full bg-nl-800 text-gray-300 border border-gray-700">
                {discordUser.inGuild ? 'En el Discord Oficial' : 'Visitante Web'}
              </span>
            </div>
          </div>
        </div>

        {(discordUser.isAdmin || discordUser.isStaff) && (
          <Link
            to="/portal-nl-admin"
            className="bg-gradient-to-r from-nl-red to-nl-darkred text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-2 shrink-0"
          >
            <Shield className="w-4 h-4" /> Abrir Panel Admin
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center text-xs text-gray-400 py-8">
          Cargando historial del jugador...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Whitelist History */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-nl-red" />
              Mis Postulaciones Whitelist
            </h2>
            {(summary?.whitelistApps || []).length === 0 ? (
              <p className="text-xs text-gray-400">No has enviado solicitudes de Whitelist.</p>
            ) : (
              <div className="space-y-2.5">
                {summary.whitelistApps.map((app) => (
                  <div
                    key={app.trackingCode}
                    className="bg-nl-900/80 border border-gray-800 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-nl-red font-bold">
                        {app.trackingCode}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : app.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {app.status === 'approved'
                          ? 'Aprobada'
                          : app.status === 'rejected'
                          ? 'Rechazada'
                          : 'Pendiente'}
                      </span>
                    </div>
                    <div className="text-white font-semibold">{app.characterName}</div>
                    {app.staffNote && (
                      <div className="text-gray-400">Nota: {app.staffNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Faction Applications */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-nl-red" />
              Mis Oposiciones a Facciones
            </h2>
            {(summary?.factionApps || []).length === 0 ? (
              <p className="text-xs text-gray-400">No has postulado a ninguna facción.</p>
            ) : (
              <div className="space-y-2.5">
                {summary.factionApps.map((app) => (
                  <div
                    key={app.trackingCode}
                    className="bg-nl-900/80 border border-gray-800 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-nl-red font-bold">
                        {app.trackingCode}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : app.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {app.status === 'approved'
                          ? 'Aceptado'
                          : app.status === 'rejected'
                          ? 'Rechazado'
                          : 'En Revisión'}
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      {app.factionName} ({app.characterName})
                    </div>
                    {app.staffNote && (
                      <div className="text-gray-400">Nota: {app.staffNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Tickets */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-nl-red" />
              Mis Tickets & Apelaciones
            </h2>
            {(summary?.supportTickets || []).length === 0 ? (
              <p className="text-xs text-gray-400">No has abierto tickets de soporte.</p>
            ) : (
              <div className="space-y-2.5">
                {summary.supportTickets.map((t) => (
                  <div
                    key={t.ticketCode}
                    className="bg-nl-900/80 border border-gray-800 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-nl-red font-bold">
                        {t.ticketCode}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : t.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {t.status === 'resolved'
                          ? 'Resuelto'
                          : t.status === 'rejected'
                          ? 'Cerrado'
                          : 'Abierto'}
                      </span>
                    </div>
                    <div className="text-white font-semibold">{t.subject}</div>
                    {t.staffResponse && (
                      <div className="text-gray-400">Respuesta: {t.staffResponse}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
