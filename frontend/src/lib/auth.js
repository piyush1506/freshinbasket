const TOKEN_KEYS = {
  ACCESS: 'greenmart_access',
  REFRESH: 'greenmart_refresh',
  USER: 'greenmart_user',
};

let memoryToken = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAccessToken() {
  if (memoryToken) return memoryToken;
  if (isBrowser()) {
    try {
      return sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    } catch {
      return localStorage.getItem('access');
    }
  }
  return null;
}

export function setTokens(access, refresh) {
  memoryToken = access;
  if (isBrowser()) {
    try {
      sessionStorage.setItem(TOKEN_KEYS.ACCESS, access);
      sessionStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    } catch {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
    }
  }
}

export function setUser(userData) {
  if (isBrowser()) {
    try {
      sessionStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    } catch {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }
}

export function getUser() {
  if (isBrowser()) {
    try {
      const data = sessionStorage.getItem(TOKEN_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    }
  }
  return null;
}

export function clearAuth() {
  memoryToken = null;
  if (isBrowser()) {
    [TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER].forEach(k => {
      try { sessionStorage.removeItem(k); } catch {}
      localStorage.removeItem(k);
    });
  }
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export async function authFetch(url, options = {}) {
  const token = getAccessToken();
  if (token) {
    options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  }

  let res = await fetch(url, options);

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      options.headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, options);
    } else {
      clearAuth();
      if (isBrowser()) {
        window.location.href = '/login';
      }
    }
  }

  return res;
}

export async function refreshAccessToken() {
  const refresh = isBrowser()
    ? (sessionStorage.getItem(TOKEN_KEYS.REFRESH) || localStorage.getItem('refresh'))
    : null;

  if (!refresh) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }
    );
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = await res.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    clearAuth();
    return null;
  }
}

export const AUTH_API = {
  async login(email, password) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.non_field_errors?.[0] || data.detail || 'Invalid credentials'
      );
    }
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data;
  },

  async register(data) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      let msg = '';
      if (typeof result === 'string') msg = result;
      else if (result.detail) msg = result.detail;
      else if (result.non_field_errors) msg = result.non_field_errors.join(', ');
      else {
        msg = Object.entries(result)
          .map(([f, e]) => Array.isArray(e) ? e.join(', ') : e)
          .join(' | ');
      }
      throw new Error(msg || 'Registration failed');
    }
    setTokens(result.access, result.refresh);
    setUser(result.user);
    return result;
  },

  async logout() {
    const token = getAccessToken();
    const refresh = isBrowser()
      ? (sessionStorage.getItem(TOKEN_KEYS.REFRESH) || localStorage.getItem('refresh'))
      : null;

    if (refresh) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ refresh }),
          }
        );
      } catch {
        // Proceed with local logout even if API fails
      }
    }
    clearAuth();
  },
};
