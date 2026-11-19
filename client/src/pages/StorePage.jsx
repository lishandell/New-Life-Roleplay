import { useState } from 'react';
import { Crown, CheckCircle2, ExternalLink } from 'lucide-react';
import { ACCENT_STYLES } from '../utils/icons';

export function StorePage({ store = [], settings = {} }) {
  const [selectedCat, setSelectedCat] = useState('Todos');
  const categories = ['Todos', ...new Set(store.map((s) => s.category))];

  const filtered =
    selectedCat === 'Todos'
      ? store
      : store.filter((s) => s.category === selectedCat);

  const defaultBuyUrl = settings.storeBuyUrl || settings.discordUrl || 'https://discord.com';

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-nl-red text-xs font-bold tracking-widest uppercase">
          <Crown className="w-4 h-4" />
          Tienda Oficial & Beneficios
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Tienda VIP & Donaciones
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Apoya el crecimiento y mantenimiento de New Life Roleplay obteniendo
          membresías VIP, vehículos exclusivos y propiedades personalizadas.
        </p>
      </div>

      {store.length > 0 && (
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
      )}

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-400 text-sm">
          Aún no se han publicado paquetes en la Tienda VIP desde el Panel Administrativo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const style = ACCENT_STYLES[item.color] || ACCENT_STYLES.copper;
            const perkLines = (item.perks || '')
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);

            return (
              <div
                key={item.id}
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-nl-red/25 hover:-translate-y-1"
              >
                <div>
                  {item.imageUrl ? (
                    <div className="h-44 bg-nl-800 relative overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.badge && (
                        <span
                          className={`absolute top-3 right-3 text-[10px] font-black px-3 py-1 rounded-full uppercase ${style.badge}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 pb-0 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {item.category}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${style.badge}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{item.title}</h3>
                      <p className={`text-2xl font-black mt-1 ${style.text}`}>
                        {item.price}
                      </p>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {item.description}
                    </p>

                    {perkLines.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-800">
                        {perkLines.map((line, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-gray-300"
                          >
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${style.text}`} />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <a
                    href={item.buyUrl || defaultBuyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white text-xs font-bold py-3 rounded-xl shadow-lg glow-red-sm transition-all flex items-center justify-center gap-2"
                  >
                    Adquirir Paquete <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
