const express = require("express");
const adminOrderController = require("../../controllers/Admin/order.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["admin"]));

router.get("/", adminOrderController.searchOrders);
router.get("/dashboard-stats", adminOrderController.getDashboardStats);
router.get("/:id", adminOrderController.getOrderById);
router.patch("/:id/status", adminOrderController.updateOrderStatus);

module.exports = router;
