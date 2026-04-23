const orderService = require("../../services/customer/order.service");

const createOrder = async (req, res, next) => {
  try {
    const { addressSnapshot, note, paymentMethod } = req.body;

    const result = await orderService.createOrder(req.user._id, {
      addressSnapshot,
      note,
      paymentMethod,
    });

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order: result.order || result,
      reservedMovements: result.reservedMovements || [],
    });
  } catch (error) {
    next(error);
  }
};

const createBuyNowOrder = async (req, res, next) => {
  try {
    const { addressSnapshot, note, directItems, paymentMethod } = req.body;

    const result = await orderService.createBuyNowOrder(req.user._id, {
      addressSnapshot,
      note,
      directItems,
      paymentMethod,
    });

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order: result.order || result,
      reservedMovements: result.reservedMovements || [],
    });
  } catch (error) {
    next(error);
  }
};

const searchOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const result = await orderService.searchOrders(req.user._id, {
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

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);

    res.json({
      message: "Lấy chi tiết đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
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

module.exports = {
  createBuyNowOrder,
  createOrder,
  searchOrders,
  getOrderById,
  cancelOrder,
};
