const express = require("express");
const { body, param, validationResult } = require("express-validator");
const adminPostController = require("../../controllers/Admin/post.controller");
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
];

const idValidation = [
  param("id").isMongoId().withMessage("Post ID không hợp lệ"),
];

router.use(...protectRoute(["admin"]));

router.get("/", adminPostController.getAll);
router.post(
  "/",
  createPostValidation,
  handleValidationErrors,
  adminPostController.create,
);
router.post("/upload", upload.single("file"), adminPostController.uploadImage);
router.put(
  "/:id/toggle-status",
  idValidation,
  handleValidationErrors,
  adminPostController.toggleStatus,
);
router.put(
  "/:id",
  updatePostValidation,
  handleValidationErrors,
  adminPostController.update,
);
router.delete(
  "/:id",
  idValidation,
  handleValidationErrors,
  adminPostController.delete,
);

module.exports = router;
