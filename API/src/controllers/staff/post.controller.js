const { Post, User } = require("../../models");
const postService = require("../../services/staff/post.service");
const emailService = require("../../services/email.service");
const cloudinary = require("cloudinary").v2;
const config = require("../../config");

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

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "pawhouse/posts" },
        (error, data) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
      stream.end(req.file.buffer);
    });

    return res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, tagId } = req.query;
    const query = { authorId: req.user._id };
    if (search) query.$text = { $search: search };
    if (status) query.status = status;
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
};

const create = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImageUrl, tagIds } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Tiêu đề và nội dung là bắt buộc" });
    }

    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await postService.generateUniqueSlug(title);
    } else {
      const existingPost = await Post.findOne({ slug: finalSlug });
      if (existingPost) {
        return res.status(400).json({ error: "Slug đã tồn tại" });
      }
    }

    const post = await Post.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      coverImageUrl,
      status: "draft",
      authorId: req.user.userId || req.user._id,
      tagIds: tagIds || [],
    });

    const populatedPost = await Post.findById(post._id)
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");

    await notifyAdminsPendingApproval({
      post: populatedPost,
      actor: req.user,
      action: "Tạo mới",
    });

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImageUrl, tagIds } = req.body;
    const requesterId = req.user.userId || req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    if (post.authorId.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình" });
    }

    if (slug && slug !== post.slug) {
      const existingPost = await Post.findOne({ slug });
      if (existingPost) {
        return res.status(400).json({ error: "Slug đã tồn tại" });
      }
    }

    if (title !== undefined) post.title = title;
    if (slug !== undefined) post.slug = slug;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content !== undefined) post.content = content;
    if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
    if (tagIds !== undefined) post.tagIds = tagIds;

    post.status = "draft";
    post.publishedAt = null;

    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");

    await notifyAdminsPendingApproval({
      post: updatedPost,
      actor: req.user,
      action: "Cập nhật",
    });

    res.json({ post: updatedPost });
  } catch (error) {
    next(error);
  }
};

const getMyPosts = async (req, res, next) => {
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
};

const updateMyPost = update;

const deleteMyPost = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }
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
};

const deletePost = async (req, res, next) => {
  try {
    const requesterId = req.user.userId || req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    if (post.authorId.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn chỉ có thể xóa bài viết của chính mình" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  getAll,
  create,
  update,
  getMyPosts,
  updateMyPost,
  deleteMyPost,
  delete: deletePost,
};
