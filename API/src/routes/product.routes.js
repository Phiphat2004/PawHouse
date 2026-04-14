const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protectRoute } = require('../middlewares');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('slug').trim().notEmpty().withMessage('Product slug is required'),
  body('categoryIds')
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  body('categoryIds.*').isMongoId().withMessage('Invalid category ID'),
];

const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
];

const getProductByIdValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
];

const searchProductsValidation = [
  query('q').trim().notEmpty().withMessage('Search query is required'),
];

// Routes

// GET /products/stats - Get product statistics (MUST be before /:id route)
router.get('/stats', productController.getStats);

// GET /products/slug/:slug - Get product by slug (MUST be before /:id route)
router.get('/slug/:slug', productController.getBySlug);

// GET /products/search - Search products
router.get(
  '/search',
  searchProductsValidation,
  handleValidationErrors,
  productController.search,
);

// GET /products - Get all products with pagination, search, and filtering
router.get('/', productController.getAll);

// GET /products/:id - Get product by ID
router.get(
  '/:id',
  getProductByIdValidation,
  handleValidationErrors,
  productController.getById,
);

// POST /products - Create a new product (Admin only)
router.post(
  '/',
  ...protectRoute(['admin']),
  upload.array('images', 5),
  createProductValidation,
  handleValidationErrors,
  productController.create,
);

// PUT /products/:id - Update product (Admin only)
router.put(
  '/:id',
  ...protectRoute(['admin']),
  upload.array('images', 5),
  updateProductValidation,
  handleValidationErrors,
  productController.update,
);

// DELETE /products/:id - Delete product (Admin only)
router.delete(
  '/:id',
  ...protectRoute(['admin']),
  productController.delete,
);

module.exports = router;
