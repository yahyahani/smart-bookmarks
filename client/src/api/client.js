const API_URL = 'http://localhost:3001/api';

// Haalt het opgeslagen token op uit de browser-opslag
function getToken() {
  return localStorage.getItem('token');
}

// Centrale fetch-wrapper die automatisch het token meestuurt
// en JSON-fouten netjes omzet naar een JavaScript Error.
async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Er ging iets mis');
  }

  return data;
}

export const authApi = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

export const bookmarksApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bookmarks${query ? `?${query}` : ''}`);
  },
  create: (url, tags) =>
    request('/bookmarks', { method: 'POST', body: JSON.stringify({ url, tags }) }),
  update: (id, data) =>
    request(`/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) =>
    request(`/bookmarks/${id}`, { method: 'DELETE' }),
};

export { getToken };
