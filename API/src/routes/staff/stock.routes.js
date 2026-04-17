const express = require("express");
const staffStockController = require("../../controllers/staff/stock.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["admin", "staff"]));

router.post("/entry", staffStockController.createEntry);
router.get("/levels", staffStockController.getStockLevels);
router.get("/movements", staffStockController.getMovements);
router.delete("/movements/:id", staffStockController.deleteMovement);
router.get("/product/:productId", staffStockController.getProductStock);
router.get("/warehouses", staffStockController.getWarehouses);
router.post("/warehouses", staffStockController.createWarehouse);
router.delete("/warehouses/:id", staffStockController.deleteWarehouse);

module.exports = router;
