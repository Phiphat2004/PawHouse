const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Admin routes (defined before /:id to avoid being swallowed by the param route)
router.get('/dashboard-stats', authenticate, authorize(['admin', 'staff']), orderController.getDashboardStats);
router.get('/', authenticate, authorize(['admin', 'staff']), orderController.getAllOrders);
router.get('/search', authenticate, authorize(['admin', 'staff']), orderController.searchOrders);
router.patch('/admin/:id/status', authenticate, authorize(['admin', 'staff']), orderController.updateOrderStatus);

// Customer routes
router.post('/', authenticate, orderController.createOrder);         // POST /api/orders
router.post('/create', authenticate, orderController.createOrder);   // POST /api/orders/create (frontend alias)
router.get('/my', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/cancel', authenticate, orderController.cancelOrder);
router.patch('/:id/status', authenticate, authorize(['admin', 'staff']), orderController.updateOrderStatus);

module.exports = router;
