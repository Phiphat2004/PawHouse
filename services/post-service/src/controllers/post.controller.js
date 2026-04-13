const { Post, Tag } = require('../models');
const postService = require('../services/post.service');

const postController = {
  /**
   * Get all posts (admin only)
   * GET /api/posts
   */
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        authorId,
        tagId
      } = req.query;

      const query = {};

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by author
      if (authorId) {
        query.authorId = authorId;
      }

      // Filter by tag
      if (tagId) {
        query.tagIds = tagId;
      }

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

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get published posts (public)
   * GET /api/posts/public
   */
  async getPublicPosts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        tagId
      } = req.query;

      const query = { status: 'published' };

      if (search) {
        query.$text = { $search: search };
      }

      if (tagId) {
        query.tagIds = tagId;
      }

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

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single post by ID
   * GET /api/posts/:id
   */
  async getById(req, res, next) {
    try {
      const post = await Post.findById(req.params.id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Increment view count
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();

      res.json({ post });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get post by slug (public)
   * GET /api/posts/slug/:slug
   */
  async getBySlug(req, res, next) {
    try {
      const post = await Post.findOne({ slug: req.params.slug })
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Only show published posts to public
      if (post.status !== 'published' && (!req.user || !req.user.roles.includes('admin'))) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Increment view count
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();

      res.json({ post });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create post
   * POST /api/posts
   */
  async create(req, res, next) {
    try {
      const { title, slug, excerpt, content, coverImageUrl, status, tagIds } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });
      }

      // Generate slug if not provided
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = await postService.generateUniqueSlug(title);
      } else {
        // Check if slug already exists
        const existingPost = await Post.findOne({ slug: finalSlug });
        if (existingPost) {
          return res.status(400).json({ error: 'Slug đã tồn tại' });
        }
      }

      const postData = {
        title,
        slug: finalSlug,
        excerpt,
        content,
        coverImageUrl,
        // Only admin can publish directly, users create drafts
        status: req.user.roles?.includes('admin') && status === 'published' ? 'published' : 'draft',
        authorId: req.user.userId,
        tagIds: tagIds || []
      };

      // Set publishedAt if status is published
      if (postData.status === 'published') {
        postData.publishedAt = new Date();
      }

      // Create post
      const post = await Post.create(postData);
      const populatedPost = await Post.findById(post._id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      res.status(201).json({ post: populatedPost });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update post (admin only)
   * PUT /api/posts/:id
   */
  async update(req, res, next) {
    try {
      const { title, slug, excerpt, content, coverImageUrl, status, tagIds } = req.body;

      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Check if slug is being changed and if it already exists
      if (slug && slug !== post.slug) {
        const existingPost = await Post.findOne({ slug });
        if (existingPost) {
          return res.status(400).json({ error: 'Slug đã tồn tại' });
        }
      }

      // Update fields
      if (title !== undefined) post.title = title;
      if (slug !== undefined) post.slug = slug;
      if (excerpt !== undefined) post.excerpt = excerpt;
      if (content !== undefined) post.content = content;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (tagIds !== undefined) post.tagIds = tagIds;

      if (status !== undefined) {
        post.status = status;
        if (status === 'published' && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      res.json({ post: updatedPost });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete post (admin only)
   * DELETE /api/posts/:id
   */
  async delete(req, res, next) {
    try {
      const post = await Post.findByIdAndDelete(req.params.id);

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      res.json({ message: 'Xóa bài viết thành công' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle post status (admin only)
   * PUT /api/posts/:id/toggle-status
   */
  async toggleStatus(req, res, next) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Toggle between published and draft
      if (post.status === 'published') {
        post.status = 'draft';
      } else {
        post.status = 'published';
        if (!post.publishedAt) {
          post.publishedAt = new Date();
        }
      }

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      res.json({ post: updatedPost });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user's posts
   * GET /api/posts/my-posts
   */
  async getMyPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = { authorId: req.user.userId };

      if (status) {
        query.status = status;
      }

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

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user's own post
   * PUT /api/posts/my-posts/:id
   */
  async updateMyPost(req, res, next) {
    try {
      const { title, excerpt, content, coverImageUrl, tagIds } = req.body;

      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Check if user owns this post
      if (post.authorId.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bài viết này' });
      }

      // Update fields
      if (title !== undefined) {
        post.title = title;
        // Auto-generate slug from title if title changed
        post.slug = await postService.generateUniqueSlug(title, post._id);
      }
      if (excerpt !== undefined) post.excerpt = excerpt;
      if (content !== undefined) post.content = content;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (tagIds !== undefined) post.tagIds = tagIds;

      // When user updates, set back to draft for re-approval
      post.status = 'draft';

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate('authorId', 'email profile')
        .populate('tagIds', 'name slug');

      res.json({ post: updatedPost });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete user's own post
   * DELETE /api/posts/my-posts/:id
   */
  async deleteMyPost(req, res, next) {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }

      // Check if user owns this post
      if (post.authorId.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này' });
      }

      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: 'Xóa bài viết thành công' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get post statistics
   * GET /api/posts/stats
   */
  async getStats(req, res, next) {
    try {
      const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
        Post.countDocuments(),
        Post.countDocuments({ status: 'published' }),
        Post.countDocuments({ status: 'draft' })
      ]);

      res.json({
        stats: {
          total: totalPosts,
          published: publishedPosts,
          draft: draftPosts,
          hidden: totalPosts - publishedPosts - draftPosts
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = postController;
