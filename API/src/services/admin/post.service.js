const { Post } = require("../../models");

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(title, excludeId = null) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existingPost = await Post.findOne(query);
    if (!existingPost) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function getTrendingPosts(limit = 10) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return Post.find({ status: "published", publishedAt: { $gte: oneWeekAgo } })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate("authorId", "email profile");
}

async function getRelatedPosts(postId, limit = 5) {
  return Post.find({ _id: { $ne: postId }, status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("authorId", "email profile");
}

async function searchPosts({ q, page = 1, limit = 20, authorId, status } = {}) {
  const query = {};
  if (status) query.status = status;
  if (authorId) query.authorId = authorId;

  if (q) {
    // Use text search when available, otherwise fallback to case-insensitive regex across common fields
    // Prefer $text if MongoDB text index exists; include regex fallback to be robust.
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { excerpt: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate("authorId", "email profile")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Post.countDocuments(query),
  ]);

  return {
    posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

module.exports = {
  slugify,
  generateUniqueSlug,
  getTrendingPosts,
  getRelatedPosts,
  searchPosts,
};
