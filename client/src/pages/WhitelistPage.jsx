import { useEffect, useState } from 'react';
import {
  FileCheck2,
  Search,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
} from 'lucide-react';
import { api } from '../api/client';

export function WhitelistPage({ settings, discordUser, onToast }) {
  const isOpen = settings?.whitelistEnabled === 'true';

  const [form, setForm] = useState({
    discordTag: discordUser?.username || '',
    age: '',
    country: '',
    mtaSerial: '',
    characterName: '',
    characterBackstory: '',
    rpConcepts: '',
    scenarioAnswer: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    if (discordUser) {
      setForm((prev) => ({
        ...prev,
        discordTag: prev.discordTag || discordUser.username || '',
      }));
      api
        .getMyWhitelistApps()
        .then(setMyApps)
        .catch(() => {});
    }
  }, [discordUser]);

  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitWhitelist(form);
      setSubmittedCode(res.trackingCode);
      setLookupCode(res.trackingCode);
      onToast(
        'Solicitud Enviada',
        `Tu código de seguimiento es ${res.trackingCode}`,
        'success'
      );
      setForm({
        discordTag: '',
        age: '',
        country: '',
        mtaSerial: '',
        characterName: '',
        characterBackstory: '',
        rpConcepts: '',
        scenarioAnswer: '',
      });
    } catch (err) {
      onToast('Error en formulario', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await api.checkWhitelistStatus(lookupCode);
      setLookupResult(res);
    } catch (err) {
      onToast('Sin resultados', err.message, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-nl-red text-xs font-bold tracking-widest uppercase">
          <FileCheck2 className="w-4 h-4" />
          Sistema de Acceso Roleplay
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Postulación a la Whitelist
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          {settings?.whitelistMessage ||
            'Completa tu solicitud para acceder al servidor y vive una experiencia de rol seria.'}
        </p>
      </div>

      {/* My Discord Applications */}
      {discordUser && myApps.length > 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-white">
            Mis Solicitudes ({discordUser.displayName})
          </h2>
          <div className="space-y-2">
            {myApps.map((app) => (
              <div
                key={app.trackingCode}
                className="bg-nl-900/80 border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-nl-red font-bold">
                    {app.trackingCode}
                  </span>{' '}
                  • <span className="text-white font-semibold">{app.characterName}</span>
                  {app.staffNote && (
                    <span className="block text-gray-400 mt-0.5">
                      Nota Staff: {app.staffNote}
                    </span>
                  )}
                </div>
                <span
                  className={`font-bold px-2.5 py-1 rounded-full ${
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
                    : 'En Revisión'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tracker */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-nl-red" />
          Consultar Estado de Solicitud
        </h2>
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código (ej. NL-A1B2-C3D4)"
            className="flex-1 bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-nl-red"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="bg-nl-700 hover:bg-nl-600 border border-gray-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
          >
            {lookupLoading ? 'Buscando...' : 'Verificar Estado'}
          </button>
        </form>

        {lookupResult && (
          <div className="bg-nl-900/90 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-400 font-mono">
                {lookupResult.trackingCode} • Personaje:{' '}
                <span className="text-white font-semibold">
                  {lookupResult.characterName}
                </span>
              </div>
              {lookupResult.staffNote && (
                <p className="text-xs text-gray-300">
                  <span className="text-nl-red font-semibold">Nota del Staff:</span>{' '}
                  {lookupResult.staffNote}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-center ${
                lookupResult.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : lookupResult.status === 'rejected'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {lookupResult.status === 'approved' && (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Aprobada
                </>
              )}
              {lookupResult.status === 'rejected' && (
                <>
                  <XCircle className="w-4 h-4" /> Rechazada
                </>
              )}
              {lookupResult.status === 'pending' && (
                <>
                  <Clock className="w-4 h-4" /> En Revisión
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Banner */}
      {submittedCode && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            ¡Solicitud Recibida Exitosamente!
          </h3>
          <p className="text-xs text-gray-300">
            Guarda tu código de seguimiento para consultar cuando el Staff la revise:
          </p>
          <div className="inline-block bg-nl-900 border border-emerald-500/30 px-4 py-2 rounded-xl font-mono text-base font-bold text-emerald-400 select-all">
            {submittedCode}
          </div>
        </div>
      )}

      {/* Application Form */}
      {!isOpen ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Lock className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">
            Postulaciones Cerradas Temporalmente
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            El equipo de administración ha cerrado temporalmente el envío de nuevas
            solicitudes. Aún puedes consultar el estado de una solicitud previa arriba.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-white">1. Información OOC</h2>
            <p className="text-xs text-gray-400">Datos reales del jugador para contacto.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Usuario de Discord *
              </label>
              <input
                required
                type="text"
                value={form.discordTag}
                onChange={(e) => setForm({ ...form, discordTag: e.target.value })}
                placeholder="ej. usuario123"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Edad *
              </label>
              <input
                required
                type="number"
                min={13}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="18"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                País / Zona Horaria *
              </label>
              <input
                required
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="ej. España / México / Argentina"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Serial MTA (Opcional)
              </label>
              <input
                type="text"
                value={form.mtaSerial}
                onChange={(e) => setForm({ ...form, mtaSerial: e.target.value })}
                placeholder="Escribe 'serial' en consola F8"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-nl-red"
              />
            </div>
          </div>

          <div className="border-b border-gray-800 pb-3 pt-2">
            <h2 className="text-lg font-bold text-white">2. Personaje y Rol (IC)</h2>
            <p className="text-xs text-gray-400">
              Demuestra tu nivel de interpretación y conocimiento de la normativa.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre y Apellido del Personaje (IC) *
              </label>
              <input
                required
                type="text"
                value={form.characterName}
                onChange={(e) => setForm({ ...form, characterName: e.target.value })}
                placeholder="ej. Mateo_Vega"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Historia del Personaje (mín. 40 caracteres) *
              </label>
              <textarea
                required
                rows={4}
                value={form.characterBackstory}
                onChange={(e) =>
                  setForm({ ...form, characterBackstory: e.target.value })
                }
                placeholder="Cuenta el origen, motivaciones, virtudes y defectos de tu personaje..."
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Explica con tus palabras qué es MG, PG y DM *
              </label>
              <textarea
                required
                rows={3}
                value={form.rpConcepts}
                onChange={(e) => setForm({ ...form, rpConcepts: e.target.value })}
                placeholder="Metagaming, Powergaming y Deathmatch..."
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Situación: Te apuntan dos sujetos armados mientras estás desarmado. ¿Cómo
                actúas? *
              </label>
              <textarea
                required
                rows={3}
                value={form.scenarioAnswer}
                onChange={(e) => setForm({ ...form, scenarioAnswer: e.target.value })}
                placeholder="Describe tu reacción valorando la vida de tu personaje..."
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg glow-red transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Enviando solicitud...' : 'Enviar Postulación'}
          </button>
        </form>
      )}
    </div>
  );
}
