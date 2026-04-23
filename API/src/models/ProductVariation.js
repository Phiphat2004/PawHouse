const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, trim: true },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productVariationSchema.index({ productId: 1, isActive: 1 });
productVariationSchema.index({ product_id: 1, status: 1, isDeleted: 1 });

module.exports = mongoose.model('ProductVariation', productVariationSchema);
