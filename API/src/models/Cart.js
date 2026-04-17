const mongoose = require("mongoose");

const cartEmbeddedItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartEmbeddedItemSchema],
    original_price: {
      type: Number,
      default: 0,
    },
    total_price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

module.exports = mongoose.model("Cart", cartSchema);
