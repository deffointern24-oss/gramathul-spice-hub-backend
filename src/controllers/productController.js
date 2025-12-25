const Product = require('../models/Product');

// Helper to safely parse JSON arrays
function safeJSONparse(val, fallback = []) {
  try {
    if (Array.isArray(val)) return val;
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// CREATE product with all fields
exports.createProduct = async (req, res) => {
  try {
    let images = [];
    if (req.files) {
      images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }

    const {
      name, description, price, originalPrice, category, stock, weight, isFeatured,
      variants, rating, reviews, isOrganic, inStock, origin, benefits, uses
    } = req.body;

    const product = new Product({
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      originalPrice: originalPrice !== undefined ? Number(originalPrice) : undefined,
      category,
      stock: stock !== undefined ? Number(stock) : 0,
      weight: weight || "",
      isFeatured: isFeatured === 'true' || isFeatured === true,
      variants: safeJSONparse(variants),
      images,
      rating: rating !== undefined ? Number(rating) : 0,
      reviews: reviews !== undefined ? Number(reviews) : 0,
      isOrganic: isOrganic === 'true' || isOrganic === true,
      inStock: inStock === 'true' || inStock === true,
      origin: origin || "",
      benefits: safeJSONparse(benefits),
      uses: safeJSONparse(uses),
      createdBy: req.user?.id || req.user?._id
    });

    await product.save();
    res.status(201).json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// EDIT product with all fields
exports.editProduct = async (req, res) => {
  try {
    let updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }
    if (updates.variants) updates.variants = safeJSONparse(updates.variants);
    if (updates.benefits) updates.benefits = safeJSONparse(updates.benefits);
    if (updates.uses) updates.uses = safeJSONparse(updates.uses);
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.rating !== undefined) updates.rating = Number(updates.rating);
    if (updates.reviews !== undefined) updates.reviews = Number(updates.reviews);
    if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === 'true' || updates.isFeatured === true;
    if (updates.isOrganic !== undefined) updates.isOrganic = updates.isOrganic === 'true' || updates.isOrganic === true;
    if (updates.inStock !== undefined) updates.inStock = updates.inStock === 'true' || updates.inStock === true;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  VIEW products 
exports.listProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      isFeatured,
      page = 1,
      limit = 5
    } = req.query;
    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .select('-images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(), 
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasMore: pageNum < totalPages,
        limit: limitNum,
        showing: products.length
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// VIEW single product 
exports.productDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('-images')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.serveProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('images');

    if (!product || !product.images || !product.images[req.params.imgIndex]) {
      return res.status(404).send('Image not found');
    }

    const img = product.images[req.params.imgIndex];
    let imageBuffer;
    if (Buffer.isBuffer(img.data)) {
      imageBuffer = img.data;
    } else if (img.data && img.data.data && Array.isArray(img.data.data)) {
      imageBuffer = Buffer.from(img.data.data);
    } else {
      console.error('Invalid image data format:', typeof img.data);
      return res.status(500).send('Invalid image format');
    }

    res.set({
      'Content-Type': img.contentType || 'image/jpeg',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=31536000',
    });

    res.send(imageBuffer);
  } catch (err) {
    console.error('Error serving image:', err);
    res.status(500).send('Error loading image');
  }
};
