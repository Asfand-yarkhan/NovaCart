import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        if (token && user) {
            api('/users/wishlist').then(setWishlistItems).catch(() => setWishlistItems([]));
        } else {
            setWishlistItems([]);
        }
    }, [user, token]);

    const toggleWishlist = async (product) => {
        if (!user) return; // require login
        const updated = await api('/users/wishlist', {
            method: 'POST',
            body: JSON.stringify({ productId: product._id })
        });
        setWishlistItems(updated);
    };

    const isWishlisted = (productId) => wishlistItems.some(p => p._id === productId);

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isWishlisted }}>
            {children}
        </WishlistContext.Provider>
    );
};
