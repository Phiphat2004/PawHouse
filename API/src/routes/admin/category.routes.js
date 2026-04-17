const express = require("express");
const { body, param, validationResult } = require("express-validator");
const adminCategoryController = require("../../controllers/Admin/category.controller");
const { protectRoute } = require("../../middlewares");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createCategoryValidation = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("slug").trim().notEmpty().withMessage("Category slug is required"),
];

const updateCategoryValidation = [
  param("id").isMongoId().withMessage("Invalid category ID"),
];

router.post(
  "/",
  ...protectRoute(["admin"]),
  createCategoryValidation,
  handleValidationErrors,
  adminCategoryController.create,
);
router.put(
  "/:id",
  ...protectRoute(["admin"]),
  updateCategoryValidation,
  handleValidationErrors,
  adminCategoryController.update,
);
router.delete(
  "/:id",
  ...protectRoute(["admin"]),
  [param("id").isMongoId().withMessage("Invalid category ID")],
  handleValidationErrors,
  adminCategoryController.delete,
);

module.exports = router;
