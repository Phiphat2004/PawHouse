const Order = require('../models/Order');
const Payment = require('../models/Payment');
const axios = require('axios');
const emailService = require('./email.service');
const mongoose = require('mongoose');

/**
 * Look up a user's email from the shared DB by userId.
 * Used as fallback when addressSnapshot.email is not stored (legacy orders).
 */
async function getUserEmail(userId) {
  try {
    const user = await mongoose.connection.db
      .collection('users')
      .findOne(
        { _id: new mongoose.Types.ObjectId(userId.toString()) },
        { projection: { email: 1 } }
      );
    return user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Generate a unique order code: ORD + base36 timestamp + 4 random chars
 */
exports.generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${timestamp}${random}`;
};

/**
 * Create a new order from checkout data.
 * @param {string} userId
 * @param {{ items, addressInfo, paymentMethod, note, shippingFee }} orderData
 */
exports.createOrder = async (userId, { items, addressInfo, paymentMethod, note, shippingFee }) => {
  // Map incoming items into orderItem schema format
  const orderItems = items.map(item => {
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const quantity = Number(item.quantity) || 1;
    return {
      variationId: item.variationId || item.variation_id || item.product_id,
      productId: item.productId || null,
      sku: item.sku || '',
      productName: item.productName || item.name || 'Sản phẩm',
      variationName: item.variationName || item.name || '',
      image: item.image || '',
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity
    };
  });

  // Financial calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const finalShippingFee = shippingFee != null ? Number(shippingFee) : 30000;
  const total = subtotal + finalShippingFee;

  // Build address snapshot
  const addressSnapshot = {
    fullName: addressInfo.fullName || addressInfo.name || '',
    phone: addressInfo.phone || '',
    email: addressInfo.email || '',
    city: addressInfo.city || addressInfo.province || '',
    district: addressInfo.district || '',
    ward: addressInfo.ward || '',
    addressLine: addressInfo.addressLine || addressInfo.address || ''
  };

  const orderCode = exports.generateOrderCode();

  // Persist the order
  const order = new Order({
    userId,
    orderCode,
    status: 'pending',
    addressSnapshot,
    shippingFee: finalShippingFee,
    subtotal,
    total,
    note: note || '',
    items: orderItems,
    statusHistory: [{ from: null, to: 'pending', changedBy: userId, note: 'Đơn hàng được tạo' }]
  });

  await order.save();

  // Phase 2: Reserve stock — FATAL: nếu không đủ hàng thì xóa đơn và báo lỗi ngay cho khách
  const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
  const stockItems = orderItems
    .filter(item => item.productId)
    .map(item => ({ productId: item.productId.toString(), quantity: item.quantity }));

  if (stockItems.length > 0) {
    try {
      await axios.post(`${productServiceUrl}/api/internal/reserve-stock`, {
        items: stockItems,
        orderId: order._id.toString(),
        orderCode: order.orderCode
      });
    } catch (reserveErr) {
      // Rollback: xóa đơn hàng vừa tạo để không có đơn rác trong DB
      await Order.deleteOne({ _id: order._id }).catch(() => {});
      const errData = reserveErr.response?.data;
      const errorMsg = errData?.error || 'Sản phẩm không đủ hàng trong kho, vui lòng thử lại';
      throw Object.assign(new Error(errorMsg), { status: reserveErr.response?.status || 400 });
    }
  }

  // Always create a COD payment record
  const payment = new Payment({
    orderId: order._id,
    method: 'cash',
    status: 'pending',
    amount: total
  });

  await payment.save();

  // Send confirmation email (non-blocking)
  const toEmail = addressSnapshot.email || await getUserEmail(userId).catch(() => null);
  if (toEmail) {
    emailService.sendOrderConfirmation(order.toObject(), toEmail).catch(err =>
      console.warn('[Order] Email confirmation failed (non-fatal):', err.message)
    );
  }

  return { order, payment };
};

/**
 * Get orders for a specific user with optional filters (includes payment info).
 * @param {string} userId
 * @param {{ status?, page?, limit? }} filters
 */
exports.getMyOrders = async (userId, filters = {}) => {
  const { status, page = 1, limit = 10, search } = filters;
  const query = { userId };
  if (status && status !== 'all') query.status = status;
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { orderCode: regex },
      { 'addressSnapshot.fullName': regex },
      { 'items.productName': regex }
    ];
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(query)
  ]);

  // Attach payment info to each order
  const payments = await Payment.find({ orderId: { $in: orders.map(o => o._id) } });
  const paymentMap = {};
  payments.forEach(p => { paymentMap[p.orderId.toString()] = p; });
  const ordersWithPayment = orders.map(o => ({
    ...o.toObject(),
    payment: paymentMap[o._id.toString()] || null
  }));

  const totalPages = Math.ceil(total / Number(limit));
  return { orders: ordersWithPayment, total, page: Number(page), limit: Number(limit), totalPages };
};

/**
 * Get all orders (admin) with optional filters and pagination (includes payment info).
 */
exports.getAllOrders = async (filters = {}, pagination = {}) => {
  const { status, userId, search } = filters;
  const { page = 1, limit = 20 } = pagination;
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (userId) query.userId = userId;
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { orderCode: regex },
      { 'addressSnapshot.fullName': regex },
      { 'addressSnapshot.phone': regex }
    ];
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(query)
  ]);

  // Attach payment info to each order
  const payments = await Payment.find({ orderId: { $in: orders.map(o => o._id) } });
  const paymentMap = {};
  payments.forEach(p => { paymentMap[p.orderId.toString()] = p; });
  const ordersWithPayment = orders.map(o => ({
    ...o.toObject(),
    payment: paymentMap[o._id.toString()] || null
  }));

  const totalPages = Math.ceil(total / Number(limit));
  return { orders: ordersWithPayment, total, page: Number(page), limit: Number(limit), totalPages };
};

/**
 * Get a single order by ID (includes payment info, no cross-service populate).
 */
exports.getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const payment = await Payment.findOne({ orderId: order._id });
  return { ...order.toObject(), payment: payment || null };
};

/**
 * Luồng chuyển trạng thái hợp lệ.
 */
const VALID_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing:   ['shipping', 'cancelled'],
  shipping:  ['completed'],
  completed: ['refunded'],
  cancelled: [],
  refunded:  []
};

/**
 * Update the status of an order (admin/staff).
 * Tự động mark payment = paid khi đơn hoàn thành.
 */
exports.updateOrderStatus = async (orderId, status, updatedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw Object.assign(
      new Error(`Không thể chuyển từ "${order.status}" sang "${status}"`),
      { status: 400 }
    );
  }

  order.statusHistory.push({ from: order.status, to: status, changedBy: updatedBy });
  order.status = status;
  await order.save();

  // Phase 2: Fulfill stock khi đơn hoàn thành — trừ hẳn quantity khỏi kho
  if (status === 'completed') {
    await Payment.updateMany(
      { orderId: order._id, status: 'pending' },
      { status: 'paid', paidAt: new Date() }
    );

    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
      const stockItems = order.items
        .filter(item => item.productId)
        .map(item => ({ productId: item.productId.toString(), quantity: item.quantity }));
      if (stockItems.length > 0) {
        await axios.post(`${productServiceUrl}/api/internal/fulfill-stock`, {
          items: stockItems,
          orderId: order._id.toString(),
          orderCode: order.orderCode
        });
      }
    } catch (stockErr) {
      console.warn('[Order] Could not fulfill stock (non-fatal):', stockErr.message);
    }
  }

  // Phase 2: Release stock khi admin/staff huỷ đơn — trả hàng reserved về available
  if (status === 'cancelled') {
    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
      const stockItems = order.items
        .filter(item => item.productId)
        .map(item => ({ productId: item.productId.toString(), quantity: item.quantity }));
      if (stockItems.length > 0) {
        await axios.post(`${productServiceUrl}/api/internal/release-stock`, {
          items: stockItems,
          orderId: order._id.toString(),
          orderCode: order.orderCode
        });
      }
    } catch (stockErr) {
      console.warn('[Order] Could not release stock on cancel (non-fatal):', stockErr.message);
    }
  }

  // Phase 2: Return stock khi đơn bị refund — hàng vật lý trả về kho
  if (status === 'refunded') {
    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
      const stockItems = order.items
        .filter(item => item.productId)
        .map(item => ({ productId: item.productId.toString(), quantity: item.quantity }));
      if (stockItems.length > 0) {
        await axios.post(`${productServiceUrl}/api/internal/return-stock`, {
          items: stockItems,
          orderId: order._id.toString(),
          orderCode: order.orderCode
        });
      }
    } catch (stockErr) {
      console.warn('[Order] Could not return stock on refund (non-fatal):', stockErr.message);
    }
  }

  const payment = await Payment.findOne({ orderId: order._id });

  // Send status update email (non-blocking)
  // Use addressSnapshot.email first; fall back to user account email for legacy orders
  const toEmail = order.addressSnapshot?.email || await getUserEmail(order.userId).catch(() => null);
  if (toEmail) {
    emailService.sendOrderStatusUpdate(order.toObject(), toEmail).catch(err =>
      console.warn('[Order] Email status update failed (non-fatal):', err.message)
    );
  }

  return { ...order.toObject(), payment: payment || null };
};

/**
 * Dashboard statistics (admin).
 * Returns: order counts by status, revenue this/last month, recent orders.
 */
exports.getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Aggregate counts by status
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const byStatus = {};
  let totalOrders = 0;
  statusCounts.forEach(s => { byStatus[s._id] = s.count; totalOrders += s.count; });

  // Revenue from completed orders
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
  ]);
  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  // Revenue this month (completed orders)
  const monthRevenueAgg = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, revenue: { $sum: '$total' } } }
  ]);
  const monthRevenue = monthRevenueAgg[0]?.revenue || 0;

  // Revenue last month
  const lastMonthRevenueAgg = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
    { $group: { _id: null, revenue: { $sum: '$total' } } }
  ]);
  const lastMonthRevenue = lastMonthRevenueAgg[0]?.revenue || 0;

  // Orders this month
  const monthOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
  // Orders last month
  const lastMonthOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

  // Recent 5 orders
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
  const payments = await Payment.find({ orderId: { $in: recentOrders.map(o => o._id) } });
  const paymentMap = {};
  payments.forEach(p => { paymentMap[p.orderId.toString()] = p; });
  const recentWithPayment = recentOrders.map(o => ({
    ...o.toObject(),
    payment: paymentMap[o._id.toString()] || null
  }));

  // Daily revenue for last 7 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const dailyRevenue = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Monthly revenue for last 4 months
  const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const monthlyRevenue = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: fourMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top selling products (from all completed orders)
  const topProducts = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.lineTotal' },
        image: { $first: '$items.image' },
        productId: { $first: '$items.productId' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalOrders,
    byStatus,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    monthOrderCount,
    lastMonthOrderCount,
    recentOrders: recentWithPayment,
    dailyRevenue,
    monthlyRevenue,
    topProducts
  };
};

/**
 * Cancel an order (customer or admin).
 */
exports.cancelOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) {
    throw Object.assign(new Error('Không thể huỷ đơn hàng ở trạng thái này'), { status: 400 });
  }

  order.statusHistory.push({ from: order.status, to: 'cancelled', changedBy: userId, note: 'Khách huỷ đơn' });
  order.status = 'cancelled';
  await order.save();

  // Mark payment as failed if pending
  await Payment.updateMany({ orderId: order._id, status: 'pending' }, { status: 'failed' });

  // Phase 2: Release reserved stock khi huỷ đơn — trả hàng về available
  try {
    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
    const stockItems = order.items
      .filter(item => item.productId)
      .map(item => ({ productId: item.productId.toString(), quantity: item.quantity }));
    if (stockItems.length > 0) {
      await axios.post(`${productServiceUrl}/api/internal/release-stock`, {
        items: stockItems,
        orderId: order._id.toString(),
        orderCode: order.orderCode
      });
    }
  } catch (stockErr) {
    console.warn('[Order] Could not release stock (non-fatal):', stockErr.message);
  }

  // Send cancellation email (non-blocking)
  const toEmail = order.addressSnapshot?.email || await getUserEmail(order.userId).catch(() => null);
  if (toEmail) {
    emailService.sendOrderStatusUpdate(order.toObject(), toEmail).catch(err =>
      console.warn('[Order] Cancel email failed (non-fatal):', err.message)
    );
  }

  return order;
};
