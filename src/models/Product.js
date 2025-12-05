const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  value: String
});

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String 
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  originalPrice: Number, // NEW
  category: { type: String },
  stock: { type: Number, default: 0 },
  weight: String, 
  images: [imageSchema], 
  isFeatured: { type: Boolean, default: false },
  isOrganic: { type: Boolean, default: false }, 
  origin: String, 
  rating: { type: Number, default: 0 }, 
  reviews: { type: Number, default: 0 },
  benefits: [String], 
  uses: [String],     
  variants: [variantSchema], 
  inStock: { type: Boolean, default: true }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
