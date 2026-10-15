const express = require('express');
const { body } = require('express-validator');
const { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus, getDashboardStats } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/',          protect, [body('items').isArray({ min: 1 }).withMessage('Items required')], placeOrder);
router.get('/my',         protect, getMyOrders);
router.get('/stats',      protect, adminOnly, getDashboardStats);
router.get('/',           protect, adminOnly, getAllOrders);
router.get('/:id',        protect, getOrderById);
router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/status', protect, adminOnly, [body('status').notEmpty()], updateOrderStatus);
module.exports = router;
