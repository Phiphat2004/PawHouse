const express = require('express');
const { body, param, validationResult } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { protectRoute } = require('../middlewares');

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
const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('slug').trim().notEmpty().withMessage('Category slug is required'),
  body('parentId').optional().isMongoId().withMessage('Invalid parent category ID'),
];

// Routes

// GET /categories - Get all categories
router.get('/', categoryController.getAll);

// GET /categories/:id - Get category by ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid category ID')],
  handleValidationErrors,
  categoryController.getById,
);

// GET /categories/:id - Get category by ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid category ID')],
  handleValidationErrors,
  categoryController.getById,
);

// POST /categories - Create a new category (Admin only)
router.post(
  '/',
  ...protectRoute(['admin']),
  createCategoryValidation,
  handleValidationErrors,
  categoryController.create,
);

// PUT /categories/:id - Update category (Admin only)
router.put(
  '/:id',
  ...protectRoute(['admin']),
  [
    param('id').isMongoId().withMessage('Invalid category ID'),
    body('parentId').optional().isMongoId().withMessage('Invalid parent category ID'),
  ],
  handleValidationErrors,
  categoryController.update,
);

// DELETE /categories/:id - Delete category (Admin only)
router.delete(
  '/:id',
  ...protectRoute(['admin']),
  [param('id').isMongoId().withMessage('Invalid category ID')],
  handleValidationErrors,
  categoryController.delete,
);

module.exports = router;
