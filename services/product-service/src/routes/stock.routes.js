const express = require('express');
const stockController = require('../controllers/stock.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// Stock entries
router.post('/entry', stockController.createEntry);
router.get('/levels', stockController.getStockLevels);
router.get('/movements', stockController.getMovements);
router.delete('/movements/:id', stockController.deleteMovement);
router.get('/product/:productId', stockController.getProductStock);

// Warehouses
router.get('/warehouses', stockController.getWarehouses);
router.post('/warehouses', stockController.createWarehouse);
router.delete('/warehouses/:id', stockController.deleteWarehouse);

module.exports = router;
