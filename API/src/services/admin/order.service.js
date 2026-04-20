const mongoose = require("mongoose");
const {
  Order,
  OrderItem,
  Cart,
  Product,
  ProductVariation,
  User,
  StockLevel,
} = require("../../models");
const emailService = require("../email.service");
const stockService = require("./stock.service");

/**
 * Generate unique order code
 */
function generateOrderCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * Get total stock quantity for a product
 */
async function getProductStock(productId) {
  const stockLevels = await StockLevel.find({ productId });
  return stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
}

/**
 * Get stock for product variation or product
 */
async function getAvailableStock(productId, variationId) {
  // For variations, we would need to implement variation-level stock tracking
  // For now, return product stock
  return getProductStock(productId);
}

function buildPaymentSnapshot(order, payment = null) {
  const paymentData = payment?.toObject?.() || payment || {};

  return {
    method: paymentData.method || "cash",
    status:
      paymentData.status || (order.status === "completed" ? "paid" : "pending"),
    amount: paymentData.amount ?? order.total ?? 0,
    providerTxnId: paymentData.providerTxnId || "",
    paidAt: paymentData.paidAt || null,
  };
}

/**
 * Create a new order from cart items
 */
async function createOrder(userId, orderData) {
  const { addressSnapshot, note } = orderData;

  // Validate address
  if (
    !addressSnapshot ||
    !addressSnapshot.fullName ||
    !addressSnapshot.phone ||
    !addressSnapshot.addressLine
  ) {
    const error = new Error("Incomplete shipping address");
    error.status = 400;
    throw error;
  }

  // Get user's cart
  const cart = await Cart.findOne({ user_id: userId }).populate(
    "items.product_id",
  );

  if (!cart || cart.items.length === 0) {
    const error = new Error("Cart is empty");
    error.status = 400;
    throw error;
  }

  // Prepare order items
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    let variation = null;
    if (cartItem.variation_id) {
      variation = await ProductVariation.findById(cartItem.variation_id);
    }

    if (!variation) {
      variation = await ProductVariation.findOne({
        $and: [
          {
            $or: [
              { product_id: cartItem.product_id?._id },
              { productId: cartItem.product_id?._id },
            ],
          },
          { isDeleted: { $ne: true } },
          { $or: [{ status: "active" }, { isActive: true }] },
        ],
      });
    }

    const product = cartItem.product_id;

    if (!product) {
      const error = new Error("Product not found");
      error.status = 400;
      throw error;
    }

    const quantity = Number(cartItem.quantity) || 0;
    const unitPrice =
      variation?.price !== undefined && variation?.price !== null
        ? Number(variation.price)
        : Number(product.price) || 0;
    const availableStock = await getAvailableStock(product._id, variation?._id);

    // Check stock availability
    if (availableStock < quantity) {
      const error = new Error(`Không đủ hàng tồn kho cho ${product.name}`);
      error.status = 400;
      throw error;
    }

    const lineTotal = unitPrice * quantity;

    orderItems.push({
      variationId: variation?._id,
      productId: product._id,
      sku: variation?.sku || product.sku,
      productName: product.name,
      variationName: variation?.name || "",
      image:
        variation?.image ||
        product.images?.[0]?.url ||
        product.images?.[0] ||
        "",
      unitPrice,
      quantity,
      lineTotal,
    });

    subtotal += lineTotal;
  }

  const shippingFee = 0;

  const total = subtotal + shippingFee;
  const orderCode = generateOrderCode();

  // Create order
  const order = new Order({
    userId,
    orderNumber: orderCode,
    orderCode,
    status: "pending",
    addressSnapshot,
    shippingFee,
    subtotal,
    total,
    payment: {
      method: orderData.paymentMethod || "cash",
      status: "pending",
      amount: total,
      providerTxnId: "",
      paidAt: null,
    },
    note: note || "",
    statusHistory: [
      {
        from: null,
        to: "pending",
        changedBy: userId,
        note: "Đơn hàng được tạo",
        at: new Date(),
      },
    ],
  });

  await order.save();

  if (orderItems.length) {
    await OrderItem.insertMany(
      orderItems.map((item) => ({ ...item, orderId: order._id })),
    );
  }

  // Reserve stock in StockLevel for the order
  try {
    await stockService.reserveStock(order._id, orderItems, userId);
  } catch (err) {
    console.error("Error reserving stock:", err.message);
    // Delete the order if stock reservation fails
    await Order.deleteOne({ _id: order._id });
    await OrderItem.deleteMany({ orderId: order._id });
    const error = new Error(`Stock reservation failed: ${err.message}`);
    error.status = 500;
    throw error;
  }

  // Clear user's cart
  cart.items = [];
  cart.original_price = 0;
  cart.total_price = 0;
  await cart.save();

  const populatedOrder = await order.populate("userId", "name email phone");
  const orderResponse = populatedOrder.toObject();
  orderResponse.items = orderItems;

  // Send order confirmation email
  try {
    const user = await User.findById(userId);
    if (user && user.email) {
      await emailService.sendOrderConfirmation(orderResponse, user.email);
    }
  } catch (err) {
    console.error("Error sending order confirmation email:", err.message);
    // Don't throw - order was already created successfully
  }

  return orderResponse;
}

/**
 * Search orders by user ID and filters
 */
async function searchOrders(userId, filters = {}) {
  const { status, page = 1, limit = 10, search } = filters;

  const query = {};
  if (userId) {
    query.userId = userId;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const matchedOrderIds = await OrderItem.distinct("orderId", {
      productName: { $regex: search, $options: "i" },
    });

    query.$or = [
      { orderCode: { $regex: search, $options: "i" } },
      { orderNumber: { $regex: search, $options: "i" } },
      { _id: { $in: matchedOrderIds } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get order by ID
 */
async function getOrderById(orderId, userId) {
  const normalizedOrderId = String(orderId || "").trim();
  if (!normalizedOrderId) {
    const error = new Error("Invalid order ID");
    error.status = 400;
    throw error;
  }

  let decodedOrderId = normalizedOrderId;
  try {
    decodedOrderId = decodeURIComponent(normalizedOrderId);
  } catch (e) {
    decodedOrderId = normalizedOrderId;
  }

  const cleanedOrderId = decodedOrderId.replace(/^#/, "").trim();
  const upperOrderId = cleanedOrderId.toUpperCase();
  const escapedOrderId = cleanedOrderId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const orderIdentifierMatchers = [
    { orderCode: cleanedOrderId },
    { orderCode: upperOrderId },
    { orderCode: { $regex: `^${escapedOrderId}$`, $options: "i" } },
    { orderNumber: cleanedOrderId },
    { orderNumber: upperOrderId },
    { orderNumber: { $regex: `^${escapedOrderId}$`, $options: "i" } },
  ];

  const isObjectId = mongoose.Types.ObjectId.isValid(cleanedOrderId);
  const query = isObjectId
    ? {
        $or: [{ _id: cleanedOrderId }, ...orderIdentifierMatchers],
      }
    : {
        $or: orderIdentifierMatchers,
      };

  if (userId) {
    query.userId = userId;
  }

  const order = await Order.findOne(query).populate(
    "userId",
    "name email phone",
  );

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const orderObj = order.toObject();
  const separatedItems = await OrderItem.find({ orderId: order._id })
    .populate("variationId")
    .populate("productId", "name images")
    .lean();

  if (separatedItems.length) {
    orderObj.items = separatedItems;
  }

  const payment = buildPaymentSnapshot(orderObj, orderObj.payment);
  if (orderObj.status === "completed" && payment.status !== "paid") {
    payment.status = "paid";
    payment.paidAt =
      payment.paidAt || new Date(orderObj.updatedAt || Date.now());
  }

  orderObj.payment = payment;

  return orderObj;
}

/**
 * Get dashboard stats for orders
 */
async function getDashboardStats() {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 6);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    total,
    pending,
    confirmed,
    packing,
    shipping,
    completed,
    cancelled,
    refunded,
    thisMonthOrders,
    lastMonthOrders,
    recentOrders,
    totalRevenueAgg,
    dailyRevenueAgg,
    monthlyRevenueAgg,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "confirmed" }),
    Order.countDocuments({ status: "packing" }),
    Order.countDocuments({ status: "shipping" }),
    Order.countDocuments({ status: "completed" }),
    Order.countDocuments({ status: "cancelled" }),
    Order.countDocuments({ status: "refunded" }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] },
          },
        },
      },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5),
    Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfThisWeek } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "+07:00",
            },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
              timezone: "+07:00",
            },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const topProductsAgg = await OrderItem.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },
    { $match: { "order.status": "completed" } },
    {
      $group: {
        _id: "$productId",
        name: { $first: "$productName" },
        image: { $first: "$image" },
        soldAmount: { $sum: "$quantity" },
        revenue: { $sum: "$lineTotal" },
      },
    },
    { $sort: { soldAmount: -1 } },
    { $limit: 5 },
  ]);

  return {
    monthRevenue: thisMonthOrders?.[0]?.revenue || 0,
    lastMonthRevenue: lastMonthOrders?.[0]?.revenue || 0,
    monthOrderCount: thisMonthOrders?.[0]?.count || 0,
    lastMonthOrderCount: lastMonthOrders?.[0]?.count || 0,
    byStatus: {
      pending,
      confirmed,
      packing,
      shipping,
      completed,
      cancelled,
      refunded,
    },
    revenue: totalRevenueAgg?.[0]?.totalRevenue || 0,
    total,
    recentOrders,
    dailyRevenue: dailyRevenueAgg,
    monthlyRevenue: monthlyRevenueAgg,
    topProducts: topProductsAgg,
  };
}

/**
 * Cancel order
 */
async function cancelOrder(orderId, userId, reason = "") {
  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (!["pending", "confirmed", "packing"].includes(order.status)) {
    const error = new Error(
      "Chỉ có thể huỷ đơn hàng ở trạng thái chờ xác nhận, đã xác nhận hoặc đang đóng gói",
    );
    error.status = 400;
    throw error;
  }

  const orderItems = await OrderItem.find({ orderId: order._id }).lean();

  // Restore stock by releasing the reservation
  try {
    await stockService.releaseStock(order._id, orderItems, userId);
  } catch (err) {
    console.error("Error releasing stock:", err.message);
    // Don't fail the cancellation if stock release fails
  }

  // Update order status
  const previousStatus = order.status;
  order.status = "cancelled";
  order.statusHistory.push({
    from: previousStatus,
    to: "cancelled",
    changedBy: userId,
    note: reason || "Đơn hàng đã bị huỷ",
    at: new Date(),
  });

  await order.save();

  // Send cancellation email
  try {
    const user = await User.findById(userId);
    if (user && user.email) {
      const payload = order.toObject();
      payload.items = orderItems;
      await emailService.sendOrderStatusUpdate(payload, user.email);
    }
  } catch (err) {
    console.error("Error sending order cancellation email:", err.message);
  }

  return order;
}

module.exports = {
  createOrder,
  searchOrders,
  getDashboardStats,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};

/**
 * Update order status (admin function)
 */
async function updateOrderStatus(orderId, newStatus, adminId, note = "") {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const validStatuses = [
    "pending",
    "confirmed",
    "packing",
    "shipping",
    "completed",
    "cancelled",
    "refunded",
  ];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error("Invalid status");
    error.status = 400;
    throw error;
  }

  const normalizedNote = typeof note === "string" ? note.trim() : "";
  if (newStatus === "cancelled" && !normalizedNote) {
    const error = new Error("Please enter cancellation reason");
    error.status = 400;
    throw error;
  }

  const previousStatus = order.status;

  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["packing", "cancelled"],
    packing: ["shipping", "cancelled"],
    shipping: ["completed"],
    completed: [],
    cancelled: [],
    refunded: [],
  };

  const allowedNextStatuses = validTransitions[previousStatus] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    const error = new Error(
      `Không thể chuyển trạng thái từ '${previousStatus}' sang '${newStatus}'`,
    );
    error.status = 400;
    throw error;
  }

  order.status = newStatus;
  order.statusHistory.push({
    from: previousStatus,
    to: newStatus,
    changedBy: adminId,
    note: normalizedNote || `Đơn hàng được cập nhật sang ${newStatus}`,
    at: new Date(),
  });

  if (newStatus === "completed") {
    order.payment = buildPaymentSnapshot(order, {
      ...(order.payment?.toObject?.() || order.payment || {}),
      method: order.payment?.method || "cash",
      status: "paid",
      amount: order.total,
      paidAt: new Date(),
    });
  }

  await order.save();

  // Fulfill stock when order is confirmed or marked as completed
  if (newStatus === "confirmed" || newStatus === "completed") {
    const orderItems = await OrderItem.find({ orderId: order._id }).lean();
    try {
      await stockService.fulfillStock(order._id, orderItems, adminId);
    } catch (err) {
      console.error("Error fulfilling stock:", err.message);
      // Don't fail the status update if stock fulfillment fails
    }
  }

  // Release stock if the order is cancelled
  if (newStatus === "cancelled") {
    const orderItems = await OrderItem.find({ orderId: order._id }).lean();
    try {
      // If cancelling from confirmed/packing/shipping, restore quantity first (reverse fulfill)
      if (["confirmed", "packing", "shipping"].includes(previousStatus)) {
        await stockService.restoreStock(order._id, orderItems, adminId);
      } else if (previousStatus === "pending") {
        // If cancelling from pending, just release the reserved stock
        await stockService.releaseStock(order._id, orderItems, adminId);
      }
    } catch (err) {
      console.error("Error restoring/releasing stock:", err.message);
      // Don't fail the cancellation if stock restore/release fails
    }
  }

  // Send status update email to user
  try {
    const user = await User.findById(order.userId);
    if (user && user.email) {
      const payload = order.toObject();
      payload.items = await OrderItem.find({ orderId: order._id }).lean();
      await emailService.sendOrderStatusUpdate(payload, user.email);
    }
  } catch (err) {
    console.error("Error sending order status update email:", err.message);
  }

  return order;
}
