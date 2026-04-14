const { Post } = require('../models');
const postService = require('../services/post.service');

// Keep only the create handler for now. Other handlers removed intentionally
// so frontend can be deployed incrementally. If you want to re-enable any
// endpoint later, we can restore the corresponding handler.

const postController = {
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
};

module.exports = postController;
