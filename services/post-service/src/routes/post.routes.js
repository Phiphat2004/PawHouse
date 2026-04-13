const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const postController = require('../controllers/post.controller');
const { protectRoute, authenticate, optionalAuth } = require('../middlewares');

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
  body('tagIds.*').optional().isMongoId().withMessage('Tag ID không hợp lệ')
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
  body('tagIds.*').optional().isMongoId().withMessage('Tag ID không hợp lệ')
];

const getPostByIdValidation = [
  param('id').isMongoId().withMessage('Post ID không hợp lệ')
];

const deletePostValidation = [
  param('id').isMongoId().withMessage('Post ID không hợp lệ')
];

// Routes

// GET /posts/stats - Get post statistics (admin only)
router.get('/stats', ...protectRoute(['admin']), postController.getStats);

// GET /posts/public - Get published posts (public)
router.get('/public', postController.getPublicPosts);

// GET /posts/slug/:slug - Get post by slug (public with optional auth)
router.get('/slug/:slug', optionalAuth, postController.getBySlug);

// GET /posts/my-posts - Get current user's posts
router.get('/my-posts', authenticate, postController.getMyPosts);

// PUT /posts/my-posts/:id - Update user's own post
router.put(
  '/my-posts/:id',
  authenticate,
  updatePostValidation,
  handleValidationErrors,
  postController.updateMyPost
);

// DELETE /posts/my-posts/:id - Delete user's own post
router.delete(
  '/my-posts/:id',
  authenticate,
  deletePostValidation,
  handleValidationErrors,
  postController.deleteMyPost
);

// GET /posts - Get all posts (admin only)
router.get('/', ...protectRoute(['admin']), postController.getAll);

// POST /posts - Create post (authenticated users)
router.post(
  '/',
  authenticate,
  createPostValidation,
  handleValidationErrors,
  postController.create
);

// GET /posts/:id - Get post by ID
router.get(
  '/:id',
  getPostByIdValidation,
  handleValidationErrors,
  postController.getById
);

// PUT /posts/:id - Update post (admin only)
router.put(
  '/:id',
  ...protectRoute(['admin']),
  updatePostValidation,
  handleValidationErrors,
  postController.update
);

// PUT /posts/:id/toggle-status - Toggle post status (admin only)
router.put(
  '/:id/toggle-status',
  ...protectRoute(['admin']),
  getPostByIdValidation,
  handleValidationErrors,
  postController.toggleStatus
);

// DELETE /posts/:id - Delete post (admin only)
router.delete(
  '/:id',
  ...protectRoute(['admin']),
  deletePostValidation,
  handleValidationErrors,
  postController.delete
);

module.exports = router;
