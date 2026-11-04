const express = require('express');
const {
    getProfile, updateProfile, changePassword,
    getCart, addToCart, mergeCart, updateCartItem, removeFromCart, clearCart,
    getWishlist, toggleWishlist,
    getAllUsers, updateUserRole
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);

// Cart
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.post('/cart/merge', protect, mergeCart);
router.put('/cart/:productId', protect, updateCartItem);
router.delete('/cart/:productId', protect, removeFromCart);
router.delete('/cart', protect, clearCart);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, toggleWishlist);

// Admin – user management
router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
