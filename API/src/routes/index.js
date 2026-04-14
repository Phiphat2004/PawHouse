const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

const postRoutes = require('./post.routes');

const categoryRoutes = require('./category.routes');


// Auth
router.use('/auth', authRoutes);

// Posts
router.use('/posts', postRoutes);
// Category
router.use('/categories', categoryRoutes);

module.exports = router;
