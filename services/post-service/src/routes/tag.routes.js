const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const tagController = require('../controllers/tag.controller');
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
const createTagValidation = [
  body('name').trim().notEmpty().withMessage('Tên tag là bắt buộc'),
  body('slug').optional().trim(),
  body('description').optional().trim()
];

const updateTagValidation = [
  param('id').isMongoId().withMessage('Tag ID không hợp lệ'),
  body('name').optional().trim().notEmpty().withMessage('Tên tag không được rỗng'),
  body('slug').optional().trim(),
  body('description').optional().trim()
];

const getTagByIdValidation = [
  param('id').isMongoId().withMessage('Tag ID không hợp lệ')
];

const deleteTagValidation = [
  param('id').isMongoId().withMessage('Tag ID không hợp lệ')
];

// Routes

// GET /tags/slug/:slug - Get tag by slug (public)
router.get('/slug/:slug', tagController.getBySlug);

// GET /tags - Get all tags (public)
router.get('/', tagController.getAll);

// GET /tags/:id - Get tag by ID (public)
router.get(
  '/:id',
  getTagByIdValidation,
  handleValidationErrors,
  tagController.getById
);

// GET /tags/:id/posts - Get posts by tag (public)
router.get(
  '/:id/posts',
  getTagByIdValidation,
  handleValidationErrors,
  tagController.getPostsByTag
);

// POST /tags - Create tag (admin only)
router.post(
  '/',
  ...protectRoute(['admin']),
  createTagValidation,
  handleValidationErrors,
  tagController.create
);

// PUT /tags/:id - Update tag (admin only)
router.put(
  '/:id',
  ...protectRoute(['admin']),
  updateTagValidation,
  handleValidationErrors,
  tagController.update
);

// DELETE /tags/:id - Delete tag (admin only)
router.delete(
  '/:id',
  ...protectRoute(['admin']),
  deleteTagValidation,
  handleValidationErrors,
  tagController.delete
);

module.exports = router;
