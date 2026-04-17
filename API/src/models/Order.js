const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Backward compatibility for existing unique index orderNumber_1 in MongoDB
    orderNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    orderCode: { type: String, required: true, unique: true, uppercase: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packing",
        "shipping",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    addressSnapshot: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      ward: { type: String, default: "" },
      addressLine: { type: String, required: true },
    },

    shippingFee: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    note: { type: String },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre("validate", function syncOrderNumber(next) {
  if (this.orderCode && !this.orderNumber) {
    this.orderNumber = this.orderCode;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
