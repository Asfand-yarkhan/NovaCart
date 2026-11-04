import { API_URL } from './api';

/** Resolves a product image path (/uploads/x.jpg or an absolute URL) to a usable src. */
export const imageUrl = (path) => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
