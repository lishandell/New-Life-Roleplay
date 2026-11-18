import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const Icon =
          t.type === 'error'
            ? AlertCircle
            : t.type === 'info'
            ? Info
            : CheckCircle2;
        const iconColor =
          t.type === 'error'
            ? 'text-red-400'
            : t.type === 'info'
            ? 'text-blue-400'
            : 'text-nl-red';

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-nl-800/95 backdrop-blur-xl border border-nl-red/50 text-white px-4 py-3.5 rounded-2xl shadow-2xl glow-red-sm animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm leading-tight">{t.title}</h4>
              <p className="text-xs text-gray-300 mt-0.5 break-words">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-gray-400 hover:text-white p-0.5"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
