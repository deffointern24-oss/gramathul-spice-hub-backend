const Cart = require('../models/Cart');

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId)
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    const populated = await cart.populate({
      path: 'items.productId',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

//  Update quantity 
exports.updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find((item) => item.productId.equals(productId));
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) => !item.productId.equals(productId)
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    const populated = await cart.populate({
      path: 'items.productId',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('updateQuantity error:', err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};

//  Remove single item or clear all 
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    if (productId) {
      cart.items = cart.items.filter(
        (item) => !item.productId.equals(productId)
      );
    } else {
      cart.items = [];
    }

    await cart.save();
    const populated = await cart.populate({
      path: 'items.productId',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('removeItem error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

//  View cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: '-images'
      })
      .lean();

    if (!cart) {
      return res.json({ items: [] });
    }
    
    res.json(cart);
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

//  Merge guest cart into user cart 
exports.mergeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; 

    if (!Array.isArray(items) || !items.length) {
      return res.json({ message: 'No items to merge', items: [] });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    for (const item of items) {
      if (!item.productId || !item.quantity) continue;

      const existsIndex = cart.items.findIndex((ci) =>
        ci.productId.equals(item.productId)
      );

      if (existsIndex > -1) {
        cart.items[existsIndex].quantity += item.quantity;
      } else {
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    await cart.save();
    const populated = await cart.populate({
      path: 'items.productId',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('mergeCart error:', err);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
};