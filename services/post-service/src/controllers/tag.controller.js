const { Tag, Post } = require('../models');
const postService = require('../services/post.service');

const tagController = {
  /**
   * Get all tags
   * GET /api/tags
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 50, search } = req.query;

      const query = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tags, total] = await Promise.all([
        Tag.find(query)
          .sort({ postCount: -1, name: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Tag.countDocuments(query)
      ]);

      res.json({
        tags,
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
   * Get tag by ID
   * GET /api/tags/:id
   */
  async getById(req, res, next) {
    try {
      const tag = await Tag.findById(req.params.id);

      if (!tag) {
        return res.status(404).json({ error: 'Không tìm thấy tag' });
      }

      res.json({ tag });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get tag by slug
   * GET /api/tags/slug/:slug
   */
  async getBySlug(req, res, next) {
    try {
      const tag = await Tag.findOne({ slug: req.params.slug });

      if (!tag) {
        return res.status(404).json({ error: 'Không tìm thấy tag' });
      }

      res.json({ tag });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create tag (admin only)
   * POST /api/tags
   */
  async create(req, res, next) {
    try {
      const { name, slug, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Tên tag là bắt buộc' });
      }

      // Generate slug if not provided
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = postService.slugify(name);
      }

      // Check if slug already exists
      const existingTag = await Tag.findOne({ slug: finalSlug });
      if (existingTag) {
        return res.status(400).json({ error: 'Slug đã tồn tại' });
      }

      const tag = await Tag.create({
        name,
        slug: finalSlug,
        description
      });

      res.status(201).json({ tag });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update tag (admin only)
   * PUT /api/tags/:id
   */
  async update(req, res, next) {
    try {
      const { name, slug, description } = req.body;

      const tag = await Tag.findById(req.params.id);
      if (!tag) {
        return res.status(404).json({ error: 'Không tìm thấy tag' });
      }

      // Check if slug is being changed and if it already exists
      if (slug && slug !== tag.slug) {
        const existingTag = await Tag.findOne({ slug });
        if (existingTag) {
          return res.status(400).json({ error: 'Slug đã tồn tại' });
        }
      }

      if (name !== undefined) tag.name = name;
      if (slug !== undefined) tag.slug = slug;
      if (description !== undefined) tag.description = description;

      await tag.save();
      res.json({ tag });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete tag (admin only)
   * DELETE /api/tags/:id
   */
  async delete(req, res, next) {
    try {
      const tag = await Tag.findByIdAndDelete(req.params.id);

      if (!tag) {
        return res.status(404).json({ error: 'Không tìm thấy tag' });
      }

      // Remove tag from all posts
      await Post.updateMany(
        { tagIds: tag._id },
        { $pull: { tagIds: tag._id } }
      );

      res.json({ message: 'Xóa tag thành công' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get posts by tag
   * GET /api/tags/:id/posts
   */
  async getPostsByTag(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const tagId = req.params.id;

      // Check if tag exists
      const tag = await Tag.findById(tagId);
      if (!tag) {
        return res.status(404).json({ error: 'Không tìm thấy tag' });
      }

      const query = {
        tagIds: tagId,
        status: 'published'
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate('authorId', 'email profile')
          .populate('tagIds', 'name slug')
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query)
      ]);

      res.json({
        tag,
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
  }
};

module.exports = tagController;
