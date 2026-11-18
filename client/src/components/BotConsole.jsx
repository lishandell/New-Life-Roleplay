import { useState } from 'react';
import { Bot, Send } from 'lucide-react';

export function BotConsole({ settings }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'user',
      text: '!stats Alex_Vercetti',
    },
    {
      sender: 'bot',
      title: 'Estadísticas de Jugador',
      lines: [
        '• Nivel: 34',
        '• Banco: $45,200',
        '• Facción: EMS',
        '• VIP: Diamond',
      ],
    },
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    let reply;

    if (lower === '!ayuda' || lower === '!help') {
      reply = {
        sender: 'bot',
        title: 'Comandos Disponibles',
        lines: [
          '• !ip — Muestra la IP del servidor MTA:SA',
          '• !ping — Latencia y estado en vivo',
          '• !whitelist — Estado de postulaciones',
          '• !stats [nombre] — Consulta estadísticas',
        ],
      };
    } else if (lower === '!ping' || lower === '!estado') {
      reply = {
        sender: 'bot',
        title: 'Estado del Servidor',
        lines: [
          `• Estado: ${settings?.serverStatus === 'online' ? 'En Línea (24ms)' : 'Mantenimiento'}`,
          `• Jugadores: ${settings?.playersOnline || 468} / ${settings?.playersMax || 500}`,
        ],
      };
    } else if (lower === '!ip') {
      reply = {
        sender: 'bot',
        title: 'Conexión Directa MTA:SA',
        lines: [`• IP: ${settings?.serverIp || 'mta.newliferp.es:22003'}`],
      };
    } else if (lower === '!whitelist') {
      reply = {
        sender: 'bot',
        title: 'Sistema Whitelist',
        lines: [
          `• Estado: ${settings?.whitelistEnabled === 'true' ? 'Abierta en la Web (/whitelist)' : 'Cerrada temporalmente'}`,
        ],
      };
    } else {
      reply = {
        sender: 'bot',
        title: 'NewLife Bot',
        lines: [`Comando recibido: "${cmd}". Escribe !ayuda para ver la lista.`],
      };
    }

    setMessages((prev) => [...prev.slice(-4), { sender: 'user', text: cmd }, reply]);
    setInput('');
  };

  return (
    <div className="bg-nl-900 border border-gray-800 rounded-2xl p-5 shadow-2xl font-mono text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span className="text-gray-400 ml-2 font-sans text-xs font-semibold">
            #nl-bot-commands
          </span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
          Online v4.2
        </span>
      </div>

      <div className="space-y-3 text-gray-300 max-h-64 overflow-y-auto pr-1">
        {messages.map((msg, idx) =>
          msg.sender === 'user' ? (
            <div
              key={idx}
              className="bg-nl-800/60 p-3 rounded-xl border border-gray-800"
            >
              <span className="text-nl-red font-bold">User:</span>{' '}
              <span className="text-white">{msg.text}</span>
            </div>
          ) : (
            <div
              key={idx}
              className="bg-nl-700/40 p-3 rounded-xl space-y-1.5 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 text-white font-bold">
                <Bot className="w-4 h-4 text-nl-red" /> NewLife Bot{' '}
                <span className="text-[10px] text-gray-400 font-normal">Ahora</span>
              </div>
              <p className="text-gray-200 font-semibold">{msg.title}</p>
              <div className="space-y-0.5 text-[11px] text-gray-300">
                {msg.lines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Prueba !ayuda, !ping, !ip, !whitelist..."
          className="flex-1 bg-nl-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-nl-red"
        />
        <button
          type="submit"
          className="bg-nl-red hover:bg-nl-darkred text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar
        </button>
      </form>
    </div>
  );
}
