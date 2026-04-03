import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [cartItems, setCartItems]             = useState([]);
    const [cartLoading, setCartLoading]         = useState(false);
    const [appliedCoupon, setAppliedCoupon]     = useState(null); // { code, type, value, description }
    const [lastCartActivity, setLastCartActivity] = useState(null); // timestamp

    // ── Load cart when user logs in ──────────────────
    useEffect(() => {
        if (token && user) {
            setCartLoading(true);
            api('/users/cart')
                .then(data => { setCartItems(data); })
                .catch(() => setCartItems([]))
                .finally(() => setCartLoading(false));
        } else if (!user) {
            setCartItems([]); // guests have no cart
        }
        // Restore coupon from localStorage
        const savedCoupon = localStorage.getItem('novacart_coupon');
        if (savedCoupon) {
            try { setAppliedCoupon(JSON.parse(savedCoupon)); } catch { /* ignore */ }
        }
        // Restore last activity
        const savedActivity = localStorage.getItem('novacart_cart_activity');
        if (savedActivity) setLastCartActivity(Number(savedActivity));
    }, [user, token]);

    // ── Guest cart persist removed — guests cannot add items now ──

    // ── Persist coupon ───────────────────────────────
    useEffect(() => {
        if (appliedCoupon) {
            localStorage.setItem('novacart_coupon', JSON.stringify(appliedCoupon));
        } else {
            localStorage.removeItem('novacart_coupon');
        }
    }, [appliedCoupon]);

    const trackActivity = useCallback(() => {
        const now = Date.now();
        setLastCartActivity(now);
        localStorage.setItem('novacart_cart_activity', String(now));
    }, []);

    const addToCart = async (product, quantity = 1) => {
        // Block guest users — must be signed in to add to cart
        if (!user) return;
        trackActivity();
        const updated = await api('/users/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: product._id, quantity })
        });
        setCartItems(updated);
    };

    const removeFromCart = async (productId) => {
        trackActivity();
        if (user) {
            const updated = await api(`/users/cart/${productId}`, { method: 'DELETE' });
            setCartItems(updated);
        } else {
            setCartItems(prev => prev.filter(i => i.product._id !== productId));
        }
    };

    const updateQty = async (productId, quantity) => {
        trackActivity();
        if (user) {
            const updated = await api(`/users/cart/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
            setCartItems(updated);
        } else {
            setCartItems(prev => {
                if (quantity <= 0) return prev.filter(i => i.product._id !== productId);
                return prev.map(i => i.product._id === productId ? { ...i, quantity } : i);
            });
        }
    };

    const clearCart = async () => {
        if (user) await api('/users/cart', { method: 'DELETE' });
        setCartItems([]);
        setAppliedCoupon(null);
        localStorage.removeItem('novacart_cart_activity');
        setLastCartActivity(null);
    };

    // ── Coupon Actions ──────────────────────────────────
    const applyDiscount = useCallback((coupon) => {
        setAppliedCoupon(coupon);
    }, []);

    const removeDiscount = useCallback(() => {
        setAppliedCoupon(null);
    }, []);

    // ── Computed Values ─────────────────────────────────
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const cartTotal = cartItems.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);

    const discountAmount = (() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percent')  return Math.round(cartTotal * appliedCoupon.value / 100);
        if (appliedCoupon.type === 'flat')     return appliedCoupon.value;
        if (appliedCoupon.type === 'shipping') return 150; // covers delivery fee
        return 0;
    })();

    const finalTotal = Math.max(0, cartTotal - (appliedCoupon?.type === 'shipping' ? 0 : discountAmount));

    // ── Cart context for chatbot (flattened list) ────────
    const chatCartItems = cartItems.map(i => ({
        productId: i.product._id,
        _id: i.product._id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image,
        category: i.product.category,
    }));

    return (
        <CartContext.Provider value={{
            cartItems, cartLoading, cartCount, cartTotal,
            addToCart, removeFromCart, updateQty, clearCart,
            appliedCoupon, applyDiscount, removeDiscount,
            discountAmount, finalTotal,
            lastCartActivity, chatCartItems
        }}>
            {children}
        </CartContext.Provider>
    );
};
