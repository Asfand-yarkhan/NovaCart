import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  // Restore the session on first load
  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Any 401 with a stored token means the session expired
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('novacart:unauthorized', onUnauthorized);
    return () => window.removeEventListener('novacart:unauthorized', onUnauthorized);
  }, [logout]);

  const authenticate = useCallback(async (endpoint, body) => {
    const { token, ...profile } = await api(endpoint, { method: 'POST', body });
    tokenStore.set(token);
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback((email, password) => authenticate('/auth/login', { email, password }), [authenticate]);
  const register = useCallback((name, email, password) => authenticate('/auth/register', { name, email, password }), [authenticate]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    setUser
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
