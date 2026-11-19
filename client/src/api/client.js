async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Public & Discord Auth
  getSiteData: () => request('/api/site-data'),
  getDiscordMe: () => request('/api/auth/me'),
  logoutDiscord: () => request('/api/auth/logout', { method: 'POST' }),
  getMyWhitelistApps: () => request('/api/whitelist/my-applications'),
  submitWhitelist: (payload) =>
    request('/api/whitelist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkWhitelistStatus: (code) =>
    request(`/api/whitelist/status?code=${encodeURIComponent(code)}`),
  applyFaction: (payload) =>
    request('/api/factions/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitSupportTicket: (payload) =>
    request('/api/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkSupportStatus: (code) =>
    request(`/api/support/status?code=${encodeURIComponent(code)}`),
  getProfileSummary: () => request('/api/profile/summary'),

  // Admin Auth
  login: (username, password) =>
    request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request('/api/admin/logout', { method: 'POST' }),
  getMe: () => request('/api/admin/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Admin Dashboard & CRUD
  getDashboard: () => request('/api/admin/dashboard'),
  updateSettings: (settings) =>
    request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  checkMtaLive: () =>
    request('/api/admin/mta/check', { method: 'POST' }),
  sendDiscordStatusNow: () =>
    request('/api/admin/discord/send-status', { method: 'POST' }),

  createNews: (item) =>
    request('/api/admin/news', { method: 'POST', body: JSON.stringify(item) }),
  updateNews: (id, item) =>
    request(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteNews: (id) =>
    request(`/api/admin/news/${id}`, { method: 'DELETE' }),

  createFeature: (item) =>
    request('/api/admin/features', { method: 'POST', body: JSON.stringify(item) }),
  updateFeature: (id, item) =>
    request(`/api/admin/features/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteFeature: (id) =>
    request(`/api/admin/features/${id}`, { method: 'DELETE' }),

  createStaff: (item) =>
    request('/api/admin/staff', { method: 'POST', body: JSON.stringify(item) }),
  updateStaff: (id, item) =>
    request(`/api/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteStaff: (id) =>
    request(`/api/admin/staff/${id}`, { method: 'DELETE' }),

  createRule: (item) =>
    request('/api/admin/rules', { method: 'POST', body: JSON.stringify(item) }),
  updateRule: (id, item) =>
    request(`/api/admin/rules/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteRule: (id) =>
    request(`/api/admin/rules/${id}`, { method: 'DELETE' }),

  reviewWhitelist: (id, status, staffNote) =>
    request(`/api/admin/whitelist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, staffNote }),
    }),
  deleteWhitelist: (id) =>
    request(`/api/admin/whitelist/${id}`, { method: 'DELETE' }),

  createFaction: (item) =>
    request('/api/admin/factions', { method: 'POST', body: JSON.stringify(item) }),
  updateFaction: (id, item) =>
    request(`/api/admin/factions/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteFaction: (id) =>
    request(`/api/admin/factions/${id}`, { method: 'DELETE' }),
  reviewFactionApp: (id, status, staffNote) =>
    request(`/api/admin/faction-applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, staffNote }),
    }),
  deleteFactionApp: (id) =>
    request(`/api/admin/faction-applications/${id}`, { method: 'DELETE' }),

  createStoreItem: (item) =>
    request('/api/admin/store', { method: 'POST', body: JSON.stringify(item) }),
  deleteStoreItem: (id) =>
    request(`/api/admin/store/${id}`, { method: 'DELETE' }),

  reviewSupportTicket: (id, status, staffResponse) =>
    request(`/api/admin/support/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, staffResponse }),
    }),
  deleteSupportTicket: (id) =>
    request(`/api/admin/support/${id}`, { method: 'DELETE' }),

  createGalleryItem: (item) =>
    request('/api/admin/gallery', { method: 'POST', body: JSON.stringify(item) }),
  deleteGalleryItem: (id) =>
    request(`/api/admin/gallery/${id}`, { method: 'DELETE' }),
};
