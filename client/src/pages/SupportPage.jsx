import { useState } from 'react';
import { LifeBuoy, Send, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api } from '../api/client';

export function SupportPage({ discordUser, onToast }) {
  const [form, setForm] = useState({
    type: 'report',
    discordTag: discordUser?.username || '',
    characterName: '',
    mtaSerial: '',
    subject: '',
    description: '',
    evidenceUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState('');

  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitSupportTicket({
        ...form,
        discordTag: form.discordTag || discordUser?.username || '',
      });
      setSubmittedTicket(res.ticketCode);
      setLookupCode(res.ticketCode);
      onToast(
        'Ticket Creado',
        `Tu código de ticket es ${res.ticketCode}`,
        'success'
      );
      setForm({
        type: 'report',
        discordTag: discordUser?.username || '',
        characterName: '',
        mtaSerial: '',
        subject: '',
        description: '',
        evidenceUrl: '',
      });
    } catch (err) {
      onToast('Error', err.message, 'error');
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
      const res = await api.checkSupportStatus(lookupCode);
      setLookupResult(res);
    } catch (err) {
      onToast('No encontrado', err.message, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-nl-red text-xs font-bold tracking-widest uppercase">
          <LifeBuoy className="w-4 h-4" />
          Atención al Jugador
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Centro de Soporte, Reportes & Apelaciones
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Envía reportes contra jugadores, reporta fallos técnicos o solicita una
          apelación de baneo directamente a la administración.
        </p>
      </div>

      {/* Ticket Status Lookup */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-nl-red" />
          Consultar Respuesta de Ticket
        </h2>
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
            placeholder="Código de ticket (ej. SUP-A1B2-C3D4)"
            className="flex-1 bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-nl-red"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="bg-nl-700 hover:bg-nl-600 border border-gray-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
          >
            {lookupLoading ? 'Consultando...' : 'Ver Estado'}
          </button>
        </form>

        {lookupResult && (
          <div className="bg-nl-900/90 border border-gray-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-nl-red font-bold">
                  {lookupResult.ticketCode}
                </span>{' '}
                • <strong className="text-white">{lookupResult.subject}</strong>
              </div>
              <span
                className={`inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full ${
                  lookupResult.status === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : lookupResult.status === 'rejected'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {lookupResult.status === 'resolved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resuelto
                  </>
                ) : lookupResult.status === 'rejected' ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Rechazado
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" /> Abierto
                  </>
                )}
              </span>
            </div>
            {lookupResult.staffResponse && (
              <p className="text-gray-300 bg-nl-800 p-3 rounded-xl">
                <strong className="text-nl-red">Respuesta del Staff:</strong>{' '}
                {lookupResult.staffResponse}
              </p>
            )}
          </div>
        )}
      </div>

      {submittedTicket && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">¡Ticket Enviado al Staff!</h3>
          <p className="text-xs text-gray-300">
            Guarda tu código para revisar la respuesta:{' '}
            <strong className="font-mono text-emerald-400">{submittedTicket}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'report', label: '🚨 Reportar Jugador' },
            { id: 'appeal', label: '⚖️ Apelar Baneo' },
            { id: 'bug', label: '🐛 Reportar Bug / Fallo' },
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setForm({ ...form, type: t.id })}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                form.type === t.id
                  ? 'bg-nl-red text-white border-nl-red glow-red-sm'
                  : 'bg-nl-900 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gray-300 mb-1.5">Tu Discord *</label>
            <input
              required
              value={form.discordTag}
              onChange={(e) => setForm({ ...form, discordTag: e.target.value })}
              placeholder="usuario"
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1.5">Tu Personaje IC</label>
            <input
              value={form.characterName}
              onChange={(e) => setForm({ ...form, characterName: e.target.value })}
              placeholder="Nombre_Apellido"
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1.5">
              Serial MTA (Obligatorio en apelaciones)
            </label>
            <input
              value={form.mtaSerial}
              onChange={(e) => setForm({ ...form, mtaSerial: e.target.value })}
              placeholder="Consola F8 -> serial"
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-gray-300 mb-1.5">Asunto del Ticket *</label>
          <input
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="ej. Reporte por DM en Idlewood / Apelación de bloqueo"
            className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white"
          />
        </div>

        <div className="text-xs">
          <label className="block text-gray-300 mb-1.5">
            Explicación detallada de lo ocurrido *
          </label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe los hechos con fecha, nombres implicados y contexto..."
            className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white"
          />
        </div>

        <div className="text-xs">
          <label className="block text-gray-300 mb-1.5">
            Enlace a Pruebas / Video / Capturas (YouTube, Medal, Imgur, Streamable)
          </label>
          <input
            value={form.evidenceUrl}
            onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
            placeholder="https://..."
            className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg glow-red transition-all flex items-center gap-2 text-xs"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando ticket...' : 'Enviar Ticket al Staff'}
        </button>
      </form>
    </div>
  );
}
