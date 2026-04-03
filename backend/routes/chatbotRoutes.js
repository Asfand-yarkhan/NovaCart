const express = require('express');
const router = express.Router();
const { handleQuery, getSuggestions, applyCouponHandler } = require('../controllers/chatbotController');

// Optional auth middleware — attaches user if token exists, but doesn't block
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        try {
            const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (e) {
            // Token invalid – proceed as guest
        }
    }
    next();
};

// POST /api/chatbot/query — Main chat handler (works for guests & logged-in users)
router.post('/query', optionalAuth, handleQuery);

// POST /api/chatbot/apply-coupon — Validate & return coupon details
router.post('/apply-coupon', applyCouponHandler);

// GET /api/chatbot/suggestions?q= — Autocomplete
router.get('/suggestions', getSuggestions);

module.exports = router;
