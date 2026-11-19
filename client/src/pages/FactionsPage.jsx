import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Send } from 'lucide-react';
import { api } from '../api/client';
import { ACCENT_STYLES } from '../utils/icons';

export function FactionsPage({ factions = [], discordUser, onToast }) {
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [form, setForm] = useState({
    discordTag: discordUser?.username || '',
    characterName: '',
    age: '',
    experience: '',
    motivation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedFaction) return;
    setSubmitting(true);
    try {
      const res = await api.applyFaction({
        ...form,
        factionId: selectedFaction.id,
        discordTag: form.discordTag || discordUser?.username || '',
      });
      setSubmittedCode(res.trackingCode);
      setSelectedFaction(null);
      setForm({
        discordTag: discordUser?.username || '',
        characterName: '',
        age: '',
        experience: '',
        motivation: '',
      });
      onToast(
        'Postulación Enviada',
        `Código de seguimiento: ${res.trackingCode}`,
        'success'
      );
    } catch (err) {
      onToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-nl-red text-xs font-bold tracking-widest uppercase">
          Organizaciones Oficiales
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Portal de Facciones & Oposiciones
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Únete a las fuerzas del orden, servicios de emergencia o postula tu
          organización. Revisa qué facciones tienen oposiciones abiertas.
        </p>
      </div>

      {submittedCode && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            ¡Postulación a Facción Recibida!
          </h3>
          <p className="text-xs text-gray-300">
            Código: <strong className="font-mono text-emerald-400">{submittedCode}</strong>.
            Puedes ver el estado en tu Perfil de Discord o recibirás aviso en el servidor.
          </p>
        </div>
      )}

      {factions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-400 text-sm">
          Aún no se han publicado facciones desde el Panel Administrativo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factions.map((fac) => {
            const style = ACCENT_STYLES[fac.color] || ACCENT_STYLES.blue;
            const isOpen = Boolean(fac.isOpen);
            return (
              <div
                key={fac.id}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${style.badge}`}
                    >
                      {fac.shortCode} • {fac.type === 'illegal' ? 'Ilegal' : 'Legal'}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isOpen
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isOpen ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white">{fac.name}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {fac.description}
                  </p>

                  {fac.requirements && (
                    <div className="bg-nl-900/70 border border-gray-800 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-nl-red block">
                        Requisitos
                      </span>
                      <p className="text-xs text-gray-400 whitespace-pre-line">
                        {fac.requirements}
                      </p>
                    </div>
                  )}
                </div>

                {isOpen ? (
                  <button
                    onClick={() => setSelectedFaction(fac)}
                    className="w-full bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white text-xs font-bold py-3 rounded-xl shadow-lg glow-red-sm transition-all"
                  >
                    Postular a {fac.shortCode}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-nl-800 border border-gray-800 text-gray-500 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" /> Oposiciones Cerradas
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Application Modal */}
      {selectedFaction && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedFaction(null)}
        >
          <form
            onSubmit={handleApply}
            onClick={(e) => e.stopPropagation()}
            className="bg-nl-800 border border-nl-red/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-nl-red">
                  Oposición Oficial
                </span>
                <h2 className="text-lg font-black text-white">
                  Postular a {selectedFaction.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFaction(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Discord *</label>
                <input
                  required
                  value={form.discordTag}
                  onChange={(e) => setForm({ ...form, discordTag: e.target.value })}
                  placeholder="usuario"
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Edad OOC *</label>
                <input
                  required
                  type="number"
                  min={13}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="18"
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-gray-300 mb-1">
                Nombre del Personaje (IC) *
              </label>
              <input
                required
                value={form.characterName}
                onChange={(e) => setForm({ ...form, characterName: e.target.value })}
                placeholder="Nombre_Apellido"
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="text-xs">
              <label className="block text-gray-300 mb-1">
                Experiencia previa en esta facción / rol *
              </label>
              <textarea
                required
                rows={3}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="Describe tu experiencia y conocimientos..."
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="text-xs">
              <label className="block text-gray-300 mb-1">
                ¿Por qué deberíamos aceptarte? *
              </label>
              <textarea
                required
                rows={3}
                value={form.motivation}
                onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                placeholder="Explica tu motivación y disponibilidad..."
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-nl-red to-nl-darkred text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Enviando...' : 'Enviar Postulación'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
