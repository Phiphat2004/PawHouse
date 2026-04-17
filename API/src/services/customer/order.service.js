const mongoose = require("mongoose");
const {
  Order,
  Cart,
  CartItem,
  Product,
  ProductVariation,
  DeliveryZone,
  User,
} = require("../../models");
const emailService = require("../email.service");

/**
 * Generate unique order code
 */
function generateOrderCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * Create a new order from cart items
 */
async function createOrder(userId, orderData) {
  const { addressSnapshot, deliveryZoneId, note } = orderData;

  // Validate address
  if (
    !addressSnapshot ||
    !addressSnapshot.fullName ||
    !addressSnapshot.phone ||
    !addressSnapshot.addressLine
  ) {
    const error = new Error("Địa chỉ giao hàng không đầy đủ");
    error.status = 400;
    throw error;
  }

  // Get user's cart
  const cart = await Cart.findOne({ user_id: userId }).populate({
    path: "items",
    populate: { path: "product_id" },
  });

  if (!cart || cart.items.length === 0) {
    const error = new Error("Giỏ hàng trống");
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
      const error = new Error("Sản phẩm không tồn tại");
      error.status = 400;
      throw error;
    }

    const quantity = Number(cartItem.quantity) || 0;
    const unitPrice =
      variation?.price !== undefined && variation?.price !== null
        ? Number(variation.price)
        : Number(product.price) || 0;
    const availableStock = variation
      ? Number(variation.stock) || 0
      : Number(product.stock) || 0;

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

  // Get delivery zone and calculate shipping fee
  let shippingFee = 0;
  if (deliveryZoneId) {
    const zone = await DeliveryZone.findById(deliveryZoneId);
    if (zone) {
      shippingFee = zone.fee || 0;
    }
  }

  const total = subtotal + shippingFee;
  const orderCode = generateOrderCode();

  // Create order
  const order = new Order({
    userId,
    orderNumber: orderCode,
    orderCode,
    status: "pending",
    addressSnapshot,
    deliveryZoneId: deliveryZoneId || null,
    shippingFee,
    subtotal,
    total,
    note: note || "",
    items: orderItems,
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

  // Create payment record
  const Payment =
    require("../../models").Payment || require("../../models/Payment");
  if (Payment) {
    const paymentMethod = orderData.paymentMethod || "cash";
    const payment = new Payment({
      orderId: order._id,
      method: paymentMethod,
      status: "pending",
      amount: total,
    });
    await payment.save();
  }

  // Update product stock
  for (const item of orderItems) {
    if (item.variationId) {
      await ProductVariation.findByIdAndUpdate(item.variationId, {
        $inc: { stock: -item.quantity },
      });
    } else if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  // Clear user's cart
  for (const cartItem of cart.items) {
    await CartItem.findByIdAndDelete(cartItem._id);
  }
  cart.items = [];
  cart.original_price = 0;
  cart.total_price = 0;
  await cart.save();

  const populatedOrder = await order.populate("userId", "name email phone");

  // Send order confirmation email
  try {
    const user = await User.findById(userId);
    if (user && user.email) {
      await emailService.sendOrderConfirmation(order.toObject(), user.email);
    }
  } catch (err) {
    console.error("Error sending order confirmation email:", err.message);
    // Don't throw - order was already created successfully
  }

  return populatedOrder;
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
    // Search by order code or product name
    query.$or = [
      { orderCode: { $regex: search, $options: "i" } },
      { orderNumber: { $regex: search, $options: "i" } },
      { "items.productName": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "name email phone")
      .populate("deliveryZoneId", "name fee")
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
    const error = new Error("Mã đơn hàng không hợp lệ");
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

  const order = await Order.findOne(query)
    .populate("userId", "name email phone")
    .populate("deliveryZoneId", "name fee")
    .populate("items.variationId")
    .populate("items.productId", "name images");

  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng");
    error.status = 404;
    throw error;
  }

  const orderObj = order.toObject();
  const Payment =
    require("../../models").Payment || require("../../models/Payment");
  let payment = null;
  if (Payment) {
    payment = await Payment.findOne({ orderId: order._id }).lean();
  }

  if (!payment) {
    payment = {
      method: "cash",
      status: orderObj.status === "completed" ? "paid" : "pending",
      amount: orderObj.total || 0,
    };
  } else if (orderObj.status === "completed" && payment.status !== "paid") {
    payment.status = "paid";
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

  const topProductsAgg = await Order.aggregate([
    { $match: { status: "completed" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.productName" },
        image: { $first: "$items.image" },
        soldAmount: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
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
    const error = new Error("Không tìm thấy đơn hàng");
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

  // Restore stock
  for (const item of order.items) {
    if (item.variationId) {
      await ProductVariation.findByIdAndUpdate(item.variationId, {
        $inc: { stock: item.quantity },
      });
    } else if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }
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
      await emailService.sendOrderStatusUpdate(order.toObject(), user.email);
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
    const error = new Error("Không tìm thấy đơn hàng");
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
    const error = new Error("Trạng thái không hợp lệ");
    error.status = 400;
    throw error;
  }

  const normalizedNote = typeof note === "string" ? note.trim() : "";
  if (newStatus === "cancelled" && !normalizedNote) {
    const error = new Error("Vui lòng nhập lý do hủy đơn");
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

  await order.save();

  // Update payment status to 'paid' when order is marked as 'completed' (Đã giao hàng)
  if (newStatus === "completed") {
    const Payment =
      require("../../models").Payment || require("../../models/Payment");
    if (Payment) {
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        {
          $set: { status: "paid", paidAt: new Date(), amount: order.total },
          $setOnInsert: { method: "cash" },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  // Restore stock if the order is cancelled by Admin
  if (newStatus === "cancelled") {
    for (const item of order.items) {
      if (item.variationId) {
        await ProductVariation.findByIdAndUpdate(item.variationId, {
          $inc: { stock: item.quantity },
        });
      } else if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }
  }

  // Send status update email to user
  try {
    const user = await User.findById(order.userId);
    if (user && user.email) {
      await emailService.sendOrderStatusUpdate(order.toObject(), user.email);
    }
  } catch (err) {
    console.error("Error sending order status update email:", err.message);
  }

  return order;
}
