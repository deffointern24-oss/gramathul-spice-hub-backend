const Wishlist = require('../models/Wishlist');

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, products: [] });
    }
    
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
    
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    
    wishlist.products = wishlist.products.filter(p => !p.equals(productId));
    await wishlist.save();
    
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('products');
    if (!wishlist) return res.json({ products: [] });
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
