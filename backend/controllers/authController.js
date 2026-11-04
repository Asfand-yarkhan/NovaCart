const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { httpError } = require('../middleware/errorMiddleware');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const withToken = (user) => ({ ...user.toPublic(), token: generateToken(user._id) });

// @route POST /api/auth/register
// Role is never read from the request: every self-registered account is a customer.
const register = async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) throw httpError(400, 'Name, email and password are required.');
    if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw httpError(409, 'An account with this email already exists.');

    const user = await User.create({ name, email, password });
    res.status(201).json(withToken(user));
};

// @route POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw httpError(400, 'Email and password are required.');

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
        throw httpError(401, 'That email and password do not match.');
    }
    res.json(withToken(user));
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
    res.json(req.user.toPublic());
};

module.exports = { register, login, getMe };
