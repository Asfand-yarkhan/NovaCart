const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
        type: String, required: [true, 'Email is required'], trim: true, lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    subject: { type: String, trim: true, maxlength: 120, default: 'General question' },
    orderNumber: { type: String, trim: true, default: '' },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
