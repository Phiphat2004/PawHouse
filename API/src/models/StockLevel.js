const mongoose = require('mongoose');

const stockLevelSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  lastRestockedAt: Date
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
stockLevelSchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// Tính available quantity trước khi save
stockLevelSchema.pre('save', function(next) {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  next();
});

module.exports = mongoose.model('StockLevel', stockLevelSchema);
