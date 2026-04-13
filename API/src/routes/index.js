const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');

// Auth
router.use('/auth', authRoutes);

// Category
router.use('/categories', categoryRoutes);

module.exports = router;
