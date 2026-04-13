const Payment = require('../models/Payment');

/**
 * Create (or return existing) a cash/COD payment record for an order.
 */
exports.createCashPayment = async (orderId, amount) => {
  const existing = await Payment.findOne({ orderId, method: 'cash' });
  if (existing) return existing;
  return Payment.create({ orderId, method: 'cash', status: 'pending', amount });
};

/**
 * Get payment info by orderId.
 */
exports.getPaymentByOrderId = async (orderId) => {
  return Payment.findOne({ orderId });
};

/**
 * Mark COD payment as paid (admin xác nhận đã thu tiền khi giao hàng).
 */
exports.markAsPaid = async (orderId) => {
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: { $in: ['pending', 'failed'] } },
    { status: 'paid', paidAt: new Date() },
    { new: true }
  );
  if (!payment) throw Object.assign(new Error('Không tìm thấy payment hoặc đã thanh toán'), { status: 404 });
  return payment;
};

/**
 * Update a payment record's status.
 */
exports.updatePaymentStatus = async (paymentId, status) => {
  return Payment.findByIdAndUpdate(
    paymentId,
    { status, ...(status === 'paid' ? { paidAt: new Date() } : {}) },
    { new: true }
  );
};
