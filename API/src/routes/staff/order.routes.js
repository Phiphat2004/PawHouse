const express = require("express");
const staffOrderController = require("../../controllers/staff/order.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["admin", "staff"]));

router.get("/", staffOrderController.searchOrders);
router.get("/dashboard-stats", staffOrderController.getDashboardStats);
router.get("/:id", staffOrderController.getOrderById);
router.patch("/:id/status", staffOrderController.updateOrderStatus);

module.exports = router;
