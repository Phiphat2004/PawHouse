const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

const postRoutes = require("./post.routes");

const categoryRoutes = require("./category.routes");
const accountManagementRoutes = require("./accountManagement.routes");

// Auth
router.use("/auth", authRoutes);

// Posts
router.use("/posts", postRoutes);
// Category
router.use("/categories", categoryRoutes);

// Admin account management
router.use("/admin/account-management", accountManagementRoutes);

module.exports = router;
