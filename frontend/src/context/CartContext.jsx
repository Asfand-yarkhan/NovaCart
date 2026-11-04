import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { imageUrl } from '../lib/assets';
import { deliveryFeeFor, FREE_DELIVERY_THRESHOLD, MAX_QTY_PER_ITEM } from '../lib/store';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const GUEST_KEY = 'novacart_guest_cart';
const readGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; } };
const writeGuest = (items) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } };

// Only keep the product fields the basket needs
const slim = (p) => ({
  _id: p._id, name: p.name, slug: p.slug, price: p.price, compareAtPrice: p.compareAtPrice,
  unit: p.unit, stock: p.stock, image: p.image, category: p.category
});

const clampQty = (qty, stock) => Math.max(0, Math.min(qty, MAX_QTY_PER_ITEM, stock ?? MAX_QTY_PER_ITEM));

/**
 * Basket state. Guests keep it in localStorage; signed-in users sync with the API.
 * When a guest signs in, their basket is merged into the account basket.
 */
export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(readGuest);
  const [loading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const prevUser = useRef(null);
  const userId = user?._id || null;

  // When the signed-in user changes, switch baskets during render (no effect needed):
  // signing out shows the guest basket, signing in shows a loading state until the API answers.
  const [basketOwner, setBasketOwner] = useState(null);
  if (!authLoading && basketOwner !== userId) {
    setBasketOwner(userId);
    if (!userId) setItems(readGuest());
    else setLoading(true);
  }

  // Always-current basket for the mutators below, so several quick calls in a row
  // build on each other instead of on a stale render's copy.
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const commit = useCallback((next) => { itemsRef.current = next; setItems(next); }, []);

  // Load the account basket, merging any guest basket on sign-in
  useEffect(() => {
    if (authLoading) return;
    const wasGuest = !prevUser.current;
    prevUser.current = userId;
    if (!userId) return;

    const guest = readGuest();
    const request = wasGuest && guest.length
      ? api('/users/cart/merge', { method: 'POST', body: { items: guest.map(i => ({ productId: i.product._id, quantity: i.quantity })) } })
      : api('/users/cart');
    request
      .then(cart => { commit(cart); if (guest.length) writeGuest([]); })
      .catch(() => commit([]))
      .finally(() => setLoading(false));
  }, [userId, authLoading, commit]);

  // Persist guest basket
  useEffect(() => {
    if (!user && !authLoading) writeGuest(items);
  }, [items, user, authLoading]);

  const sync = useCallback(async (request, rollback) => {
    try {
      commit(await request());
      return true;
    } catch (err) {
      commit(rollback);
      toast.error(err.message);
      return false;
    }
  }, [toast, commit]);

  const getQty = useCallback((productId) => items.find(i => i.product._id === productId)?.quantity || 0, [items]);

  const addToCart = useCallback(async (product, quantity = 1, { silent = false } = {}) => {
    if (product.stock <= 0) { toast.error(`${product.name} is out of stock.`); return false; }
    const before = itemsRef.current;
    const existing = before.find(i => i.product._id === product._id);
    const nextQty = clampQty((existing?.quantity || 0) + quantity, product.stock);
    if (existing && nextQty === existing.quantity) {
      if (!silent) toast.error(`You already have the maximum of ${nextQty} × ${product.name}.`);
      return false;
    }
    commit(existing
      ? before.map(i => (i.product._id === product._id ? { ...i, quantity: nextQty } : i))
      : [...before, { product: slim(product), quantity: nextQty }]);

    const ok = user
      ? await sync(() => api('/users/cart', { method: 'POST', body: { productId: product._id, quantity } }), before)
      : true;
    if (ok && !silent) {
      toast({
        type: 'success',
        title: `${product.name} added`,
        description: `${nextQty} in your basket`,
        image: imageUrl(product.image),
        action: { label: 'View basket', onClick: () => setOpen(true) }
      });
    }
    return ok;
  }, [user, sync, toast, commit]);

  const updateQty = useCallback(async (productId, quantity) => {
    const before = itemsRef.current;
    const line = before.find(i => i.product._id === productId);
    if (!line) return;
    const q = clampQty(quantity, line.product.stock);
    commit(q <= 0
      ? before.filter(i => i.product._id !== productId)
      : before.map(i => (i.product._id === productId ? { ...i, quantity: q } : i)));
    if (user) await sync(() => api(`/users/cart/${productId}`, { method: 'PUT', body: { quantity: q } }), before);
  }, [user, sync, commit]);

  const removeFromCart = useCallback(async (productId) => {
    const before = itemsRef.current;
    const line = before.find(i => i.product._id === productId);
    commit(before.filter(i => i.product._id !== productId));
    const ok = user ? await sync(() => api(`/users/cart/${productId}`, { method: 'DELETE' }), before) : true;
    if (ok && line) {
      toast({
        title: `${line.product.name} removed`,
        action: { label: 'Undo', onClick: () => addToCart(line.product, line.quantity, { silent: true }) }
      });
    }
  }, [user, sync, toast, addToCart, commit]);

  // Called after a successful order; the server already emptied the account basket.
  const clearCart = useCallback(async ({ local = false } = {}) => {
    commit([]);
    if (!user) writeGuest([]);
    else if (!local) await api('/users/cart', { method: 'DELETE' }).catch(() => {});
  }, [user, commit]);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);
    const savings = items.reduce((s, i) => s + Math.max(0, (i.product?.compareAtPrice || 0) - i.product.price) * i.quantity, 0);
    const deliveryFee = deliveryFeeFor(subtotal);
    return {
      items, loading, count, subtotal, savings, deliveryFee,
      total: subtotal + deliveryFee,
      freeDeliveryRemaining: Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal),
      isOpen, openCart: () => setOpen(true), closeCart: () => setOpen(false),
      getQty, addToCart, updateQty, removeFromCart, clearCart
    };
  }, [items, loading, isOpen, getQty, addToCart, updateQty, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
