const express = require("express");
const { body, param, validationResult } = require("express-validator");
const postController = require("../controllers/post.controller");
const {
  authenticate,
  optionalAuth,
  protectRoute,
} = require("../middlewares/auth.middleware");
const multer = require("multer");

// Use memory storage so we can upload buffer to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const createPostValidation = [
  body("title").trim().notEmpty().withMessage("Tiêu đề là bắt buộc"),
  body("content").trim().notEmpty().withMessage("Nội dung là bắt buộc"),
  body("slug").optional().trim(),
  body("excerpt").optional().trim(),
  body("coverImageUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("URL ảnh không hợp lệ"),
  body("status")
    .optional()
    .isIn(["draft", "published", "hidden"])
    .withMessage("Trạng thái không hợp lệ"),
  body("tagIds").optional().isArray().withMessage("tagIds phải là mảng"),
  body("tagIds.*").optional().isMongoId().withMessage("Tag ID không hợp lệ"),
];

const updatePostValidation = [
  param("id").isMongoId().withMessage("Post ID không hợp lệ"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được rỗng"),
  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nội dung không được rỗng"),
  body("slug").optional().trim(),
  body("excerpt").optional().trim(),
  body("coverImageUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("URL ảnh không hợp lệ"),
  body("status")
    .optional()
    .isIn(["draft", "published", "hidden"])
    .withMessage("Trạng thái không hợp lệ"),
  body("tagIds").optional().isArray().withMessage("tagIds phải là mảng"),
  body("tagIds.*").optional().isMongoId().withMessage("Tag ID không hợp lệ"),
];

const idValidation = [
  param("id").isMongoId().withMessage("Post ID không hợp lệ"),
];

// Public route: list published posts
// Search route: public search for published posts
router.get("/search", optionalAuth, postController.search);

router.get("/public", postController.getPublicPosts);

// Admin: get all posts
router.get("/", ...protectRoute(["admin", "staff"]), postController.getAll);

// Only keep create post route for now. All other post routes are intentionally
// removed so this branch can be pushed incrementally. Frontend can still call
// create and will receive normal responses.
router.post(
  "/",
  ...protectRoute(["admin", "staff"]),
  createPostValidation,
  handleValidationErrors,
  postController.create,
);

// Image upload endpoint used by Create Post page
router.post(
  "/upload",
  ...protectRoute(["admin", "staff"]),
  upload.single("file"),
  postController.uploadImage,
);

// Public detail routes
router.get("/slug/:slug", optionalAuth, postController.getBySlug);

// Authenticated user: get own posts
router.get(
  "/my-posts",
  ...protectRoute(["admin", "staff"]),
  postController.getMyPosts,
);

// Authenticated user update own post
router.put(
  "/my-posts/:id",
  ...protectRoute(["admin", "staff"]),
  updatePostValidation,
  handleValidationErrors,
  postController.updateMyPost,
);

// Authenticated user delete own post
router.delete(
  "/my-posts/:id",
  ...protectRoute(["admin", "staff"]),
  idValidation,
  handleValidationErrors,
  postController.deleteMyPost,
);

// Get by ID (public)
router.get(
  "/:id",
  idValidation,
  handleValidationErrors,
  postController.getById,
);

// Admin toggle status (admin only)
router.put(
  "/:id/toggle-status",
  ...protectRoute(["admin"]),
  idValidation,
  handleValidationErrors,
  postController.toggleStatus,
);

// Admin update post
router.put(
  "/:id",
  ...protectRoute(["admin", "staff"]),
  updatePostValidation,
  handleValidationErrors,
  postController.update,
);

// Admin delete post
router.delete(
  "/:id",
  ...protectRoute(["admin", "staff"]),
  idValidation,
  handleValidationErrors,
  postController.delete,
);

module.exports = router;
