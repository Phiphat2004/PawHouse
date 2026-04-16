const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {

    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);


categorySchema.index({ isActive: 1 });

module.exports = mongoose.model("Category", categorySchema);
