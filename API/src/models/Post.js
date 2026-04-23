const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "published", "hidden"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Statistics
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ title: "text", excerpt: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);
