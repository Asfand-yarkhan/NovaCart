import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = user?._id || null;

  // Saved items are tagged with the user they belong to, so a sign-out or account switch
  // never shows someone else's list and no effect has to reset state.
  const [saved, setSaved] = useState({ owner: null, items: [] });
  const items = useMemo(() => (saved.owner === userId ? saved.items : []), [saved, userId]);
  const loading = Boolean(userId) && saved.owner !== userId;
  const setItems = useCallback((list) => setSaved({ owner: userId, items: list }), [userId]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    api('/users/wishlist')
      .then(list => { if (live) setSaved({ owner: userId, items: list }); })
      .catch(() => { if (live) setSaved({ owner: userId, items: [] }); });
    return () => { live = false; };
  }, [userId]);

  const isWishlisted = useCallback((id) => items.some(p => p._id === id), [items]);

  // Guests are sent to sign in and brought back afterwards
  const toggleWishlist = useCallback(async (product) => {
    if (!user) {
      toast({ title: 'Sign in to save items', description: 'Your saved items follow you across devices.' });
      navigate('/login', { state: { from: location } });
      return;
    }
    const before = items;
    const wasSaved = items.some(p => p._id === product._id);
    setItems(wasSaved ? items.filter(p => p._id !== product._id) : [...items, product]);
    try {
      setItems(await api('/users/wishlist', { method: 'POST', body: { productId: product._id } }));
      toast.success(wasSaved ? 'Removed from saved items' : 'Saved for later');
    } catch (err) {
      setItems(before);
      toast.error(err.message);
    }
  }, [user, items, setItems, toast, navigate, location]);

  const value = useMemo(() => ({ items, loading, count: items.length, isWishlisted, toggleWishlist }), [items, loading, isWishlisted, toggleWishlist]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
