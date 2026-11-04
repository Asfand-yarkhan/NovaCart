const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../config/store');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    slug: String,
    unit: String,
    price: Number,
    quantity: Number,
    image: String
}, { _id: false });

const statusEventSchema = new mongoose.Schema({
    status: { type: String, enum: ORDER_STATUSES },
    at: { type: Date, default: Date.now },
    note: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
        type: [orderItemSchema],
        validate: [v => v.length > 0, 'An order needs at least one item']
    },
    shippingAddress: {
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, trim: true },
        zip: { type: String, trim: true },
        country: { type: String, default: 'Pakistan' }
    },
    deliverySlot: {
        date: { type: Date },
        window: { type: String }
    },
    notes: { type: String, trim: true, maxlength: 500 },
    paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentIntentId: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'processing' },
    statusHistory: [statusEventSchema],
    stockRestored: { type: Boolean, default: false }
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Human-friendly order number, e.g. NC-261104-4821
orderSchema.pre('validate', function () {
    if (!this.orderNumber) {
        const d = this.createdAt || new Date();
        const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
        this.orderNumber = `NC-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({ status: this.status, at: this.createdAt || new Date() });
    }
});

module.exports = mongoose.model('Order', orderSchema);
