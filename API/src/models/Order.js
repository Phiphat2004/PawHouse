const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  variationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariation', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String },
  productName: { type: String, required: true },
  variationName: { type: String },
  image: { type: String },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true, min: 0 }
});

const statusHistorySchema = new mongoose.Schema({
  from: { type: String },
  to: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderCode: { type: String, required: true, unique: true, uppercase: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packing', 'shipping', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },

  addressSnapshot: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    ward: { type: String, default: '' },
    addressLine: { type: String, required: true }
  },

  deliveryZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone' },
  shippingFee: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },

  note: { type: String },

  items: [orderItemSchema],
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
