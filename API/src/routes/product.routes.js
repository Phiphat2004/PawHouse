const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protectRoute } = require('../middlewares');
 
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/slug/:slug', productController.getBySlug);

// Admin routes
router.post('/', ...protectRoute(['admin']), productController.create);
router.put('/:id', ...protectRoute(['admin']), productController.update);

module.exports = router;
