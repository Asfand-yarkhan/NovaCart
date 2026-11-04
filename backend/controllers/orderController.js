const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { httpError } = require('../middleware/errorMiddleware');
const {
    DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MAX_QTY_PER_ITEM,
    DELIVERY_WINDOWS, ORDER_STATUSES, CANCELLABLE_BY_CUSTOMER
} = require('../config/store');

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const deliveryFeeFor = (subtotal) => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

const restoreStock = async (order) => {
    if (order.stockRestored) return;
    await Promise.all(order.items.map(i =>
        i.product ? Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }) : null
    ));
    order.stockRestored = true;
};

// @route POST /api/orders
// Body: { items: [{ product, quantity }], shippingAddress, deliverySlot, notes, saveAddress }
// Prices, totals and stock are always taken from the database, never from the client.
const createOrder = async (req, res) => {
    const { items, shippingAddress = {}, deliverySlot = {}, notes, saveAddress } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Your basket is empty.');

    const required = ['fullName', 'phone', 'street', 'city'];
    const missing = required.filter(k => !String(shippingAddress[k] || '').trim());
    if (missing.length) {
        const fields = Object.fromEntries(missing.map(k => [k, 'Required']));
        return res.status(400).json({ message: 'Please complete your delivery address.', fields });
    }
    if (!/^[0-9+\-\s()]{10,16}$/.test(String(shippingAddress.phone).trim())) {
        return res.status(400).json({ message: 'Enter a valid phone number.', fields: { phone: 'Enter a valid phone number' } });
    }
    if (deliverySlot.window && !DELIVERY_WINDOWS.includes(deliverySlot.window)) {
        throw httpError(400, 'Choose one of the available delivery windows.');
    }

    // Merge duplicate lines and load products
    const qtyById = new Map();
    for (const line of items) {
        const id = String(line.product || line.productId || '');
        const qty = Math.floor(Number(line.quantity));
        if (!id || !(qty > 0)) throw httpError(400, 'Each item needs a product and a quantity.');
        qtyById.set(id, Math.min(MAX_QTY_PER_ITEM, (qtyById.get(id) || 0) + qty));
    }
    const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
    if (products.length !== qtyById.size) throw httpError(400, 'Some items in your basket are no longer available.');

    // Reserve stock atomically; roll back if any line fails
    const reserved = [];
    for (const product of products) {
        const qty = qtyById.get(product._id.toString());
        const ok = await Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } }
        );
        if (!ok) {
            await Promise.all(reserved.map(r => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
            throw httpError(409, product.stock > 0
                ? `Only ${product.stock} × ${product.name} left. Please lower the quantity.`
                : `${product.name} just sold out. Please remove it from your basket.`);
        }
        reserved.push({ id: product._id, qty });
    }

    const orderItems = products.map(p => ({
        product: p._id, name: p.name, slug: p.slug, unit: p.unit,
        price: p.price, quantity: qtyById.get(p._id.toString()), image: p.image
    }));
    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = deliveryFeeFor(subtotal);

    let order;
    try {
        order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress: {
                fullName: shippingAddress.fullName, phone: shippingAddress.phone,
                street: shippingAddress.street, city: shippingAddress.city,
                state: shippingAddress.state, zip: shippingAddress.zip,
                country: shippingAddress.country || 'Pakistan'
            },
            deliverySlot: {
                date: deliverySlot.date ? new Date(deliverySlot.date) : undefined,
                window: deliverySlot.window
            },
            notes,
            paymentMethod: 'cod',
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee
        });
    } catch (err) {
        await Promise.all(reserved.map(r => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
        throw err;
    }

    const update = { cart: [] };
    if (saveAddress) update.address = order.shippingAddress.toObject();
    if (saveAddress && !req.user.phone) update.phone = shippingAddress.phone;
    await User.findByIdAndUpdate(req.user._id, update);

    res.status(201).json(order);
};

// @route POST /api/orders/create-payment-intent
// Card payments are optional. Without a Stripe key the store runs on cash on delivery.
const createPaymentIntent = async (req, res) => {
    if (!stripe) throw httpError(503, 'Card payments are not enabled. Please use cash on delivery.');
    const amount = Math.round(Number(req.body?.amount));
    if (!(amount > 0)) throw httpError(400, 'Amount must be greater than zero.');
    const paymentIntent = await stripe.paymentIntents.create({
        amount, currency: 'pkr', automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
};

// @route GET /api/orders/mine
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
};

// @route GET /api/orders/:id
const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) throw httpError(404, 'We could not find that order.');
    if (order.user?._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw httpError(403, 'You do not have access to this order.');
    }
    res.json(order);
};

// @route PUT /api/orders/:id/cancel (customer)
const cancelMyOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'We could not find that order.');
    if (order.user.toString() !== req.user._id.toString()) throw httpError(403, 'You do not have access to this order.');
    if (!CANCELLABLE_BY_CUSTOMER.includes(order.status)) {
        throw httpError(400, `This order is already ${order.status} and can no longer be cancelled.`);
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' });
    await restoreStock(order);
    await order.save();
    res.json(order);
};

// @route GET /api/orders (admin) ?status=&q=
const getAllOrders = async (req, res) => {
    const { status, q } = req.query;
    const filter = {};
    if (status && ORDER_STATUSES.includes(status)) filter.status = status;
    if (q && q.trim()) {
        const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }, { 'shippingAddress.city': rx }];
    }
    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(500).lean();
    res.json(orders);
};

// @route PUT /api/orders/:id/status (admin)
const updateOrderStatus = async (req, res) => {
    const { status, note } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) throw httpError(400, 'Unknown order status.');

    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (order.status === status) return res.json(order);
    if (order.status === 'cancelled') throw httpError(400, 'A cancelled order cannot be reopened.');

    order.status = status;
    order.statusHistory.push({ status, note });
    if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    if (status === 'cancelled') await restoreStock(order);
    await order.save();
    await order.populate('user', 'name email');
    res.json(order);
};

module.exports = {
    createOrder, createPaymentIntent, getMyOrders, getOrderById,
    cancelMyOrder, getAllOrders, updateOrderStatus, deliveryFeeFor
};
