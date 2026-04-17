const { Post } = require("../../models");
const postService = require("../../services/customer/post.service");

const getPublicPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, tagId } = req.query;
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
};

const search = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20, tagId } = req.query;
    const result = await postService.searchPosts({
      q,
      page,
      limit,
      tagId,
      status: "published",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    const requesterId = req.user?.userId || req.user?._id;
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const isAdmin = userRoles.includes("admin");
    const isOwner =
      requesterId && post.authorId?._id?.toString() === requesterId.toString();

    if (post.status !== "published" && !isAdmin && !isOwner) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    post.viewCount = (post.viewCount || 0) + 1;
    await post.save();
    res.json({ post });
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate("authorId", "email profile")
      .populate("tagIds", "name slug");
    if (!post) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    const requesterId = req.user?.userId || req.user?._id;
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const isAdmin = userRoles.includes("admin");
    const isOwner =
      requesterId && post.authorId?._id?.toString() === requesterId.toString();

    if (post.status !== "published" && !isAdmin && !isOwner) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    post.viewCount = (post.viewCount || 0) + 1;
    await post.save();
    res.json({ post });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPosts,
  search,
  getById,
  getBySlug,
};
