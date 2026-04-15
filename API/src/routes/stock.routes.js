const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stock.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Toàn bộ stock routes yêu cầu authentication
router.use(authenticate);

// Stock entries & levels
router.post(
  "/entry",
  authorize(["admin", "staff"]),
  stockController.createEntry,
);
router.get("/levels", stockController.getStockLevels);
router.get("/movements", stockController.getMovements);
router.delete(
  "/movements/:id",
  authorize(["admin", "staff"]),
  stockController.deleteMovement,
);
router.get("/product/:productId", stockController.getProductStock);

// Warehouses
router.get("/warehouses", stockController.getWarehouses);
router.post(
  "/warehouses",
  authorize(["admin", "staff"]),
  stockController.createWarehouse,
);
router.delete(
  "/warehouses/:id",
  authorize(["admin", "staff"]),
  stockController.deleteWarehouse,
);

module.exports = router;
