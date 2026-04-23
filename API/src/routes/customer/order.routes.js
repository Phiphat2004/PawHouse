const express = require("express");
const customerOrderController = require("../../controllers/customer/order.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Let privileged roles be handled by staff/admin order routers mounted after this router.
router.use((req, res, next) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const role = req.user?.role;
  if (roles.includes("admin") || roles.includes("staff")) {
    return next("router");
  }
  if (role === "admin" || role === "staff") {
    return next("router");
  }
  next();
});

router.post("/buy-now", customerOrderController.createBuyNowOrder);
router.post("/", customerOrderController.createOrder);
router.get("/", customerOrderController.searchOrders);
router.get("/:id", customerOrderController.getOrderById);
router.delete("/:id", customerOrderController.cancelOrder);

module.exports = router;
