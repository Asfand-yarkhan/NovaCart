const User = require('../models/User');
const Product = require('../models/Product');

// @desc  Get profile
// @route GET /api/users/profile
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
};

// @desc  Update profile
// @route PUT /api/users/profile
const updateProfile = async (req, res) => {
    try {
        const { name, address } = req.body;
        const user = await User.findById(req.user._id);
        if (name) user.name = name;
        if (address) user.address = address;
        await user.save();
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ─── CART ─────────────────────────────────────────────
// @route GET /api/users/cart
const getCart = async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart.product');
    res.json(user.cart);
};

// @route POST /api/users/cart
const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.user._id);
    const existingIdx = user.cart.findIndex(item => item.product.toString() === productId);
    if (existingIdx > -1) {
        user.cart[existingIdx].quantity += quantity;
    } else {
        user.cart.push({ product: productId, quantity });
    }
    await user.save();
    await user.populate('cart.product');
    res.json(user.cart);
};

// @route PUT /api/users/cart/:productId
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);
    const item = user.cart.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });
    if (quantity <= 0) {
        user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    } else {
        item.quantity = quantity;
    }
    await user.save();
    await user.populate('cart.product');
    res.json(user.cart);
};

// @route DELETE /api/users/cart/:productId
const removeFromCart = async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    await user.save();
    await user.populate('cart.product');
    res.json(user.cart);
};

// @route DELETE /api/users/cart
const clearCart = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json([]);
};

// ─── WISHLIST ─────────────────────────────────────────
// @route GET /api/users/wishlist
const getWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
};

// @route POST /api/users/wishlist
const toggleWishlist = async (req, res) => {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    if (idx > -1) {
        user.wishlist.splice(idx, 1);
    } else {
        user.wishlist.push(productId);
    }
    await user.save();
    await user.populate('wishlist');
    res.json(user.wishlist);
};

// ─── ADMIN ────────────────────────────────────────────
// @route GET /api/users (admin)
const getAllUsers = async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
};

// @route PUT /api/users/:id/role (admin)
const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.role = req.body.role;
        await user.save();
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getProfile, updateProfile, getCart, addToCart, updateCartItem, removeFromCart, clearCart, getWishlist, toggleWishlist, getAllUsers, updateUserRole };
