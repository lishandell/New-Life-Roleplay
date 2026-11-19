import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  LogOut,
  Newspaper,
  FileCheck2,
  Users,
  Sparkles,
  BookOpen,
  Settings,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  KeyRound,
  Save,
  Radio,
} from 'lucide-react';
import { api } from '../api/client';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'mta-status', label: 'Estado & Discord Bot', icon: Radio },
  { id: 'news', label: 'Noticias & Parches', icon: Newspaper },
  { id: 'whitelist', label: 'Whitelist', icon: FileCheck2 },
  { id: 'features', label: 'Características', icon: Sparkles },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'rules', label: 'Reglamento', icon: BookOpen },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export function AdminPortal({ discordUser, onToast, onSiteRefresh }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const loadDashboard = async () => {
    setLoadingDash(true);
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (err) {
      onToast('Error', err.message, 'error');
    } finally {
      setLoadingDash(false);
    }
  };

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
        loadDashboard();
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.login(loginForm.username, loginForm.password);
      setUser(res.user);
      onToast('Bienvenido', `Sesión iniciada como ${res.user.username}`, 'success');
      await loadDashboard();
    } catch (err) {
      onToast('Acceso denegado', err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setDashboard(null);
    onToast('Sesión cerrada', 'Has salido del panel administrativo.', 'info');
  };

  const refreshAll = async () => {
    await loadDashboard();
    if (onSiteRefresh) await onSiteRefresh();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nl-900 text-gray-400 text-sm">
        Verificando acceso...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-nl-900 flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 glow-red-sm">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-nl-red/10 border border-nl-red/30 flex items-center justify-center mx-auto text-nl-red">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Panel Administrativo
            </h1>
            <p className="text-xs text-gray-400">
              Acceso restringido para administración de New Life Roleplay.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Usuario
              </label>
              <input
                required
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                required
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-nl-red to-nl-darkred hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg glow-red transition-all text-sm"
            >
              {loginLoading ? 'Autenticando...' : 'Entrar al Panel'}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-800" />
            <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase">o</span>
            <div className="flex-grow border-t border-gray-800" />
          </div>

          <a
            href="/api/auth/discord"
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            Entrar con Discord (Rol Admin/Staff)
          </a>

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la web pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const visibleTabs =
    user?.role === 'discord_staff'
      ? TABS.filter((t) => t.id === 'overview' || t.id === 'whitelist')
      : TABS;

  return (
    <div className="min-h-screen bg-nl-900 text-gray-100 flex flex-col">
      {/* Admin Topbar */}
      <header className="bg-nl-800/90 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-nl-red/15 border border-nl-red/40 flex items-center justify-center text-nl-red">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              New Life • Admin CMS
            </h1>
            <p className="text-[11px] text-gray-400">
              Conectado como <span className="text-nl-red font-semibold">{user.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs font-semibold text-gray-300 hover:text-white bg-nl-700 px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Ver Web
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-3 space-y-1.5">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const pendingCount =
              t.id === 'whitelist' ? dashboard?.stats?.pendingWhitelist || 0 : 0;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-nl-red text-white glow-red-sm'
                    : 'bg-nl-800/60 text-gray-400 hover:text-white hover:bg-nl-800 border border-gray-800/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {t.label}
                </span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9">
          {loadingDash && !dashboard ? (
            <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-400">
              Cargando panel...
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <OverviewTab stats={dashboard?.stats} onNavigate={setTab} />
              )}
              {tab === 'mta-status' && (
                <SettingsManager
                  settings={dashboard?.settings || {}}
                  onRefresh={refreshAll}
                  onToast={onToast}
                  onlyMtaDiscord={true}
                />
              )}
              {tab === 'news' && (
                <NewsManager
                  items={dashboard?.news || []}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
              {tab === 'whitelist' && (
                <WhitelistManager
                  items={dashboard?.whitelist || []}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
              {tab === 'features' && (
                <FeaturesManager
                  items={dashboard?.features || []}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
              {tab === 'staff' && (
                <StaffManager
                  items={dashboard?.staff || []}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
              {tab === 'rules' && (
                <RulesManager
                  items={dashboard?.rules || []}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
              {tab === 'settings' && (
                <SettingsManager
                  settings={dashboard?.settings || {}}
                  onRefresh={refreshAll}
                  onToast={onToast}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ stats = {}, onNavigate }) {
  const cards = [
    {
      label: 'Noticias Publicadas',
      value: `${stats.publishedNews || 0} / ${stats.totalNews || 0}`,
      tab: 'news',
      color: 'text-nl-red',
    },
    {
      label: 'Whitelist Pendientes',
      value: stats.pendingWhitelist || 0,
      tab: 'whitelist',
      color: 'text-amber-400',
    },
    {
      label: 'Miembros del Staff',
      value: stats.totalStaff || 0,
      tab: 'staff',
      color: 'text-emerald-400',
    },
    {
      label: 'Reglas Activas',
      value: stats.totalRules || 0,
      tab: 'rules',
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className="glass-card p-5 rounded-2xl text-left hover:-translate-y-0.5 transition-all"
          >
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-3xl font-black mt-2 ${c.color}`}>{c.value}</p>
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h2 className="text-base font-bold text-white">Accesos Rápidos</h2>
        <p className="text-xs text-gray-400">
          Desde este panel secreto controlas todo el contenido de tu servidor MTA:SA en
          tiempo real. Todos los cambios se guardan en la base de datos SQLite del
          servidor.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onNavigate('news')}
            className="bg-nl-red text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            + Publicar Noticia / Parche
          </button>
          <button
            onClick={() => onNavigate('whitelist')}
            className="bg-nl-700 hover:bg-nl-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            Revisar Whitelist
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="bg-nl-700 hover:bg-nl-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            Editar IP / Jugadores / Banner
          </button>
        </div>
      </div>
    </div>
  );
}

function NewsManager({ items, onRefresh, onToast }) {
  const emptyForm = {
    title: '',
    summary: '',
    content: '',
    category: 'update',
    badge: 'Parche v3.9',
    icon: 'rocket',
    accentColor: 'copper',
    publishedAt: '',
    isPublished: true,
    isFeatured: false,
  };

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      badge: item.badge,
      icon: item.icon,
      accentColor: item.accentColor,
      publishedAt: item.publishedAt,
      isPublished: Boolean(item.isPublished),
      isFeatured: Boolean(item.isFeatured),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateNews(editingId, form);
        onToast('Actualizado', 'Noticia actualizada correctamente.', 'success');
      } else {
        await api.createNews(form);
        onToast('Publicada', 'Nueva noticia creada correctamente.', 'success');
      }
      setEditingId(null);
      setForm(emptyForm);
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta noticia permanentemente?')) return;
    await api.deleteNews(id);
    onToast('Eliminada', 'Noticia eliminada.', 'info');
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {editingId ? 'Editar Noticia / Parche' : 'Nueva Noticia / Actualización'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Título de la noticia *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
          />
          <input
            placeholder="Etiqueta (ej. Parche v3.9, Evento)"
            value={form.badge}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          >
            <option value="update">Categoría: Parches / Updates</option>
            <option value="event">Categoría: Eventos</option>
            <option value="security">Categoría: Seguridad</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option value="rocket">Icono: Cohete</option>
              <option value="trophy">Icono: Trofeo</option>
              <option value="shield">Icono: Escudo</option>
              <option value="megaphone">Icono: Anuncio</option>
              <option value="wrench">Icono: Taller</option>
              <option value="flame">Icono: Fuego</option>
            </select>
            <select
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option value="copper">Color: Cobre</option>
              <option value="amber">Color: Ámbar</option>
              <option value="emerald">Color: Esmeralda</option>
              <option value="blue">Color: Azul</option>
            </select>
          </div>
        </div>

        <input
          required
          placeholder="Resumen corto para la tarjeta *"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
        />

        <textarea
          rows={4}
          placeholder="Notas completas del parche o noticia (se muestra al abrir el modal)..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-nl-red"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs text-gray-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="accent-nl-red"
              />
              Publicada (visible en la web)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-nl-red"
              />
              Destacada arriba
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-nl-red hover:bg-nl-darkred text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Publicar Noticia'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-nl-700 text-nl-red">
                  {item.badge}
                </span>
                {!item.isPublished && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                    Borrador
                  </span>
                )}
                <span className="text-xs text-gray-400">{item.publishedAt}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-1">{item.summary}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startEdit(item)}
                className="p-2 rounded-xl bg-nl-700 hover:bg-nl-600 text-gray-200"
                title="Editar"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhitelistManager({ items, onRefresh, onToast }) {
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.status === filter);

  const handleReview = async (id, status) => {
    try {
      await api.reviewWhitelist(id, status, note);
      onToast(
        'Whitelist actualizada',
        `Solicitud marcada como ${status === 'approved' ? 'Aprobada' : 'Rechazada'}.`,
        'success'
      );
      setSelected(null);
      setNote('');
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-white">
          Solicitudes de Whitelist ({filtered.length})
        </h2>
        <div className="flex gap-1.5 bg-nl-800 p-1 rounded-xl border border-gray-800 text-xs font-semibold">
          {[
            { id: 'pending', label: 'Pendientes' },
            { id: 'approved', label: 'Aprobadas' },
            { id: 'rejected', label: 'Rechazadas' },
            { id: 'all', label: 'Todas' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg ${
                filter === f.id ? 'bg-nl-red text-white' : 'text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-xs text-gray-400">
          No hay solicitudes en esta categoría.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-nl-red font-bold">
                    {app.trackingCode}
                  </span>{' '}
                  • <strong className="text-white text-sm">{app.characterName}</strong>{' '}
                  <span className="text-xs text-gray-400">
                    ({app.discordTag} • {app.age} años • {app.country})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelected(selected?.id === app.id ? null : app);
                      setNote(app.staffNote || '');
                    }}
                    className="text-xs font-bold bg-nl-700 hover:bg-nl-600 text-white px-3 py-1.5 rounded-xl"
                  >
                    {selected?.id === app.id ? 'Ocultar' : 'Revisar'}
                  </button>
                </div>
              </div>

              {selected?.id === app.id && (
                <div className="border-t border-gray-800 pt-4 space-y-3 text-xs">
                  {app.mtaSerial && (
                    <p className="text-gray-400 font-mono">
                      Serial MTA: <span className="text-gray-200">{app.mtaSerial}</span>
                    </p>
                  )}
                  <div>
                    <p className="text-nl-red font-bold mb-1">Historia IC:</p>
                    <p className="text-gray-300 bg-nl-900 p-3 rounded-xl whitespace-pre-line">
                      {app.characterBackstory}
                    </p>
                  </div>
                  <div>
                    <p className="text-nl-red font-bold mb-1">Conceptos RP:</p>
                    <p className="text-gray-300 bg-nl-900 p-3 rounded-xl whitespace-pre-line">
                      {app.rpConcepts}
                    </p>
                  </div>
                  <div>
                    <p className="text-nl-red font-bold mb-1">Escenario:</p>
                    <p className="text-gray-300 bg-nl-900 p-3 rounded-xl whitespace-pre-line">
                      {app.scenarioAnswer}
                    </p>
                  </div>

                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nota del Staff para el jugador (opcional)..."
                    className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleReview(app.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </button>
                    <button
                      onClick={() => handleReview(app.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturesManager({ items, onRefresh, onToast }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: 'car',
    color: 'copper',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createFeature(form);
      setForm({ title: '', description: '', icon: 'car', color: 'copper' });
      onToast('Agregado', 'Característica agregada.', 'success');
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteFeature(id);
    onToast('Eliminada', 'Característica eliminada.', 'info');
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Agregar Característica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="car">Vehículos</option>
            <option value="vault">Economía</option>
            <option value="masks">Facciones</option>
            <option value="headset">Soporte</option>
            <option value="sparkles">Especial</option>
          </select>
          <select
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="copper">Cobre</option>
            <option value="emerald">Esmeralda</option>
            <option value="blue">Azul</option>
            <option value="amber">Ámbar</option>
          </select>
        </div>
        <textarea
          required
          rows={2}
          placeholder="Descripción..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-nl-red text-white text-xs font-bold px-5 py-2.5 rounded-xl"
        >
          + Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((f) => (
          <div
            key={f.id}
            className="glass-card rounded-2xl p-4 flex items-start justify-between gap-3"
          >
            <div>
              <h3 className="text-sm font-bold text-white">{f.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{f.description}</p>
            </div>
            <button
              onClick={() => handleDelete(f.id)}
              className="p-2 rounded-xl bg-red-500/15 text-red-400 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffManager({ items, onRefresh, onToast }) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    status: 'Activo en Discord',
    color: 'copper',
    avatarUrl: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff(form);
      setForm({
        name: '',
        role: '',
        status: 'Activo en Discord',
        color: 'copper',
        avatarUrl: '',
      });
      onToast('Agregado', 'Miembro del Staff agregado.', 'success');
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteStaff(id);
    onToast('Eliminado', 'Miembro eliminado.', 'info');
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Agregar Miembro del Staff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Nombre (ej. Zack_Miller)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            required
            placeholder="Rango (ej. Fundador & Developer)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Estado (ej. En Juego, Activo en Discord)"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <select
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="copper">Cobre</option>
            <option value="blue">Azul</option>
            <option value="emerald">Esmeralda</option>
            <option value="amber">Ámbar</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-nl-red text-white text-xs font-bold px-5 py-2.5 rounded-xl"
        >
          + Agregar Staff
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((m) => (
          <div
            key={m.id}
            className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3"
          >
            <div>
              <h3 className="text-sm font-bold text-white">{m.name}</h3>
              <p className="text-xs text-nl-red">{m.role}</p>
              <p className="text-[11px] text-gray-400">{m.status}</p>
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              className="p-2 rounded-xl bg-red-500/15 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesManager({ items, onRefresh, onToast }) {
  const [form, setForm] = useState({
    category: 'Conceptos Básicos',
    title: '',
    description: '',
    severity: 'Alta',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createRule(form);
      setForm({
        category: 'Conceptos Básicos',
        title: '',
        description: '',
        severity: 'Alta',
      });
      onToast('Agregada', 'Regla agregada al reglamento.', 'success');
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteRule(id);
    onToast('Eliminada', 'Regla eliminada.', 'info');
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Agregar Regla</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            placeholder="Categoría"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            required
            placeholder="Título de la regla"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          />
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="Media">Sanción Media</option>
            <option value="Alta">Sanción Alta</option>
            <option value="Crítica">Sanción Crítica</option>
          </select>
        </div>
        <textarea
          required
          rows={2}
          placeholder="Descripción de la norma..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-nl-red text-white text-xs font-bold px-5 py-2.5 rounded-xl"
        >
          + Agregar Regla
        </button>
      </form>

      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r.id}
            className="glass-card rounded-2xl p-4 flex items-start justify-between gap-4"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-nl-red">
                {r.category} • {r.severity}
              </span>
              <h3 className="text-sm font-bold text-white">{r.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{r.description}</p>
            </div>
            <button
              onClick={() => handleDelete(r.id)}
              className="p-2 rounded-xl bg-red-500/15 text-red-400 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsManager({ settings, onRefresh, onToast, onlyMtaDiscord = false }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [checkingMta, setCheckingMta] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleCheckMtaNow = async () => {
    setCheckingMta(true);
    try {
      await api.updateSettings(form);
      const res = await api.checkMtaLive();
      if (res.online) {
        onToast(
          'Servidor MTA en Línea',
          `Detectado activo en ${res.host}:${res.port} (${res.playersOnline ?? 0}/${res.playersMax ?? 0} jugadores).`,
          'success'
        );
      } else {
        onToast(
          'Servidor MTA Apagado / Sin Respuesta',
          `No hubo respuesta UDP ASE en ${res.host}:${res.asePort}. Estado marcado como Apagado.`,
          'info'
        );
      }
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    } finally {
      setCheckingMta(false);
    }
  };

  const handleSendDiscordStatusNow = async () => {
    setSendingStatus(true);
    try {
      await api.updateSettings(form);
      await api.sendDiscordStatusNow();
      onToast(
        'Enviado a Discord',
        'El mensaje de Información del Servidor se envió al canal de Discord.',
        'success'
      );
      await onRefresh();
    } catch (err) {
      onToast('Error al enviar', err.message, 'error');
    } finally {
      setSendingStatus(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(form);
      onToast('Guardado', 'Configuración del sitio actualizada.', 'success');
      await onRefresh();
    } catch (err) {
      onToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '' });
      onToast('Seguridad', 'Contraseña actualizada correctamente.', 'success');
    } catch (err) {
      onToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 space-y-5">
        {!onlyMtaDiscord && (
          <>
            <h2 className="text-base font-bold text-white">Configuración General del Sitio</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Nombre del Servidor</label>
            <input
              value={form.serverName || ''}
              onChange={(e) => setForm({ ...form, serverName: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Subtítulo / Modo</label>
            <input
              value={form.serverSubtitle || ''}
              onChange={(e) => setForm({ ...form, serverSubtitle: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">IP:Puerto MTA:SA</label>
            <input
              value={form.serverIp || ''}
              onChange={(e) => setForm({ ...form, serverIp: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Enlace Discord Oficial</label>
            <input
              value={form.discordUrl || ''}
              onChange={(e) => setForm({ ...form, discordUrl: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Jugadores Online</label>
            <input
              value={form.playersOnline || ''}
              onChange={(e) => setForm({ ...form, playersOnline: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Slots Máximos</label>
            <input
              value={form.playersMax || ''}
              onChange={(e) => setForm({ ...form, playersMax: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Estado del Servidor</label>
            <select
              value={form.serverStatus || 'online'}
              onChange={(e) => setForm({ ...form, serverStatus: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="online">En Línea</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="offline">Desconectado</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Estado de Whitelist</label>
            <select
              value={form.whitelistEnabled || 'true'}
              onChange={(e) => setForm({ ...form, whitelistEnabled: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="true">Abierta (Aceptando solicitudes)</option>
              <option value="false">Cerrada temporalmente</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Título Principal (Hero)</label>
            <input
              value={form.heroTitle || ''}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Descripción Principal</label>
            <textarea
              rows={2}
              value={form.heroDescription || ''}
              onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">
              Banner de Aviso Superior (dejar vacío para ocultar)
            </label>
            <input
              placeholder="ej. Mantenimiento programado hoy a las 23:00"
              value={form.maintenanceBanner || ''}
              onChange={(e) => setForm({ ...form, maintenanceBanner: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">
              Discord Webhook URL para Whitelist (Solicitudes y Resultados)
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={form.discordWebhookUrl || ''}
              onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })}
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">
              Discord Webhook URL para Noticias & Parches (Publicación automática)
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={form.discordNewsWebhookUrl || ''}
              onChange={(e) =>
                setForm({ ...form, discordNewsWebhookUrl: e.target.value })
              }
              className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-white mb-3">
              Permisos por Roles de Discord (IDs separados por coma)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">
                  ID Rol Admin (Acceso total al panel)
                </label>
                <input
                  placeholder="ej. 123456789012345678"
                  value={form.discordAdminRoleIds || ''}
                  onChange={(e) =>
                    setForm({ ...form, discordAdminRoleIds: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  ID Rol Staff (Revisar Whitelist)
                </label>
                <input
                  placeholder="ej. 123456789012345678"
                  value={form.discordStaffRoleIds || ''}
                  onChange={(e) =>
                    setForm({ ...form, discordStaffRoleIds: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  ID Rol VIP (Insignia VIP en la web)
                </label>
                <input
                  placeholder="ej. 123456789012345678"
                  value={form.discordVipRoleIds || ''}
                  onChange={(e) =>
                    setForm({ ...form, discordVipRoleIds: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  ID Rol Whitelist (Se asigna al aprobar)
                </label>
                <input
                  placeholder="ej. 123456789012345678"
                  value={form.discordWhitelistRoleIds || ''}
                  onChange={(e) =>
                    setForm({ ...form, discordWhitelistRoleIds: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
            </div>
          </>
        )}

          {/* MONITOR MTA & AUTO-ESTATUS DISCORD */}
          <div className={`${onlyMtaDiscord ? '' : 'border-t border-gray-800 pt-5'} space-y-4 text-xs`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Detector Automático MTA:SA & Auto-Estatus en Discord
                </h3>
                <p className="text-[11px] text-gray-400">
                  Detecta si el servidor está Abierto o Apagado directamente desde la IP y envía el embed automático a Discord.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCheckMtaNow}
                  disabled={checkingMta}
                  className="bg-nl-700 hover:bg-nl-600 border border-gray-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  {checkingMta ? 'Consultando IP...' : '🔍 Probar IP MTA Ahora'}
                </button>
                <button
                  type="button"
                  onClick={handleSendDiscordStatusNow}
                  disabled={sendingStatus}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  {sendingStatus ? 'Enviando...' : '📤 Enviar Estatus a Discord Ahora'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">
                  Detección Automática por IP
                </label>
                <select
                  value={form.autoStatusEnabled || 'true'}
                  onChange={(e) =>
                    setForm({ ...form, autoStatusEnabled: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="true">Activada (Consulta IP cada 1 min)</option>
                  <option value="false">Manual (Usar estado manual arriba)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Auto-Mensaje en Discord
                </label>
                <select
                  value={form.autoDiscordStatusEnabled || 'false'}
                  onChange={(e) =>
                    setForm({ ...form, autoDiscordStatusEnabled: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="true">Activado (Enviar en automático)</option>
                  <option value="false">Desactivado</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Frecuencia de Envío a Discord
                </label>
                <select
                  value={form.discordStatusIntervalMinutes || '30'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discordStatusIntervalMinutes: e.target.value,
                    })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="15">Cada 15 minutos</option>
                  <option value="30">Cada 30 minutos (Media hora)</option>
                  <option value="60">Cada 60 minutos (1 hora)</option>
                  <option value="120">Cada 2 horas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Discord Webhook URL para Canal de Estado del Servidor
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={form.discordStatusWebhookUrl || ''}
                onChange={(e) =>
                  setForm({ ...form, discordStatusWebhookUrl: e.target.value })
                }
                className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">
                  Nombre en la tarjeta (📰 Nombre)
                </label>
                <input
                  placeholder="New Life Roleplay | Roleplay | Español | Latino"
                  value={form.statusEmbedName || ''}
                  onChange={(e) =>
                    setForm({ ...form, statusEmbedName: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Modo (🎮 Modo)
                </label>
                <input
                  placeholder="Roleplay"
                  value={form.statusEmbedMode || ''}
                  onChange={(e) =>
                    setForm({ ...form, statusEmbedMode: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Administración (💸 Administración)
                </label>
                <input
                  placeholder="New Life Staff"
                  value={form.statusEmbedAdmin || ''}
                  onChange={(e) =>
                    setForm({ ...form, statusEmbedAdmin: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Texto en Jugadores (dejar vacío para mostrar 0/500 real)
                </label>
                <input
                  placeholder="ej. ENTRA AL SERVIDOR A VERLO JAJAJA"
                  value={form.statusEmbedPlayersText || ''}
                  onChange={(e) =>
                    setForm({ ...form, statusEmbedPlayersText: e.target.value })
                  }
                  className="w-full bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Vista previa idéntica al embed de Discord */}
            <div className="bg-[#2b2d31] border-l-4 border-emerald-500 rounded-lg p-4 space-y-3 text-xs max-w-xl">
              <div className="font-bold text-white text-sm">
                💻 Información del Servidor
              </div>
              <div>
                <div className="font-bold text-gray-200 mb-1">📰 Nombre</div>
                <code className="bg-[#1e1f22] text-gray-200 px-2 py-1 rounded block">
                  {form.statusEmbedName ||
                    `${form.serverName || 'New Life Roleplay'} | Roleplay | Español | Latino`}
                </code>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="font-bold text-gray-200 mb-1">🌍 IP</div>
                  <code className="bg-[#1e1f22] text-gray-200 px-2 py-0.5 rounded inline-block">
                    {form.serverIp || '172.96.140.62:7323'}
                  </code>
                </div>
                <div>
                  <div className="font-bold text-gray-200 mb-1">🎮 Modo</div>
                  <code className="bg-[#1e1f22] text-gray-200 px-2 py-0.5 rounded inline-block">
                    {form.statusEmbedMode || 'Roleplay'}
                  </code>
                </div>
                <div>
                  <div className="font-bold text-gray-200 mb-1">
                    {form.serverStatus === 'online' ? '🟢' : '🔴'} Estado
                  </div>
                  <code className="bg-[#1e1f22] text-gray-200 px-2 py-0.5 rounded inline-block">
                    {form.serverStatus === 'online' ? 'Abierto' : 'Apagado'}
                  </code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-bold text-gray-200 mb-1">👥 Jugadores</div>
                  <span className="text-gray-200">
                    {form.statusEmbedPlayersText ||
                      `${form.playersOnline || 0} / ${form.playersMax || 500}`}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-gray-200 mb-1">💸 Administración</div>
                  <code className="bg-[#1e1f22] text-gray-200 px-2 py-0.5 rounded inline-block">
                    {form.statusEmbedAdmin || 'New Life Staff'}
                  </code>
                </div>
              </div>
            </div>
          </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-nl-red hover:bg-nl-darkred text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>

      {!onlyMtaDiscord && (
        <form onSubmit={handlePasswordChange} className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-nl-red" />
          Cambiar Contraseña de Administrador
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <input
            required
            type="password"
            placeholder="Contraseña actual"
            value={pwForm.currentPassword}
            onChange={(e) =>
              setPwForm({ ...pwForm, currentPassword: e.target.value })
            }
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="bg-nl-900 border border-gray-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <button
          type="submit"
          className="bg-nl-700 hover:bg-nl-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
        >
          Actualizar Contraseña
        </button>
      </form>
      )}
    </div>
  );
}
