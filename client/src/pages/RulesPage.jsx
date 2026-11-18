import { useState } from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

export function RulesPage({ rules = [] }) {
  const [selectedCat, setSelectedCat] = useState('Todas');
  const categories = ['Todas', ...new Set(rules.map((r) => r.category))];

  const filtered =
    selectedCat === 'Todas'
      ? rules
      : rules.filter((r) => r.category === selectedCat);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-nl-red text-xs font-bold tracking-widest uppercase">
          <BookOpen className="w-4 h-4" />
          Normativa Oficial
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Reglamento del Servidor
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          El desconocimiento de las normas no exime de su cumplimiento. Mantén siempre
          un rol limpio y realista.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCat === cat
                ? 'bg-nl-red text-white glow-red-sm'
                : 'bg-nl-800 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((rule) => {
          const badgeColor =
            rule.severity === 'Crítica'
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : rule.severity === 'Alta'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

          return (
            <div key={rule.id} className="glass-card rounded-2xl p-6 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-nl-red bg-nl-red/10 px-2.5 py-0.5 rounded-full">
                    {rule.category}
                  </span>
                  <h3 className="text-base font-bold text-white">{rule.title}</h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Sanción {rule.severity}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{rule.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
