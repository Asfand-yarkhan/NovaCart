const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { httpError } = require('../middleware/errorMiddleware');
const { MAX_QTY_PER_ITEM } = require('../config/store');

const CART_FIELDS = 'name slug price compareAtPrice unit stock image category';

// ─── PROFILE ──────────────────────────────────────────
// @route GET /api/users/profile
const getProfile = async (req, res) => {
    res.json(req.user.toPublic());
};

// @route PUT /api/users/profile
const updateProfile = async (req, res) => {
    const { name, phone, address } = req.body || {};
    const user = await User.findById(req.user._id);
    if (name !== undefined) {
        if (!String(name).trim()) throw httpError(400, 'Name cannot be empty.');
        user.name = String(name).trim();
    }
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address !== undefined) user.address = address;
    await user.save();
    res.json(user.toPublic());
};

// @route PUT /api/users/profile/password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) throw httpError(400, 'Enter your current and new password.');
    if (String(newPassword).length < 6) throw httpError(400, 'New password must be at least 6 characters.');
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
        return res.status(400).json({ message: 'Current password is incorrect.', fields: { currentPassword: 'Incorrect password' } });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated.' });
};

// ─── CART ─────────────────────────────────────────────
const sendCart = async (res, userId) => {
    const user = await User.findById(userId).populate('cart.product', CART_FIELDS);
    // Drop lines whose product was deleted
    const valid = user.cart.filter(i => i.product);
    if (valid.length !== user.cart.length) {
        user.cart = valid.map(i => ({ product: i.product._id, quantity: i.quantity }));
        await user.save();
    }
    res.json(valid);
};

const clampQty = (qty, stock) => Math.max(1, Math.min(Math.floor(qty), MAX_QTY_PER_ITEM, Math.max(stock, 1)));

// @route GET /api/users/cart
const getCart = (req, res) => sendCart(res, req.user._id);

// @route POST /api/users/cart  { productId, quantity }
const addToCart = async (req, res) => {
    const { productId } = req.body || {};
    const quantity = Number(req.body?.quantity ?? 1);
    if (!mongoose.isValidObjectId(productId) || !(quantity > 0)) throw httpError(400, 'Invalid product or quantity.');
    const product = await Product.findById(productId).select('stock name');
    if (!product) throw httpError(404, 'That product is no longer available.');
    if (product.stock <= 0) throw httpError(409, `${product.name} is out of stock.`);

    const user = await User.findById(req.user._id);
    const line = user.cart.find(i => i.product.toString() === productId);
    if (line) line.quantity = clampQty(line.quantity + quantity, product.stock);
    else user.cart.push({ product: productId, quantity: clampQty(quantity, product.stock) });
    await user.save();
    return sendCart(res, req.user._id);
};

// @route POST /api/users/cart/merge  { items: [{ productId, quantity }] }
// Called after sign-in to fold a guest basket into the account basket.
const mergeCart = async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const ids = items.map(i => i.productId).filter(id => mongoose.isValidObjectId(id));
    const products = await Product.find({ _id: { $in: ids } }).select('stock');
    const stockById = new Map(products.map(p => [p._id.toString(), p.stock]));

    const user = await User.findById(req.user._id);
    for (const item of items) {
        const stock = stockById.get(String(item.productId));
        if (!stock) continue;
        const line = user.cart.find(i => i.product.toString() === String(item.productId));
        const qty = Number(item.quantity) || 1;
        if (line) line.quantity = clampQty(Math.max(line.quantity, qty), stock);
        else user.cart.push({ product: item.productId, quantity: clampQty(qty, stock) });
    }
    await user.save();
    return sendCart(res, req.user._id);
};

// @route PUT /api/users/cart/:productId  { quantity }
const updateCartItem = async (req, res) => {
    const quantity = Number(req.body?.quantity);
    const user = await User.findById(req.user._id);
    const line = user.cart.find(i => i.product.toString() === req.params.productId);
    if (!line) throw httpError(404, 'That item is not in your basket.');
    if (!(quantity > 0)) {
        user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    } else {
        const product = await Product.findById(req.params.productId).select('stock');
        line.quantity = clampQty(quantity, product?.stock ?? quantity);
    }
    await user.save();
    return sendCart(res, req.user._id);
};

// @route DELETE /api/users/cart/:productId
const removeFromCart = async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $pull: { cart: { product: req.params.productId } } });
    return sendCart(res, req.user._id);
};

// @route DELETE /api/users/cart
const clearCart = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json([]);
};

// ─── WISHLIST ─────────────────────────────────────────
const sendWishlist = async (res, userId) => {
    const user = await User.findById(userId).populate('wishlist', CART_FIELDS + ' rating numReviews');
    res.json(user.wishlist.filter(Boolean));
};

// @route GET /api/users/wishlist
const getWishlist = (req, res) => sendWishlist(res, req.user._id);

// @route POST /api/users/wishlist  { productId }  (toggles)
const toggleWishlist = async (req, res) => {
    const { productId } = req.body || {};
    if (!mongoose.isValidObjectId(productId)) throw httpError(400, 'Invalid product.');
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else {
        if (!(await Product.exists({ _id: productId }))) throw httpError(404, 'That product is no longer available.');
        user.wishlist.push(productId);
    }
    await user.save();
    return sendWishlist(res, req.user._id);
};

// ─── ADMIN ────────────────────────────────────────────
// @route GET /api/users (admin) ?q=
const getAllUsers = async (req, res) => {
    const filter = {};
    if (req.query.q?.trim()) {
        const rx = new RegExp(req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const users = await User.find(filter).select('-password -cart -wishlist').sort({ createdAt: -1 }).lean();
    const stats = await Order.aggregate([
        { $match: { user: { $in: users.map(u => u._id) }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrder: { $max: '$createdAt' } } }
    ]);
    const byId = new Map(stats.map(s => [s._id.toString(), s]));
    res.json(users.map(u => {
        const s = byId.get(u._id.toString());
        return { ...u, orders: s?.orders || 0, spent: s?.spent || 0, lastOrder: s?.lastOrder || null };
    }));
};

// @route PUT /api/users/:id/role (admin)
const updateUserRole = async (req, res) => {
    const { role } = req.body || {};
    if (!['user', 'admin'].includes(role)) throw httpError(400, 'Role must be "user" or "admin".');
    if (req.params.id === req.user._id.toString()) throw httpError(400, 'You cannot change your own role.');
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, 'User not found.');
    user.role = role;
    await user.save();
    res.json(user.toPublic());
};

module.exports = {
    getProfile, updateProfile, changePassword,
    getCart, addToCart, mergeCart, updateCartItem, removeFromCart, clearCart,
    getWishlist, toggleWishlist,
    getAllUsers, updateUserRole
};
