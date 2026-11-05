const express = require('express');
const { chat } = require('../controllers/assistantController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Signed-in shoppers get order tracking and cancelling; guests can still search and fill a basket.
router.post('/', optionalAuth, chat);

module.exports = router;
