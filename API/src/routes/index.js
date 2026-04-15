const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const postRoutes = require("./post.routes");
const categoryRoutes = require("./category.routes");
const productRoutes = require("./product.routes");
const accountManagementRoutes = require("./accountManagement.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./order.routes");
const stockRoutes = require("./stock.routes");

// Auth
router.use("/auth", authRoutes);

// Posts
router.use("/posts", postRoutes);

// Category
router.use("/categories", categoryRoutes);

// Admin account management
router.use("/admin/account-management", accountManagementRoutes);

// Product
router.use("/products", productRoutes);

// Stock (warehouses, entries, levels, movements)
router.use("/stock", stockRoutes);

// Cart
router.use("/cart", cartRoutes);

// Orders
router.use("/orders", orderRoutes);

// Orders
router.use('/orders', orderRoutes);

module.exports = router;
