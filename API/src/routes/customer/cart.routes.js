const express = require("express");
const customerCartController = require("../../controllers/customer/cart.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", customerCartController.getCart);
router.post("/add", customerCartController.addToCart);
router.put("/:itemId", customerCartController.updateQuantity);
router.delete("/clear", customerCartController.clearCart);
router.delete("/", customerCartController.removeItem);

module.exports = router;
