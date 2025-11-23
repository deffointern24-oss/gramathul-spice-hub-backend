const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  value: String
});

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String // e.g., "image/jpeg"
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String },
  stock: { type: Number, default: 0 },
  weight: Number,
  images: [imageSchema], // direct image storage in MongoDB
  isFeatured: { type: Boolean, default: false },
  variants: [variantSchema], // optional, for later use
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
