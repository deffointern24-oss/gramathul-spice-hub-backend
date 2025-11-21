const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTotalOrders,
  getTotalEarnings,
  getTopSellingProducts,
  getTotalCustomers,
  getRecentOrders
} = require('../controllers/adminController');

const router = express.Router();

router.get('/orders/total', authenticate, authorize(['ADMIN']), getTotalOrders);
router.get('/earnings/total', authenticate, authorize(['ADMIN']), getTotalEarnings);
router.get('/products/top', authenticate, authorize(['ADMIN']), getTopSellingProducts);
router.get('/customers/total', authenticate, authorize(['ADMIN']), getTotalCustomers);
router.get('/orders/recent', authenticate, authorize(['ADMIN']), getRecentOrders);

module.exports = router;
