const orderService = require("../services/order.service");

/**
 * POST /api/orders - Create a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { addressSnapshot, deliveryZoneId, note } = req.body;

    const order = await orderService.createOrder(req.user._id, {
      addressSnapshot,
      deliveryZoneId,
      note,
    });

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders - Search orders with pagination and filters
 */
exports.searchOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search, all } = req.query;

    let userId = req.user._id;
    if (all === 'true' && req.user.roles?.includes('admin')) {
      userId = null;
    }

    const result = await orderService.searchOrders(userId, {
      status,
      page,
      limit,
      search,
    });

    res.json({
      message: "Lấy danh sách đơn hàng thành công",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/dashboard-stats - Dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await orderService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id - Get order details
 */
exports.getOrderById = async (req, res, next) => {
  try {
    let userId = req.user._id;
    if (req.user.roles?.includes('admin')) {
      userId = null;
    }
    const order = await orderService.getOrderById(req.params.id, userId);

    res.json({
      message: "Lấy chi tiết đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/orders/:id - Cancel order
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await orderService.cancelOrder(
      req.params.id,
      req.user._id,
      reason,
    );

    res.json({
      message: "Huỷ đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status - Update order status (admin only)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ message: "Trạng thái đơn hàng là bắt buộc" });
    }

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user._id,
      note,
    );

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};
