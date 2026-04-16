const { Post, User } = require("../models");
const postService = require("../services/post.service");
const emailService = require("../services/email.service");
const cloudinary = require("cloudinary").v2;
const config = require("../config");

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

async function notifyAdminsPendingApproval({
  post,
  actor,
  action = "Tạo mới",
}) {
  try {
    const admins = await User.find({
      roles: "admin",
      status: "active",
      is_banned: { $ne: true },
      is_deleted: { $ne: true },
    }).select("email profile.fullName");

    if (!admins.length) return;

    const actorName = actor?.profile?.fullName || actor?.email || "Nhân viên";

    await Promise.allSettled(
      admins
        .filter((admin) => admin.email)
        .map((admin) =>
          emailService.sendPostPendingApprovalEmail({
            toEmail: admin.email,
            adminName: admin?.profile?.fullName || "Admin",
            authorName: actorName,
            postTitle: post.title,
            postSlug: post.slug,
            action,
          }),
        ),
    );
  } catch (err) {
    console.error("Error notifying admins for pending post:", err.message);
  }
}

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
      // If a non-empty search string is provided, delegate to searchPosts to
      // use the robust search fallback (regex) implemented in service.
      if (search && String(search).trim()) {
        const result = await postService.searchPosts({
          q: search,
          page,
          limit,
          tagId,
          status: "published",
        });
        return res.json(result);
      }

      const query = { status: "published" };
      if (tagId) query.tagIds = tagId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate("authorId", "email profile")
          .populate("tagIds", "name slug")
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query),
      ]);

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload image (authenticated users)
   * POST /api/posts/upload
   * multipart/form-data, field name: file
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file || !req.file.buffer)
        return res.status(400).json({ error: "No file uploaded" });

      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "pawhouse/posts" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          stream.end(buffer);
        });

      const result = await streamUpload(req.file.buffer);
      return res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search posts (public)
   * GET /api/posts/search?q=...&page=1&limit=20
   */
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 20, tagId } = req.query;
      const status = "published";
      const result = await postService.searchPosts({
        q,
        page,
        limit,
        tagId,
        status,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

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
        tagId,
      } = req.query;
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isStaff = userRoles.includes("staff");
      const query = {};
      if (search) query.$text = { $search: search };
      if (status) query.status = status;

      if (isStaff && !isAdmin) {
        query.authorId = req.user._id;
      } else if (authorId) {
        query.authorId = authorId;
      }

      if (tagId) query.tagIds = tagId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate("authorId", "email profile")
          .populate("tagIds", "name slug")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query),
      ]);

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },
  /**
   * Create post (authenticated users)
   * POST /api/posts
   */
  async create(req, res, next) {
    try {
      const { title, slug, excerpt, content, coverImageUrl, status, tagIds } =
        req.body;
      if (!title || !content)
        return res
          .status(400)
          .json({ error: "Tiêu đề và nội dung là bắt buộc" });
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isStaff = userRoles.includes("staff");

      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = await postService.generateUniqueSlug(title);
      } else {
        const existingPost = await Post.findOne({ slug: finalSlug });
        if (existingPost)
          return res.status(400).json({ error: "Slug đã tồn tại" });
      }

      const postData = {
        title,
        slug: finalSlug,
        excerpt,
        content,
        coverImageUrl,
        status: isAdmin && status === "published" ? "published" : "draft",
        authorId: req.user.userId || req.user._id,
        tagIds: tagIds || [],
      };
      if (postData.status === "published") postData.publishedAt = new Date();

      const post = await Post.create(postData);
      const populatedPost = await Post.findById(post._id)
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");

      if (isStaff && !isAdmin) {
        await notifyAdminsPendingApproval({
          post: populatedPost,
          actor: req.user,
          action: "Tạo mới",
        });
      }

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
      const { title, slug, excerpt, content, coverImageUrl, status, tagIds } =
        req.body;
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isStaff = userRoles.includes("staff");
      const requesterId = req.user.userId || req.user._id;
      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      if (
        isStaff &&
        !isAdmin &&
        post.authorId.toString() !== requesterId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình" });
      }

      if (slug && slug !== post.slug) {
        const existingPost = await Post.findOne({ slug });
        if (existingPost)
          return res.status(400).json({ error: "Slug đã tồn tại" });
      }

      if (title !== undefined) post.title = title;
      if (slug !== undefined) post.slug = slug;
      if (excerpt !== undefined) post.excerpt = excerpt;
      if (content !== undefined) post.content = content;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (tagIds !== undefined) post.tagIds = tagIds;
      if (isStaff && !isAdmin) {
        post.status = "draft";
        post.publishedAt = null;
      } else if (status !== undefined) {
        post.status = status;
        if (status === "published" && !post.publishedAt)
          post.publishedAt = new Date();
      }

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");

      if (isStaff && !isAdmin) {
        await notifyAdminsPendingApproval({
          post: updatedPost,
          actor: req.user,
          action: "Cập nhật",
        });
      }

      res.json({ post: updatedPost });
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
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Chỉ admin mới có quyền duyệt/xuất bản bài viết" });
      }

      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      // Toggle between 'published' and 'draft'
      if (post.status === "published") {
        post.status = "draft";
      } else {
        post.status = "published";
        if (!post.publishedAt) post.publishedAt = new Date();
      }

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");
      res.json({ post: updatedPost });
    } catch (error) {
      next(error);
    }
  },
  /**
   * Update own post (user)
   * PUT /api/posts/my-posts/:id
   */
  async updateMyPost(req, res, next) {
    try {
      const { title, excerpt, content, coverImageUrl, tagIds } = req.body;
      const userId = req.user.userId || req.user._id;
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isStaff = userRoles.includes("staff");
      const isAdmin = userRoles.includes("admin");
      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      if (post.authorId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền chỉnh sửa bài viết này" });
      }

      if (title !== undefined) {
        post.title = title;
        post.slug = await postService.generateUniqueSlug(title, post._id);
      }
      if (excerpt !== undefined) post.excerpt = excerpt;
      if (content !== undefined) post.content = content;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (tagIds !== undefined) post.tagIds = tagIds;
      post.status = "draft"; // Reset to draft for admin review

      await post.save();
      const updatedPost = await Post.findById(post._id)
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");

      if (isStaff && !isAdmin) {
        await notifyAdminsPendingApproval({
          post: updatedPost,
          actor: req.user,
          action: "Cập nhật",
        });
      }

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
      const userId = req.user.userId || req.user._id;
      const query = { authorId: userId };
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate("authorId", "email profile")
          .populate("tagIds", "name slug")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Post.countDocuments(query),
      ]);

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get post by ID
   * GET /api/posts/:id
   */
  async getById(req, res, next) {
    try {
      const post = await Post.findById(req.params.id)
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      const requesterId = req.user?.userId || req.user?._id;
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isOwner =
        requesterId &&
        post.authorId?._id?.toString() === requesterId.toString();
      if (post.status !== "published" && !isAdmin && !isOwner) {
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      }

      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();
      res.json({ post });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get post by slug (public with optional auth)
   * GET /api/posts/slug/:slug
   */
  async getBySlug(req, res, next) {
    try {
      const post = await Post.findOne({ slug: req.params.slug })
        .populate("authorId", "email profile")
        .populate("tagIds", "name slug");
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      const requesterId = req.user?.userId || req.user?._id;
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isOwner =
        requesterId &&
        post.authorId?._id?.toString() === requesterId.toString();

      if (post.status !== "published" && !isAdmin && !isOwner) {
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      }
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();
      res.json({ post });
    } catch (error) {
      next(error);
    }
  },
  /**
   * Delete own post (user)
   * DELETE /api/posts/my-posts/:id
   */
  async deleteMyPost(req, res, next) {
    try {
      const userId = req.user.userId || req.user._id;
      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      if (post.authorId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền xóa bài viết này" });
      }
      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: "Xóa bài viết thành công" });
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
      const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdmin = userRoles.includes("admin");
      const isStaff = userRoles.includes("staff");
      const requesterId = req.user.userId || req.user._id;

      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).json({ error: "Không tìm thấy bài viết" });

      if (
        isStaff &&
        !isAdmin &&
        post.authorId.toString() !== requesterId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Bạn chỉ có thể xóa bài viết của chính mình" });
      }

      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: "Xóa bài viết thành công" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = postController;
