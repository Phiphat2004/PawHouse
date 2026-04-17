const express = require("express");
const { body, param, validationResult } = require("express-validator");
const adminProductController = require("../../controllers/Admin/product.controller");
const { protectRoute } = require("../../middlewares");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createProductValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("slug").trim().notEmpty().withMessage("Product slug is required"),
  body("categoryIds")
    .isArray({ min: 1 })
    .withMessage("At least one category is required"),
  body("categoryIds.*").isMongoId().withMessage("Invalid category ID"),
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];

router.get("/stats", adminProductController.getStats);
router.post(
  "/",
  ...protectRoute(["admin"]),
  upload.array("images", 5),
  createProductValidation,
  handleValidationErrors,
  adminProductController.create,
);
router.put(
  "/:id",
  ...protectRoute(["admin"]),
  upload.array("images", 5),
  updateProductValidation,
  handleValidationErrors,
  adminProductController.update,
);
router.delete(
  "/:id",
  ...protectRoute(["admin"]),
  adminProductController.delete,
);

module.exports = router;
