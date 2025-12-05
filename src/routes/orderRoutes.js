const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrdersByUser,
  getOrderDetails,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

const router = express.Router();

// createOrder for users
router.get('/my', authenticate, authorize(['USER', 'ADMIN']), getOrdersByUser);
router.get('/:id', authenticate, authorize(['USER', 'ADMIN']), getOrderDetails);

// Admin routes
router.get('/', authenticate, authorize(['ADMIN']), getAllOrders);
router.put('/:id/status', authenticate, authorize(['ADMIN']), updateOrderStatus);

module.exports = router;
