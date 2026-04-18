const express = require("express");
const adminStockController = require("../../controllers/Admin/stock.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["admin"]));

router.post("/entry", adminStockController.createEntry);
router.get("/levels", adminStockController.getStockLevels);
router.get("/movements", adminStockController.getMovements);
router.delete("/movements/:id", adminStockController.deleteMovement);
router.get("/product/:productId", adminStockController.getProductStock);
router.get(
  "/product-details/:productId",
  adminStockController.getProductDetailsForAdmin,
);
router.get("/warehouses", adminStockController.getWarehouses);
router.post("/warehouses", adminStockController.createWarehouse);
router.delete("/warehouses/:id", adminStockController.deleteWarehouse);

module.exports = router;
