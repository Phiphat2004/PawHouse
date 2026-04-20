const express = require("express");
const { body, param, validationResult } = require("express-validator");
const staffPostController = require("../../controllers/staff/post.controller");
const { authenticate, protectRoute } = require("../../middlewares/auth.middleware");
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

function allowStaffOrPassAdmin(req, res, next) {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  if (roles.includes("admin")) {
    return next("route");
  }
  if (roles.includes("staff")) {
    return next();
  }
  return res.status(403).json({ error: "Không có quyền thực hiện" });
}

router.get("/", authenticate, allowStaffOrPassAdmin, staffPostController.getAll);
router.post(
  "/",
  authenticate,
  allowStaffOrPassAdmin,
  createPostValidation,
  handleValidationErrors,
  staffPostController.create,
);
router.post(
  "/upload",
  authenticate,
  allowStaffOrPassAdmin,
  upload.single("file"),
  staffPostController.uploadImage,
);
router.get("/my-posts", ...protectRoute(["staff"]), staffPostController.getMyPosts);
router.put(
  "/my-posts/:id",
  ...protectRoute(["staff"]),
  updatePostValidation,
  handleValidationErrors,
  staffPostController.updateMyPost,
);
router.delete(
  "/my-posts/:id",
  ...protectRoute(["staff"]),
  idValidation,
  handleValidationErrors,
  staffPostController.deleteMyPost,
);
router.put(
  "/:id",
  authenticate,
  allowStaffOrPassAdmin,
  updatePostValidation,
  handleValidationErrors,
  staffPostController.update,
);
router.delete(
  "/:id",
  authenticate,
  allowStaffOrPassAdmin,
  idValidation,
  handleValidationErrors,
  staffPostController.delete,
);

module.exports = router;
