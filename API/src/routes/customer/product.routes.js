const express = require("express");
const { param, query, validationResult } = require("express-validator");
const customerProductController = require("../../controllers/customer/product.controller");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const getProductByIdValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];

const searchProductsValidation = [
  query("q").trim().notEmpty().withMessage("Search query is required"),
];

router.get("/slug/:slug", customerProductController.getBySlug);
router.get(
  "/search",
  searchProductsValidation,
  handleValidationErrors,
  customerProductController.search,
);
router.get("/", customerProductController.getAll);
router.get(
  "/:id",
  getProductByIdValidation,
  handleValidationErrors,
  customerProductController.getById,
);

module.exports = router;
