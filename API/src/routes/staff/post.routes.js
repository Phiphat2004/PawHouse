const express = require("express");
const { body, param, validationResult } = require("express-validator");
const staffPostController = require("../../controllers/staff/post.controller");
const { protectRoute } = require("../../middlewares/auth.middleware");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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

router.use(...protectRoute(["staff", "admin"]));

router.get("/", staffPostController.getAll);
router.post(
  "/",
  createPostValidation,
  handleValidationErrors,
  staffPostController.create,
);
router.post("/upload", upload.single("file"), staffPostController.uploadImage);
router.get("/my-posts", staffPostController.getMyPosts);
router.put(
  "/my-posts/:id",
  updatePostValidation,
  handleValidationErrors,
  staffPostController.updateMyPost,
);
router.delete(
  "/my-posts/:id",
  idValidation,
  handleValidationErrors,
  staffPostController.deleteMyPost,
);
router.put(
  "/:id",
  updatePostValidation,
  handleValidationErrors,
  staffPostController.update,
);
router.delete(
  "/:id",
  idValidation,
  handleValidationErrors,
  staffPostController.delete,
);

module.exports = router;
