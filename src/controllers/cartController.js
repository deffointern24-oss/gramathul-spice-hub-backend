const Cart = require('../models/Cart');
// const Product = require('../models/Product');

// Add to cart
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }
  const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  await cart.save();
  res.json(cart);
};

// Update quantity
exports.updateQuantity = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;
  const cart = await Cart.findOne({ userId });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const item = cart.items.find(item => item.productId.equals(productId));
  if (item) item.quantity = quantity;
  await cart.save();
  res.json(cart);
};
// remove single when you are pass on productid and remove all when you are nothing pass any product id
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
    return res.json(cart);
  } catch (err) {
    console.error('removeItem error:', err);
    return res.status(500).json({ error: 'Failed to update cart' });
  }
};


// View cart
exports.getCart = async (req, res) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  if (!cart) return res.json({ items: [] });
  res.json(cart);
};
