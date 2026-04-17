const express = require("express");
const { param, query, validationResult } = require("express-validator");
const customerCategoryController = require("../../controllers/customer/category.controller");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const getCategoryByIdValidation = [
  param("id").isMongoId().withMessage("Invalid category ID"),
];

const searchCategoriesValidation = [
  query("search").trim().notEmpty().withMessage("Search query is required"),
];

router.get("/", customerCategoryController.getAll);
router.get(
  "/search",
  searchCategoriesValidation,
  handleValidationErrors,
  customerCategoryController.getAll,
);
router.get(
  "/:id",
  getCategoryByIdValidation,
  handleValidationErrors,
  customerCategoryController.getById,
);

module.exports = router;
