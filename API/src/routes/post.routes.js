const express = require('express');
const { body, param, validationResult } = require('express-validator');
const postController = require('../controllers/post.controller');
const { authenticate, optionalAuth, protectRoute } = require('../middlewares/auth.middleware');

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
const createPostValidation = [
  body('title').trim().notEmpty().withMessage('Tiêu đề là bắt buộc'),
  body('content').trim().notEmpty().withMessage('Nội dung là bắt buộc'),
  body('slug').optional().trim(),
  body('excerpt').optional().trim(),
  body('coverImageUrl').optional().isURL().withMessage('URL ảnh không hợp lệ'),
  body('status').optional().isIn(['draft', 'published', 'hidden']).withMessage('Trạng thái không hợp lệ'),
  body('tagIds').optional().isArray().withMessage('tagIds phải là mảng'),
  body('tagIds.*').optional().isMongoId().withMessage('Tag ID không hợp lệ'),
];

const updatePostValidation = [
  param('id').isMongoId().withMessage('Post ID không hợp lệ'),
  body('title').optional().trim().notEmpty().withMessage('Tiêu đề không được rỗng'),
  body('content').optional().trim().notEmpty().withMessage('Nội dung không được rỗng'),
  body('slug').optional().trim(),
  body('excerpt').optional().trim(),
  body('coverImageUrl').optional().isURL().withMessage('URL ảnh không hợp lệ'),
  body('status').optional().isIn(['draft', 'published', 'hidden']).withMessage('Trạng thái không hợp lệ'),
  body('tagIds').optional().isArray().withMessage('tagIds phải là mảng'),
  body('tagIds.*').optional().isMongoId().withMessage('Tag ID không hợp lệ'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Post ID không hợp lệ'),
];

// Public route: list published posts
router.get('/public', postController.getPublicPosts);

// Admin: get all posts
router.get('/', ...protectRoute(['admin']), postController.getAll);

// Only keep create post route for now. All other post routes are intentionally
// removed so this branch can be pushed incrementally. Frontend can still call
// create and will receive normal responses.
router.post(
  '/',
  authenticate,
  createPostValidation,
  handleValidationErrors,
  postController.create
);

// Public detail routes
router.get('/slug/:slug', optionalAuth, postController.getBySlug);

// Get by ID (public)
router.get('/:id', idValidation, handleValidationErrors, postController.getById);

module.exports = router;
