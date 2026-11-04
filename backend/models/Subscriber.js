const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String, required: true, unique: true, trim: true, lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
