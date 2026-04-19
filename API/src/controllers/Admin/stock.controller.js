const stockService = require("../../services/admin/stock.service");
const adminProductService = require("../../services/admin/product.service");

const createEntry = async (req, res, next) => {
  try {
    const { productId, warehouseId, quantity, type = "IN", reason } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ error: "productId và quantity là bắt buộc" });
    }
    if (quantity <= 0)
      return res.status(400).json({ error: "Quantity phải lớn hơn 0" });
    if (type && !["IN", "OUT"].includes(type)) {
      return res.status(400).json({ error: "Type phải là IN hoặc OUT" });
    }

    const result = await stockService.createStockEntry({
      productId,
      warehouseId,
      quantity: Number(quantity),
      type,
      reason,
      createdBy: req.user.userId || req.user._id,
    });

    res.status(201).json({
      message: type === "OUT" ? "Xuất kho thành công" : "Nhập kho thành công",
      ...result,
    });
  } catch (error) {
    if (error.message === "Product not found")
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    if (error.message === "Cannot remove stock from empty warehouse")
      return res
        .status(400)
        .json({ error: "Không thể xuất hàng từ kho trống" });
    if (error.message?.includes("Insufficient stock"))
      return res.status(400).json({ error: error.message });
    next(error);
  }
};

const getStockLevels = async (req, res, next) => {
  try {
    const { productId, warehouseId, lowStock } = req.query;
    const stockLevels = await stockService.getStockLevels({
      productId,
      warehouseId,
      lowStock: lowStock === "true",
    });
    res.json({ stockLevels });
  } catch (error) {
    next(error);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const { productId, warehouseId, type, page, limit } = req.query;
    const result = await stockService.getStockMovements({
      productId,
      warehouseId,
      type,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteMovement = async (req, res, next) => {
  try {
    const result = await stockService.deleteStockMovement(req.params.id);
    res.json({ message: "Xóa bản ghi thành công", ...result });
  } catch (error) {
    if (error.message === "Stock movement not found") {
      return res
        .status(404)
        .json({ error: "Không tìm thấy bản ghi xuất nhập kho" });
    }
    next(error);
  }
};

const getProductStock = async (req, res, next) => {
  try {
    const stock = await stockService.getProductTotalStock(req.params.productId);
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await stockService.getWarehouses();
    res.json({ warehouses });
  } catch (error) {
    next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  try {
    await stockService.createWarehouse(req.body || {});
    res.status(201).json({ message: "Tạo kho thành công" });
  } catch (error) {
    if (error.message?.includes("Single warehouse mode")) {
      return res.status(400).json({
        error: "Hệ thống đang ở chế độ 1 kho, không thể tạo thêm kho",
      });
    }
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  try {
    await stockService.deleteWarehouse(req.params.id);
    res.json({ message: "Xóa kho thành công" });
  } catch (error) {
    if (error.message?.includes("Single warehouse mode")) {
      return res
        .status(400)
        .json({ error: "Hệ thống đang ở chế độ 1 kho, không thể xóa kho" });
    }
    next(error);
  }
};


module.exports = {
  createEntry,
  getStockLevels,
  getMovements,
  deleteMovement,
  getProductStock,
  getWarehouses,
  createWarehouse,
  deleteWarehouse,
};
