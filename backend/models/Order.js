const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: String,
        zip: { type: String, required: true },
        country: { type: String, default: 'Pakistan' }
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 150 },
    total: { type: Number, required: true },
    paymentIntentId: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    status: {
        type: String,
        enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
