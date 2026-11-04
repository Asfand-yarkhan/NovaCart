const express = require('express');
const { register, login, firebaseLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// 10 failed attempts per 15 minutes per IP for credential endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/firebase', authLimiter, firebaseLogin);
router.post('/google', authLimiter, firebaseLogin); // kept for older clients
router.get('/me', protect, getMe);

module.exports = router;
