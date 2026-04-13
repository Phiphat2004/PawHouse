const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  city: { type: String, required: true, trim: true },
  district: { type: String, trim: true },
  fee: { type: Number, default: 0, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  etaMinutes: { type: Number, default: 120 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

deliveryZoneSchema.index({ city: 1, district: 1 });
deliveryZoneSchema.index({ isActive: 1 });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
