const Order = require('../../database/models/Order');
const User = require('../../database/models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc  Create order after payment
// @route POST /api/orders
const createOrder = async (req, res) => {
    const { items, shippingAddress, subtotal, deliveryFee, total, paymentIntentId } = req.body;
    try {
        const order = await Order.create({
            user: req.user._id,
            items,
            shippingAddress,
            subtotal,
            deliveryFee: deliveryFee || 150,
            total,
            paymentIntentId: paymentIntentId || null,
            paymentStatus: paymentIntentId ? 'paid' : 'pending',
            status: paymentIntentId ? 'confirmed' : 'processing'
        });
        // Clear user cart after order
        await User.findByIdAndUpdate(req.user._id, { cart: [] });
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: 'Order creation failed', error: err.message });
    }
};

// @desc  Create Stripe payment intent
// @route POST /api/orders/create-payment-intent
const createPaymentIntent = async (req, res) => {
    const { amount } = req.body; // amount in smallest currency unit (paisas / cents)
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: 'pkr',
            automatic_payment_methods: { enabled: true }
        });
        res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
        res.status(500).json({ message: 'Payment intent failed', error: err.message });
    }
};

// @desc  Get my orders
// @route GET /api/orders/mine
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
};

// @desc  Get single order
// @route GET /api/orders/:id
const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorised' });
    }
    res.json(order);
};

// @desc  Get all orders (admin)
// @route GET /api/orders
const getAllOrders = async (req, res) => {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
};

// @desc  Update order status (admin)
// @route PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.status = req.body.status;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { createOrder, createPaymentIntent, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
