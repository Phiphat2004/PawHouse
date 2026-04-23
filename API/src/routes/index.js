const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const customerPostRoutes = require("./customer/post.routes");
const staffPostRoutes = require("./staff/post.routes");
const adminPostRoutes = require("./admin/post.routes");
const customerCategoryRoutes = require("./customer/category.routes");
const adminCategoryRoutes = require("./admin/category.routes");
const customerProductRoutes = require("./customer/product.routes");
const adminProductRoutes = require("./admin/product.routes");
const adminAccountManagementRoutes = require("./admin/accountManagement.routes");
const customerCartRoutes = require("./customer/cart.routes");
const customerOrderRoutes = require("./customer/order.routes");
const staffOrderRoutes = require("./staff/order.routes");
const customerCareAppointmentRoutes = require("./customer/careAppointment.routes");
const staffCareAppointmentRoutes = require("./staff/careAppointment.routes");
const adminCareAppointmentRoutes = require("./admin/careAppointment.routes");
const staffStockRoutes = require("./staff/stock.routes");
const adminStockRoutes = require("./admin/stock.routes");

// Auth
router.use("/auth", authRoutes);

// Users (self-management: DELETE /users/me, etc.)
router.use("/users", authRoutes);

// Posts
router.use("/posts", customerPostRoutes);
router.use("/posts", staffPostRoutes);
router.use("/posts", adminPostRoutes);

// Category
router.use("/categories", customerCategoryRoutes);
router.use("/categories", adminCategoryRoutes);

// Admin account management
router.use("/admin/account-management", adminAccountManagementRoutes);

// Product
router.use("/products", customerProductRoutes);
router.use("/products", adminProductRoutes);

// Stock (warehouses, entries, levels, movements)
router.use("/stock", staffStockRoutes);
router.use("/stock", adminStockRoutes);

// Cart
router.use("/cart", customerCartRoutes);

// Orders
router.use("/orders", customerOrderRoutes);
router.use("/orders", staffOrderRoutes);

// Care appointments
router.use("/care-appointments", customerCareAppointmentRoutes);
router.use("/care-appointments", staffCareAppointmentRoutes);
router.use("/care-appointments", adminCareAppointmentRoutes);

module.exports = router;
