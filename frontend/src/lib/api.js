// Thin fetch wrapper for the NovaCart API.
// In development Vite proxies /api and /uploads to the backend (see vite.config.js),
// so the base URL is empty. Set VITE_API_URL when the API lives on another origin.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'novacart_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } }
};

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

/**
 * api('/products?limit=8')
 * api('/orders', { method: 'POST', body: { items } })   // objects are JSON-encoded
 * api('/products', { method: 'POST', body: formData })  // FormData is sent as multipart
 */
export async function api(endpoint, { body, headers, signal, ...options } = {}) {
  const token = tokenStore.get();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const init = {
    ...options,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
  };

  let res;
  try {
    res = await fetch(`${API_URL}/api${endpoint}`, init);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('We could not reach NovaCart. Check your connection and try again.', 0);
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent('novacart:unauthorized'));
    throw new ApiError(data?.message || `Request failed (${res.status}).`, res.status, data?.fields);
  }
  return data;
}

// Builds a query string from an object, skipping empty values.
export const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};
