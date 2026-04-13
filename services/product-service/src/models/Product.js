const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Tên sản phẩm không được để trống'], trim: true },
  slug: { type: String, required: [true, 'Slug không được để trống'], unique: true, lowercase: true, trim: true },
  description: { type: String },
  brand: { type: String, trim: true },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  images: [{
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 0 }
  }],
  price: { 
    type: Number, 
    required: [true, 'Giá sản phẩm không được để trống'], 
    min: [0, 'Giá sản phẩm không được âm'] 
  },
  compareAtPrice: { 
    type: Number, 
    min: [0, 'Giá so sánh không được âm'],
    validate: {
      validator: function(value) {
        return !value || value > this.price;
      },
      message: 'Giá so sánh phải lớn hơn giá bán'
    }
  },
  stock: { 
    type: Number, 
    required: [true, 'Số lượng tồn kho không được để trống'],
    default: 0, 
    min: [0, 'Số lượng tồn kho không được âm'] 
  },
  sku: { 
    type: String, 
    required: [true, 'Mã SKU không được để trống'], 
    unique: true, 
    uppercase: true, 
    trim: true 
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1, createdAt: -1 });
productSchema.index({ categoryIds: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
