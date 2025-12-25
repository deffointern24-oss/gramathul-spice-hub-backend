const Order = require('../models/Order');

//  User: Create order 
exports.createOrder = async (req, res) => {
  try {
    const { 
      items, 
      subtotal, 
      tax, 
      shipping, 
      discount, 
      paymentStatus, 
      paymentMethod, 
      deliveryAddress 
    } = req.body;

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
    const populated = await order.populate({
      path: 'items.productId',
      select: '-images'
    });
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

//  User: View order history
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate({
        path: 'items.productId',
        select: '-images'
      })
      .sort({ createdAt: -1 })
      .lean(); 

    res.json(orders);
  } catch (err) {
    console.error('getOrdersByUser error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })
    .populate({
      path: 'items.productId',
      select: '-images'
    })
    .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('getOrderDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

//  Admin: View all orders with pagination
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate({
          path: 'items.productId',
          select: 'name price weight' 
        })
        .populate({
          path: 'userId',
          select: 'name email phone'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(), 
      Order.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(totalOrders / limitNum);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalOrders,
        hasMore: pageNum < totalPages,
        limit: limitNum,
        showing: orders.length
      }
    });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};


//  Admin: Change order status 
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    console.log('Updating order status to:', status);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'items.productId',
      select: '-images'
    })
    .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};