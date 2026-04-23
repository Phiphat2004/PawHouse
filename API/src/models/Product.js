const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String },
    brand: { type: String, trim: true },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    images: [
      {
        url: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price cannot be negative"],
      validate: {
        validator: function (value) {
          return !value || value > this.price;
        },
        message: "Compare-at price must be greater than sale price",
      },
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1, createdAt: -1 });
productSchema.index({ categoryIds: 1 });
productSchema.index({ name: "text", description: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);
