const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(authenticate);

/**
 * Create a new order
 * POST /orders
 */
router.post("/", orderController.createOrder);

/**
 * Search orders with filters
 * GET /orders
 * Query params: status, page, limit, search
 */
router.get("/", orderController.searchOrders);

/**
 * Dashboard stats
 * GET /orders/dashboard-stats
 */
router.get(
  "/dashboard-stats",
  authorize(["admin", "staff"]),
  orderController.getDashboardStats,
);

/**
 * Get order details
 * GET /orders/:id
 */
router.get("/:id", orderController.getOrderById);

/**
 * Cancel order
 * DELETE /orders/:id
 * Body: { reason? }
 */
router.delete("/:id", orderController.cancelOrder);

/**
 * Update order status (admin only)
 * PATCH /orders/:id/status
 * Body: { status, note? }
 */
router.patch(
  "/:id/status",
  authorize(["admin", "staff"]),
  orderController.updateOrderStatus,
);

module.exports = router;
