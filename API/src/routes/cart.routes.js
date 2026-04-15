const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart
router.get('/', cartController.getCart);

// POST /api/cart/add
router.post('/add', cartController.addToCart);

// PUT /api/cart/:itemId
router.put('/:itemId', cartController.updateQuantity);

// DELETE /api/cart/clear  (must be before /:itemId catch-all)
router.delete('/clear', cartController.clearCart);

// DELETE /api/cart  — body: { product_id }
router.delete('/', cartController.removeItem);

module.exports = router;
