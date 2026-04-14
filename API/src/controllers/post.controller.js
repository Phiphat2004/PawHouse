const { Post } = require('../models');
const postService = require('../services/post.service');

// Keep only the create handler for now. Other handlers removed intentionally
// so frontend can be deployed incrementally. If you want to re-enable any
// endpoint later, we can restore the corresponding handler.

const postController = {
  /**
   * Get published posts (public)
   * GET /api/posts/public
   */
  async getPublicPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, search, tagId } = req.query;
      const query = { status: 'published' };
      if (search) query.$text = { $search: search };
      if (tagId) query.tagIds = tagId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate('authorId', 'email profile')
          .populate('tagIds', 'name slug')
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query)
      ]);

      res.json({ posts, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) { next(error); }
  },

  /**
   * Get all posts (admin only)
   * GET /api/posts
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status, authorId, tagId } = req.query;
      const query = {};
      if (search) query.$text = { $search: search };
      if (status) query.status = status;
      if (authorId) query.authorId = authorId;
      if (tagId) query.tagIds = tagId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate('authorId', 'email profile')
          .populate('tagIds', 'name slug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query)
      ]);

      res.json({ posts, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) { next(error); }
  },
  /**
   * Create post (authenticated users)
   * POST /api/posts
   */
  async create(req, res, next) {
    try {
      const { title, slug, excerpt, content, coverImageUrl, status, tagIds } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });

      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = await postService.generateUniqueSlug(title);
      } else {
        const existingPost = await Post.findOne({ slug: finalSlug });
        if (existingPost) return res.status(400).json({ error: 'Slug đã tồn tại' });
      }

      const postData = {
        title,
        slug: finalSlug,
        excerpt,
        content,
        coverImageUrl,
        status: req.user.roles?.includes('admin') && status === 'published' ? 'published' : 'draft',
        authorId: req.user.userId || req.user._id,
        tagIds: tagIds || []
      };
      if (postData.status === 'published') postData.publishedAt = new Date();

      const post = await Post.create(postData);
      const populatedPost = await Post.findById(post._id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');
      res.status(201).json({ post: populatedPost });
    } catch (error) { next(error); }
  }
  ,

  /**
   * Get post by ID
   * GET /api/posts/:id
   */
  async getById(req, res, next) {
    try {
      const post = await Post.findById(req.params.id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');
      if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();
      res.json({ post });
    } catch (error) { next(error); }
  },

  /**
   * Get post by slug (public with optional auth)
   * GET /api/posts/slug/:slug
   */
  async getBySlug(req, res, next) {
    try {
      const post = await Post.findOne({ slug: req.params.slug })
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');
      if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      if (post.status !== 'published' && (!req.user || !req.user.roles?.includes('admin'))) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();
      res.json({ post });
    } catch (error) { next(error); }
  }
};

module.exports = postController;
