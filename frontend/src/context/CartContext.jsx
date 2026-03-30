import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [cartLoading, setCartLoading] = useState(false);

    // Load cart when user logs in
    useEffect(() => {
        if (token && user) {
            setCartLoading(true);
            api('/users/cart').then(setCartItems).catch(() => setCartItems([])).finally(() => setCartLoading(false));
        } else if (!user) {
            // Guest: use localStorage
            const saved = localStorage.getItem('novacart_guest_cart');
            setCartItems(saved ? JSON.parse(saved) : []);
        }
    }, [user, token]);

    // Persist guest cart
    useEffect(() => {
        if (!user) {
            localStorage.setItem('novacart_guest_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, user]);

    const addToCart = async (product, quantity = 1) => {
        if (user) {
            const updated = await api('/users/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: product._id, quantity })
            });
            setCartItems(updated);
        } else {
            setCartItems(prev => {
                const idx = prev.findIndex(i => i.product._id === product._id);
                if (idx > -1) {
                    const next = [...prev];
                    next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
                    return next;
                }
                return [...prev, { product, quantity }];
            });
        }
    };

    const removeFromCart = async (productId) => {
        if (user) {
            const updated = await api(`/users/cart/${productId}`, { method: 'DELETE' });
            setCartItems(updated);
        } else {
            setCartItems(prev => prev.filter(i => i.product._id !== productId));
        }
    };

    const updateQty = async (productId, quantity) => {
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
    };

    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const cartTotal = cartItems.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, cartLoading, cartCount, cartTotal, addToCart, removeFromCart, updateQty, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
