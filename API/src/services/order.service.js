const mongoose = require("mongoose");
const {
  Order,
  Cart,
  CartItem,
  Product,
  ProductVariation,
  DeliveryZone,
  User,
} = require("../models");
const emailService = require("./email.service");

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
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Mã đơn hàng không hợp lệ");
    error.status = 400;
    throw error;
  }

  const query = { _id: orderId };
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

  return order;
}

/**
 * Get dashboard stats for orders
 */
async function getDashboardStats() {
  const [total, pending, shipping, completed, cancelled, revenue] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "shipping" }),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
    ]);

  return {
    total,
    pending,
    shipping,
    completed,
    cancelled,
    revenue: revenue?.[0]?.totalRevenue || 0,
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

  if (!["pending", "confirmed"].includes(order.status)) {
    const error = new Error(
      "Chỉ có thể huỷ đơn hàng ở trạng thái chờ xác nhận hoặc đã xác nhận",
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

  const previousStatus = order.status;
  order.status = newStatus;
  order.statusHistory.push({
    from: previousStatus,
    to: newStatus,
    changedBy: adminId,
    note: note || `Đơn hàng được cập nhật sang ${newStatus}`,
    at: new Date(),
  });

  await order.save();

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
