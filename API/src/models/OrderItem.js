const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    variationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariation",
      required: false,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sku: { type: String },
    productName: { type: String, required: true },
    variationName: { type: String },
    image: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

orderItemSchema.index({ orderId: 1, productId: 1 });

module.exports = mongoose.model("OrderItem", orderItemSchema);
