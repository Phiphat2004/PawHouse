const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
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
  type: {
    type: String,
    // RESERVE   : giữ hàng khi tạo đơn (pending)
    // RELEASE   : trả hàng khi huỷ đơn
    // FULFILL   : trừ hẳn khi đơn hoàn thành
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'RESERVE', 'RELEASE', 'FULFILL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  referenceType: {
    type: String,
    enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'ORDER', 'OTHER']
  },
  referenceId: {
    type: String  // orderId hoặc orderCode
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Index để truy vấn nhanh
stockMovementSchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
