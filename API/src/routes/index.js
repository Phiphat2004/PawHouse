const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');

// Auth
router.use('/auth', authRoutes);

// Posts
router.use('/posts', postRoutes);

module.exports = router;
