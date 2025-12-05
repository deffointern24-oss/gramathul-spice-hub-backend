const Order = require('../models/Order');

// User: Create order
exports.createOrder = async (req, res) => {
  const { items, subtotal, tax, shipping, discount, paymentStatus, paymentMethod, deliveryAddress } = req.body;
  const order = new Order({
    userId: req.user.id,
    items,
    subtotal,
    tax,
    shipping,
    discount,
    paymentStatus,
    orderStatus: 'pending',
    paymentMethod,
    deliveryAddress
  });
  await order.save();
  res.status(201).json(order);
};

// User: View order history
exports.getOrdersByUser = async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
};

// User: Get order details
exports.getOrderDetails = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

// Admin: View all orders
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

// Admin: Change order status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  console.log('Updating order status to:', status);
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.orderStatus = status;
  await order.save();
  res.json(order);
};
