const express = require("express");
const { param, validationResult } = require("express-validator");
const customerPostController = require("../../controllers/customer/post.controller");
const { optionalAuth } = require("../../middlewares/auth.middleware");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const idValidation = [
  param("id").isMongoId().withMessage("Post ID không hợp lệ"),
];

router.get("/search", optionalAuth, customerPostController.search);
router.get("/public", customerPostController.getPublicPosts);
router.get("/slug/:slug", optionalAuth, customerPostController.getBySlug);
router.get(
  "/:id",
  idValidation,
  handleValidationErrors,
  customerPostController.getById,
);

module.exports = router;
