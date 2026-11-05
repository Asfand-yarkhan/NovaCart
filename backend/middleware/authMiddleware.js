const jwt = require('jsonwebtoken');
const User = require('../models/User');

const readToken = (req) => {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const protect = async (req, res, next) => {
    const token = readToken(req);
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id); // only ever sent to clients via toPublic()
        if (!req.user) return res.status(401).json({ message: 'Your account no longer exists.' });
        next();
    } catch {
        return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
};

// Attaches req.user when a valid token is present, but never blocks the request.
const optionalAuth = async (req, res, next) => {
    const token = readToken(req);
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id); // only ever sent to clients via toPublic()
        } catch { /* ignore invalid tokens on public routes */ }
    }
    next();
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access only.' });
};

module.exports = { protect, optionalAuth, adminOnly };
