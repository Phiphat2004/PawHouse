const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');

// Auth
router.use('/auth', authRoutes);

// Category
router.use('/categories', categoryRoutes);

// Product
router.use('/products', productRoutes);

module.exports = router;
