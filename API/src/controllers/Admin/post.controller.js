const { Post } = require("../../models");
const postService = require("../../services/admin/post.service");
const cloudinary = require("cloudinary").v2;
const config = require("../../config");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

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
    const { page = 1, limit = 20, search, status, authorId, tagId } = req.query;

    const query = {};
    if (search) query.$text = { $search: search };
    if (status) query.status = status;
    if (authorId) query.authorId = authorId;
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
    const { title, slug, excerpt, content, coverImageUrl, status, tagIds } =
      req.body;

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

    const postData = {
      title,
      slug: finalSlug,
      excerpt,
      content,
      coverImageUrl,
      status: status === "published" ? "published" : "draft",
      authorId: req.user.userId || req.user._id,
      tagIds: tagIds || [],
    };
    if (postData.status === "published") {
      postData.publishedAt = new Date();
    }

    const post = await Post.create(postData);
    const populatedPost = await Post.findById(post._id)
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImageUrl, status, tagIds } =
      req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
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
    if (status !== undefined) {
      post.status = status;
      if (status === "published" && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");

    res.json({ post: updatedPost });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

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
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
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
  toggleStatus,
  delete: deletePost,
};
