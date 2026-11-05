const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { httpError } = require('../middleware/errorMiddleware');
const { verifyFirebaseToken } = require('../utils/firebaseAuth');

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
    if (user && !user.password && user.firebaseUid) {
        throw httpError(401, 'That email and password do not match.');
    }
    if (!user || !(await user.matchPassword(password))) {
        throw httpError(401, 'That email and password do not match.');
    }
    res.json(withToken(user));
};

// @route POST /api/auth/firebase  { idToken, name? }   (alias: /api/auth/google)
// Exchanges a Firebase ID token (Google, or email + password) for a NovaCart session.
// The email must be verified: Google verifies it, email sign-ups click the link Firebase sends.
// An existing account with the same verified email is linked, not duplicated.
const firebaseLogin = async (req, res) => {
    const idToken = req.body?.idToken;
    if (!idToken || typeof idToken !== 'string') throw httpError(400, 'Missing sign-in token.');

    let identity;
    try {
        identity = await verifyFirebaseToken(idToken);
    } catch {
        throw httpError(401, 'Sign-in could not be verified. Please try again.');
    }
    if (!identity.email) throw httpError(401, 'This sign-in method did not share an email address.');
    if (!identity.emailVerified) {
        return res.status(403).json({
            code: 'email_not_verified',
            message: 'Please confirm your email first. We sent a link to ' + identity.email + '.'
        });
    }

    const provider = identity.provider === 'google.com' ? 'google' : identity.provider === 'password' ? 'email' : identity.provider;
    let user = await User.findOne({ firebaseUid: identity.uid });
    if (!user) {
        user = await User.findOne({ email: identity.email });
        if (user) {
            user.firebaseUid = identity.uid;
        } else {
            const requested = String(req.body?.name || '').trim().slice(0, 80);
            user = new User({
                name: requested || identity.name || identity.email.split('@')[0],
                email: identity.email,
                firebaseUid: identity.uid
            });
        }
    }
    if (!user.avatar && identity.picture) user.avatar = identity.picture;
    if (provider && !user.firebaseProviders.includes(provider)) user.firebaseProviders.push(provider);
    await user.save();
    res.status(200).json(withToken(user));
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
    res.json(req.user.toPublic());
};

module.exports = { register, login, firebaseLogin, getMe };
