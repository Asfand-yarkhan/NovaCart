import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';
import { firebaseEnabled, getGoogleIdToken, signInWithEmail, signUpWithEmail } from '../lib/firebase';

// Firebase answers these when it has no such email/password; then we try the API password.
// too-many-requests is included so a Firebase lockout never blocks an account that only exists in our API
// (our own failed-login limiter still applies to that path).
const LEGACY_FALLBACK = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/too-many-requests'];

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

  // Email + password. Accounts live in Firebase Auth (which sends the confirmation email).
  // If Firebase does not know the email, fall back to the API password so accounts created
  // before Firebase (such as the seeded demo accounts) keep working.
  const login = useCallback(async (email, password) => {
    if (!firebaseEnabled) return authenticate('/auth/login', { email, password });
    try {
      const idToken = await signInWithEmail(email, password);
      return await authenticate('/auth/firebase', { idToken });
    } catch (err) {
      if (LEGACY_FALLBACK.includes(err.code)) return authenticate('/auth/login', { email, password });
      throw err;
    }
  }, [authenticate]);

  // Creates the account and sends a confirmation email. Does NOT sign the person in:
  // they sign in after clicking the link. Resolves to { email, pendingVerification: true }.
  const register = useCallback(async (name, email, password) => {
    if (!firebaseEnabled) {
      const profile = await authenticate('/auth/register', { name, email, password });
      return { ...profile, pendingVerification: false };
    }
    const res = await signUpWithEmail(name, email, password);
    return { ...res, pendingVerification: true };
  }, [authenticate]);

  // Google via Firebase Auth. Resolves to null if the person closes the Google window.
  const loginWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    if (!idToken) return null;
    return authenticate('/auth/firebase', { idToken });
  }, [authenticate]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    loginWithGoogle,
    logout,
    setUser
  }), [user, loading, login, register, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
