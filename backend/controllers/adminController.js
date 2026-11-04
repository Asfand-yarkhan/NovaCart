const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Message = require('../models/Message');
const { LOW_STOCK_THRESHOLD, ORDER_STATUSES } = require('../config/store');

const DAY = 24 * 60 * 60 * 1000;

// @route GET /api/admin/stats?days=14
const getStats = async (req, res) => {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
    const since = new Date(Date.now() - (days - 1) * DAY);
    since.setHours(0, 0, 0, 0);
    const prevSince = new Date(since.getTime() - days * DAY);

    const notCancelled = { status: { $ne: 'cancelled' } };

    const [
        totals, prevTotals, byDay, byStatus, topProducts, lowStock,
        productCount, customerCount, newCustomers, unreadMessages, recentOrders
    ] = await Promise.all([
        Order.aggregate([{ $match: { ...notCancelled, createdAt: { $gte: since } } },
            { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { ...notCancelled, createdAt: { $gte: prevSince, $lt: since } } },
            { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { ...notCancelled, createdAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:00' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { ...notCancelled, createdAt: { $gte: since } } }, { $unwind: '$items' },
            { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
            { $sort: { revenue: -1 } }, { $limit: 5 }]),
        Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).select('name slug stock image category unit').sort({ stock: 1 }).limit(8).lean(),
        Product.countDocuments(),
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'user', createdAt: { $gte: since } }),
        Message.countDocuments({ read: false }),
        Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6).lean()
    ]);

    // Fill missing days with zero so the chart has a continuous axis
    const map = new Map(byDay.map(d => [d._id, d]));
    const series = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(since.getTime() + i * DAY + 5 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        series.push({ date: key, revenue: map.get(key)?.revenue || 0, orders: map.get(key)?.orders || 0 });
    }

    const cur = totals[0] || { revenue: 0, orders: 0 };
    const prev = prevTotals[0] || { revenue: 0, orders: 0 };
    const change = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);

    res.json({
        days,
        revenue: cur.revenue,
        revenueChange: change(cur.revenue, prev.revenue),
        orders: cur.orders,
        ordersChange: change(cur.orders, prev.orders),
        averageOrder: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
        customers: customerCount,
        newCustomers,
        products: productCount,
        unreadMessages,
        series,
        byStatus: ORDER_STATUSES.map(s => ({ status: s, count: byStatus.find(b => b._id === s)?.count || 0 })),
        topProducts,
        lowStock,
        recentOrders
    });
};

module.exports = { getStats };
