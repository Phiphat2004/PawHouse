const mongoose = require('mongoose');

const DEFAULT_WAREHOUSE_ID = '000000000000000000000001';

const stockLevelSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: () => new mongoose.Types.ObjectId(DEFAULT_WAREHOUSE_ID)
  },
  warehouse: {
    name: {
      type: String,
      default: 'Kho Cần Thơ',
      trim: true
    },
    code: {
      type: String,
      default: 'WH001',
      trim: true
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    }
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
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  if (!this.warehouseId) {
    this.warehouseId = new mongoose.Types.ObjectId(DEFAULT_WAREHOUSE_ID);
  }
  if (!this.warehouse || !this.warehouse.name) {
    this.warehouse = {
      name: 'Kho Cần Thơ',
      code: 'WH001',
      address: {
        street: '', city: '', state: '', zipCode: '', country: ''
      },
      isActive: true
    };
  }
  next();
});

module.exports = mongoose.model('StockLevel', stockLevelSchema);
