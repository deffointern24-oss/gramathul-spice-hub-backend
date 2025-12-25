const Wishlist = require('../models/Wishlist');

//  Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, products: [] });
    }

    if (!wishlist.products.some((p) => p.equals(productId))) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
    const populated = await wishlist.populate({
      path: 'products',
      select: '-images' 
    });
    
    res.json(populated);
  } catch (err) {
    console.error('addToWishlist error:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

//  Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (p) => !p.equals(productId)
    );
    await wishlist.save();
    const populated = await wishlist.populate({
      path: 'products',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};

//  View wishlist 
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.user.id,
    })
    .populate({
      path: 'products',
      select: '-images'
    })
    .lean();

    if (!wishlist) {
      return res.json({ products: [] });
    }
    
    res.json(wishlist);
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

//  Merge guest wishlist into user wishlist 
exports.mergeWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; 

    if (!Array.isArray(items) || !items.length) {
      return res.json({ message: 'No items to merge', products: [] });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }
    const newProductIds = items
      .filter(item => item.productId)
      .map(item => item.productId)
      .filter(productId => 
        !wishlist.products.some(p => p.equals(productId))
      );

    if (newProductIds.length > 0) {
      wishlist.products.push(...newProductIds);
      await wishlist.save();
    }
    const populated = await wishlist.populate({
      path: 'products',
      select: '-images'
    });
    
    res.json(populated);
  } catch (err) {
    console.error('mergeWishlist error:', err);
    res.status(500).json({ error: 'Failed to merge wishlist' });
  }
};
