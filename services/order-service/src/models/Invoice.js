const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  invoiceNo: { type: String, required: true, unique: true },
  issuedAt: { type: Date, default: Date.now },
  pdfUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
