const orderService = require('../services/order.service');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await orderService.getDashboardStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { items, addressInfo, paymentMethod, note, shippingFee } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }
    if (!addressInfo || !addressInfo.phone || !(addressInfo.addressLine || addressInfo.address)) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin địa chỉ giao hàng' });
    }

    const result = await orderService.createOrder(userId, {
      items,
      addressInfo,
      paymentMethod,
      note,
      shippingFee
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        ...result.order.toObject(),
        payment: result.payment
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { status, page, limit, search } = req.query;
    const result = await orderService.getMyOrders(userId, { status, page, limit, search });
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, userId, search, page, limit } = req.query;
    const result = await orderService.getAllOrders({ status, userId, search }, { page, limit });
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.searchOrders = async (req, res, next) => {
  try {
    const { status, userId, search, page, limit } = req.query;
    const result = await orderService.getAllOrders({ status, userId, search }, { page, limit });
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const updatedBy = req.user?.userId || req.user?.id || req.user?._id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Thiếu trạng thái mới' });

    const order = await orderService.updateOrderStatus(req.params.id, status, updatedBy);
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const order = await orderService.cancelOrder(req.params.id, userId);
    return res.json({ success: true, message: 'Đã huỷ đơn hàng', data: order });
  } catch (error) {
    next(error);
  }
};
