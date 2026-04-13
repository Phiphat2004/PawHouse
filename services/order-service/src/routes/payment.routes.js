const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.post('/cash', authenticate, paymentController.createCashPayment);

// Admin xác nhận đã thu tiền COD
router.patch('/order/:orderId/mark-paid', authenticate, authorize(['admin', 'staff']), paymentController.markAsPaid);

// Lấy payment theo orderId
router.get('/order/:orderId', authenticate, paymentController.getPaymentByOrder);

router.get('/:id', authenticate, paymentController.getPaymentById);

module.exports = router;
