const express = require('express');
const {
    createOrder, createPaymentIntent, getMyOrders, getOrderById,
    cancelMyOrder, getAllOrders, updateOrderStatus
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);

// Admin
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelMyOrder);

module.exports = router;
