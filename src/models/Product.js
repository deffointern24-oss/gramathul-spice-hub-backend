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
  originalPrice: Number, // NEW
  category: { type: String },
  stock: { type: Number, default: 0 },
  weight: String, // Allow weights like '250g'
  images: [imageSchema], // direct image storage in MongoDB
  isFeatured: { type: Boolean, default: false },
  isOrganic: { type: Boolean, default: false }, // NEW
  origin: String, // NEW
  rating: { type: Number, default: 0 }, // NEW
  reviews: { type: Number, default: 0 }, // NEW, number of reviews
  benefits: [String], // NEW, array of strings
  uses: [String],     // NEW, array of strings
  variants: [variantSchema], // optional
  inStock: { type: Boolean, default: true }, // NEW
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
