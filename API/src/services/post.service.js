const { Post } = require('../models');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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
  return Post.find({ status: 'published', publishedAt: { $gte: oneWeekAgo } })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate('authorId', 'email profile')
    .populate('tagIds', 'name slug');
}

async function getRelatedPosts(postId, tagIds, limit = 5) {
  if (!tagIds || tagIds.length === 0) return [];
  return Post.find({ _id: { $ne: postId }, status: 'published', tagIds: { $in: tagIds } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('authorId', 'email profile')
    .populate('tagIds', 'name slug');
}

module.exports = { slugify, generateUniqueSlug, getTrendingPosts, getRelatedPosts };
