const express = require('express');
const router = express.Router();
const {
    getProfile, updateProfile,
    getCart, addToCart, updateCartItem, removeFromCart, clearCart,
    getWishlist, toggleWishlist,
    getAllUsers, updateUserRole
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Cart
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.put('/cart/:productId', protect, updateCartItem);
router.delete('/cart/:productId', protect, removeFromCart);
router.delete('/cart', protect, clearCart);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, toggleWishlist);

// Admin – User Management
router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
