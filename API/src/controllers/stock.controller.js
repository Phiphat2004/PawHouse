const stockService = require('../services/stock.service');
const { Warehouse } = require('../models');

const stockController = {
  /**
   * Tạo stock entry (nhập/xuất kho)
   * POST /api/stock/entry
   */
  async createEntry(req, res, next) {
    try {
      const { productId, warehouseId, quantity, type = 'IN', reason } = req.body;

      if (!productId || !warehouseId || !quantity) {
        return res.status(400).json({ error: 'productId, warehouseId và quantity là bắt buộc' });
      }
      if (quantity <= 0) return res.status(400).json({ error: 'Quantity phải lớn hơn 0' });
      if (type && !['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ error: 'Type phải là IN hoặc OUT' });
      }

      const result = await stockService.createStockEntry({
        productId, warehouseId,
        quantity: Number(quantity),
        type, reason,
        createdBy: req.user.userId || req.user._id
      });

      res.status(201).json({ message: type === 'OUT' ? 'Xuất kho thành công' : 'Nhập kho thành công', ...result });
    } catch (error) {
      if (error.message === 'Product not found') return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      if (error.message === 'Warehouse not found') return res.status(404).json({ error: 'Không tìm thấy kho' });
      if (error.message === 'Warehouse is not active') return res.status(400).json({ error: 'Kho không hoạt động' });
      if (error.message === 'Cannot remove stock from empty warehouse') return res.status(400).json({ error: 'Không thể xuất hàng từ kho trống' });
      if (error.message?.includes('Insufficient stock')) return res.status(400).json({ error: error.message });
      next(error);
    }
  },

  /**
   * Lấy danh sách stock levels
   * GET /api/stock/levels
   */
  async getStockLevels(req, res, next) {
    try {
      const { productId, warehouseId, lowStock } = req.query;
      const stockLevels = await stockService.getStockLevels({ productId, warehouseId, lowStock: lowStock === 'true' });
      res.json({ stockLevels });
    } catch (error) { next(error); }
  },

  /**
   * Lấy stock movement history
   * GET /api/stock/movements
   */
  async getMovements(req, res, next) {
    try {
      const { productId, warehouseId, type, page, limit } = req.query;
      const result = await stockService.getStockMovements({
        productId, warehouseId, type,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20
      });
      res.json(result);
    } catch (error) { next(error); }
  },

  /**
   * Xóa stock movement record
   * DELETE /api/stock/movements/:id
   */
  async deleteMovement(req, res, next) {
    try {
      const result = await stockService.deleteStockMovement(req.params.id);
      res.json({ message: 'Xóa bản ghi thành công', ...result });
    } catch (error) {
      if (error.message === 'Stock movement not found') return res.status(404).json({ error: 'Không tìm thấy bản ghi xuất nhập kho' });
      next(error);
    }
  },

  /**
   * Lấy tổng stock của một product
   * GET /api/stock/product/:productId
   */
  async getProductStock(req, res, next) {
    try {
      const stock = await stockService.getProductTotalStock(req.params.productId);
      res.json({ stock });
    } catch (error) { next(error); }
  },

  /**
   * Lấy danh sách warehouses
   * GET /api/stock/warehouses
   */
  async getWarehouses(req, res, next) {
    try {
      const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
      res.json({ warehouses });
    } catch (error) { next(error); }
  },

  /**
   * Tạo warehouse
   * POST /api/stock/warehouses
   */
  async createWarehouse(req, res, next) {
    try {
      const { name, code, address } = req.body;
      if (!name || !code) return res.status(400).json({ error: 'Tên và mã kho là bắt buộc' });

      const existing = await Warehouse.findOne({ code });
      if (existing) return res.status(400).json({ error: 'Mã kho đã tồn tại' });

      const warehouse = await Warehouse.create({ name, code, address });
      res.status(201).json({ message: 'Tạo kho thành công', warehouse });
    } catch (error) { next(error); }
  },

  /**
   * Xóa warehouse
   * DELETE /api/stock/warehouses/:id
   */
  async deleteWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
      if (!warehouse) return res.status(404).json({ error: 'Không tìm thấy kho' });
      res.json({ message: 'Xóa kho thành công', warehouse });
    } catch (error) { next(error); }
  }
};

module.exports = stockController;
