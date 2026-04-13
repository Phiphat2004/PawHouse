const paymentService = require('../services/payment.service');
const Payment = require('../models/Payment');

exports.createCashPayment = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing orderId or amount' });
    }
    const payment = await paymentService.createCashPayment(orderId, amount);
    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// Admin xác nhận đã thu tiền COD
exports.markAsPaid = async (req, res, next) => {
  try {
    const payment = await paymentService.markAsPaid(req.params.orderId);
    return res.json({ success: true, message: 'Thanh toán đã được xác nhận', data: payment });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};
