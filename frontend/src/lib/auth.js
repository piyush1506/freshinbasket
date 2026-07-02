const TOKEN_KEYS = {
  ACCESS: 'freshinbasket_access',
  REFRESH: 'freshinbasket_refresh',
  USER: 'freshinbasket_user',
};

let memoryToken = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAccessToken() {
  if (memoryToken) return memoryToken;
  if (isBrowser()) {
    return localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access');
  }
  return null;
}

export function setTokens(access, refresh) {
  memoryToken = access;
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
  }
}

export function setUser(userData) {
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));
  }
}

export function getUser() {
  if (isBrowser()) {
    const data = localStorage.getItem(TOKEN_KEYS.USER) || localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearAuth() {
  memoryToken = null;
  if (isBrowser()) {
    [TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER, 'access', 'refresh', 'user'].forEach(k => {
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
    ? (localStorage.getItem(TOKEN_KEYS.REFRESH) || localStorage.getItem('refresh'))
    : null;

  if (!refresh) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh/`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login/`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/`,
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
      ? (localStorage.getItem(TOKEN_KEYS.REFRESH) || localStorage.getItem('refresh'))
      : null;

    if (refresh) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout/`,
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

  async sendOtp(phone_number) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/send-otp/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number }),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to send OTP');
    }
    return result;
  },

  async verifyOtp(phone_number, otp_code) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-otp/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number, otp_code }),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Invalid OTP');
    }
    setTokens(result.access, result.refresh);
    setUser(result.user);
    return result;
  },

  async updateProfile(data) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(data),
      }
    );
    const result = await res.json();
    if (!res.ok) {
      let errorMessage = 'Failed to update profile';
      if (result.detail) errorMessage = result.detail;
      else if (result.error) errorMessage = result.error;
      else if (typeof result === 'object') {
        const firstKey = Object.keys(result)[0];
        if (Array.isArray(result[firstKey])) {
          errorMessage = result[firstKey][0];
        } else if (typeof result[firstKey] === 'string') {
          errorMessage = result[firstKey];
        }
      }
      throw new Error(errorMessage);
    }
    setUser(result);
    return result;
  },
};
