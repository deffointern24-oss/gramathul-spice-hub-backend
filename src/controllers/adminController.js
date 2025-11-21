const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Total orders
exports.getTotalOrders = async (req, res) => {
  const total = await Order.countDocuments();
  res.json({ totalOrders: total });
};

// Total earnings (sum of all order subtotals)
exports.getTotalEarnings = async (req, res) => {
  const orders = await Order.find();
  const total = orders.reduce((sum, o) => sum + (o.subtotal - (o.discount || 0) + (o.tax || 0) + (o.shipping || 0)), 0);
  res.json({ totalEarnings: total });
};

// Top selling products
exports.getTopSellingProducts = async (req, res) => {
  const pipeline = [
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    { $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }},
    { $unwind: '$product' },
    { $project: { product: 1, totalSold: 1 } }
  ];
  const topProducts = await Order.aggregate(pipeline);
  res.json(topProducts);
};

// Total customers
exports.getTotalCustomers = async (req, res) => {
  const total = await User.countDocuments({ role: 'USER' });
  res.json({ totalCustomers: total });
};

// Recent orders
exports.getRecentOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
  res.json(orders);
};
