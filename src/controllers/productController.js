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
    let updates = {...req.body};
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }
    if (updates.variants) updates.variants = safeJSONparse(updates.variants);
    if (updates.benefits) updates.benefits = safeJSONparse(updates.benefits);
    if (updates.uses) updates.uses = safeJSONparse(updates.uses);

    // Fix types for numerical and boolean fields
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
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
};

// VIEW products (filter/sort/search)
exports.listProducts = async (req, res) => {
  const { category, search, isFeatured } = req.query;
  let filter = {};
  if (category) filter.category = category;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (search) filter.name = { $regex: search, $options: 'i' };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
};

// VIEW single product
exports.productDetails = async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
};

// SERVE image (from DB)
exports.serveProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const img = product.images[req.params.imgIndex];
    if (!img) return res.status(404).end();
    res.set('Content-Type', img.contentType);
    res.send(img.data);
  } catch (err) {
    res.status(500).end();
  }
};
