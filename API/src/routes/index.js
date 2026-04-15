const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const accountManagementRoutes = require("./accountManagement.routes");
const cartRoutes = require("./cart.routes");

// Auth
router.use("/auth", authRoutes);

// Posts
router.use("/posts", postRoutes);

// Category
router.use("/categories", categoryRoutes);

// Admin account management
router.use("/admin/account-management", accountManagementRoutes);

// Product
router.use('/products', productRoutes);

// Cart
router.use('/cart', cartRoutes);

module.exports = router;

