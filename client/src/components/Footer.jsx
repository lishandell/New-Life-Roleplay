import { Link } from 'react-router-dom';

export function Footer({ settings }) {
  return (
    <footer className="bg-nl-800/90 border-t border-gray-800 py-8 px-6 text-center space-y-4 text-xs text-gray-400">
      <div className="flex flex-wrap justify-center items-center gap-6">
        <Link to="/" className="hover:text-white transition-colors">
          Inicio
        </Link>
        <Link to="/reglamento" className="hover:text-white transition-colors">
          Reglamento
        </Link>
        <Link to="/whitelist" className="hover:text-white transition-colors">
          Whitelist
        </Link>
        <a href="/#bots" className="hover:text-white transition-colors">
          Discord Bot
        </a>
        <a href="/#staff" className="hover:text-white transition-colors">
          Staff
        </a>
      </div>
      <p>
        {settings?.serverName || 'New Life Roleplay'} MTA:SA &copy;{' '}
        {new Date().getFullYear()}. Todos los derechos reservados. No afiliado con
        Rockstar Games.
      </p>
    </footer>
  );
}
