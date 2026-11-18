import { X, Calendar } from 'lucide-react';
import { ACCENT_STYLES, DynamicIcon } from '../utils/icons';

export function NewsModal({ item, onClose }) {
  if (!item) return null;
  const style = ACCENT_STYLES[item.accentColor] || ACCENT_STYLES.copper;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-nl-800 border border-nl-red/30 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl glow-red-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44 bg-gradient-to-br from-nl-700 to-nl-900 flex items-center justify-center border-b border-gray-800">
          <DynamicIcon name={item.icon} className={`w-16 h-16 ${style.text}`} />
          <span
            className={`absolute top-4 left-4 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${style.badge}`}
          >
            {item.badge}
          </span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-nl-900/80 border border-gray-700 text-gray-300 hover:text-white flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="absolute bottom-3 right-4 flex items-center gap-1.5 text-xs text-gray-300 bg-nl-900/80 px-3 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-nl-red" />
            {item.publishedAt}
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-white">{item.title}</h2>
          <p className="text-sm text-nl-redglow font-medium">{item.summary}</p>
          <div className="border-t border-gray-800 pt-4 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}
