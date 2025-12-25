const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTotalOrders,
  getTotalEarnings,
  getTopSellingProducts,
  getTotalCustomers,
  getRecentOrders
} = require('../controllers/adminController');
const Product = require('../models/Product');

const router = express.Router();

router.get('/orders/total', authenticate, authorize(['ADMIN']), getTotalOrders);
router.get('/earnings/total', authenticate, authorize(['ADMIN']), getTotalEarnings);
router.get('/products/top', authenticate, authorize(['ADMIN']), getTopSellingProducts);
router.get('/customers/total', authenticate, authorize(['ADMIN']), getTotalCustomers);
router.get('/orders/recent', authenticate, authorize(['ADMIN']), getRecentOrders);
router.get('/products/analytics', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const inStockCount = await Product.countDocuments({ inStock: true });
    const outOfStockCount = await Product.countDocuments({ inStock: false });

    res.json({
      success: true,
      analytics: {
        totalProducts,
        inStockCount,
        outOfStockCount,
        inStockPercentage: Math.round((inStockCount / totalProducts) * 100),
        outOfStockPercentage: Math.round((outOfStockCount / totalProducts) * 100)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get all in-stock products (for analytics) with pagination
router.get('/in-stock', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit)
    const skip = (page - 1) * limit;

    const totalInStock = await Product.countDocuments({ inStock: true });

    const inStockProducts = await Product.find({ inStock: true })
      .select('name price category weight inStock isOrganic benefits uses description origin originalPrice')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalInStock / limit);

    res.json({
      success: true,
      products: inStockProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: totalInStock,
        hasMore: page < totalPages,
        limit,
        showing: inStockProducts.length
      }
    });
  } catch (error) {
    console.error('In-stock products error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all out-of-stock products (for analytics) with pagination
router.get('/out-of-stock', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    const totalOutOfStock = await Product.countDocuments({ inStock: false });

    const outOfStockProducts = await Product.find({ inStock: false })
      .select('name price category weight inStock isOrganic benefits uses description origin originalPrice') 
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOutOfStock / limit);

    res.json({
      success: true,
      products: outOfStockProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: totalOutOfStock,
        hasMore: page < totalPages,
        limit,
        showing: outOfStockProducts.length
      }
    });
  } catch (error) {
    console.error('Out-of-stock products error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
