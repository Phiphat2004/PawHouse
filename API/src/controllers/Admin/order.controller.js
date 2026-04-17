const orderService = require("../../services/admin/order.service");

const searchOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const result = await orderService.searchOrders(null, {
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
    const order = await orderService.getOrderById(req.params.id, null);

    res.json({
      message: "Lấy chi tiết đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await orderService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const normalizedNote = typeof note === "string" ? note.trim() : "";

    if (!status) {
      return res
        .status(400)
        .json({ message: "Trạng thái đơn hàng là bắt buộc" });
    }

    if (status === "cancelled" && !normalizedNote) {
      return res.status(400).json({ message: "Vui lòng nhập lý do hủy đơn" });
    }

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user._id,
      normalizedNote,
    );

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchOrders,
  getOrderById,
  getDashboardStats,
  updateOrderStatus,
};
