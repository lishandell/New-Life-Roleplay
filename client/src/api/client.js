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
  // Public
  getSiteData: () => request('/api/site-data'),
  submitWhitelist: (payload) =>
    request('/api/whitelist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkWhitelistStatus: (code) =>
    request(`/api/whitelist/status?code=${encodeURIComponent(code)}`),

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
};
