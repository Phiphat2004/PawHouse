const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Cart routes - Allow customer, admin, staff
router.post('/add', authenticate, cartController.addToCart);
router.get('/', authenticate, cartController.getCartsByUser);
router.put('/:itemId', authenticate, cartController.editCartItemQuantity);
router.delete('/', authenticate, cartController.removeItem);
router.delete('/clear', authenticate, cartController.clearAllCart);

module.exports = router;
