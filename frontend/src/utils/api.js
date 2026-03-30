const API_BASE = 'http://localhost:5000/api';

export const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('novacart_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
};

// Convenience helpers
export const authFetch = (endpoint, options = {}) => api(endpoint, options);
export default API_BASE;
