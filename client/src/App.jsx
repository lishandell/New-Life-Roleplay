import { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { WhitelistPage } from './pages/WhitelistPage';
import { RulesPage } from './pages/RulesPage';
import { AdminPortal } from './pages/AdminPortal';

const SECRET_ADMIN_ROUTE = '/portal-nl-admin';

function AppShell() {
  const [siteData, setSiteData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const onToast = useCallback((title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadSiteData = useCallback(async () => {
    try {
      const data = await api.getSiteData();
      setSiteData(data);
    } catch {
      // Silent fallback if backend is starting
    }
  }, []);

  useEffect(() => {
    loadSiteData();
  }, [loadSiteData]);

  // Secret keyboard shortcut: Ctrl + Shift + L opens the secret admin portal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        navigate(SECRET_ADMIN_ROUTE);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  const isAdminRoute = location.pathname === SECRET_ADMIN_ROUTE;

  return (
    <div className="min-h-screen flex flex-col bg-nl-900 text-gray-100">
      {!isAdminRoute && (
        <Navbar settings={siteData?.settings} onToast={onToast} />
      )}

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<HomePage data={siteData} onToast={onToast} />}
          />
          <Route
            path="/whitelist"
            element={
              <WhitelistPage
                settings={siteData?.settings}
                onToast={onToast}
              />
            }
          />
          <Route
            path="/reglamento"
            element={<RulesPage rules={siteData?.rules || []} />}
          />
          <Route
            path={SECRET_ADMIN_ROUTE}
            element={
              <AdminPortal
                onToast={onToast}
                onSiteRefresh={loadSiteData}
              />
            }
          />
        </Routes>
      </main>

      {!isAdminRoute && <Footer settings={siteData?.settings} />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
