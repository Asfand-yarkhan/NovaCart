const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
        type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, trim: true, default: '' },
    cart: [cartItemSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    address: {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublic = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        phone: this.phone,
        address: this.address,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);
