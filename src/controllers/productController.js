const Product = require('../models/Product');

// CREATE product with images
exports.createProduct = async (req, res) => {
  try {
    let images = [];
    if (req.files) {
      images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }
    const { name, description, price, category, stock, weight, isFeatured, variants } = req.body;
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      weight,
      isFeatured: isFeatured === 'true',
      variants: variants ? JSON.parse(variants) : [],
      images,
      createdBy: req.user.id
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// EDIT product
exports.editProduct = async (req, res) => {
  try {
    const updates = {...req.body};
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }
    if (updates.variants) updates.variants = JSON.parse(updates.variants);
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

// VIEW products (with filtering/sorting/search)
exports.listProducts = async (req, res) => {
  const { category, search, isFeatured } = req.query;
  let filter = {};
  if (category) filter.category = category;
  if (isFeatured) filter.isFeatured = isFeatured === 'true';
  if (search) filter.name = { $regex: search, $options: 'i' };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
};

// VIEW single product
exports.productDetails = async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
};

// SERVE an image
exports.serveProductImage = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const img = product.images[req.params.imgIndex];
  if (!img) return res.status(404).end();
  res.set('Content-Type', img.contentType);
  res.send(img.data);
};
