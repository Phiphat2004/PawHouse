const { StockLevel, StockMovement, Product, Warehouse } = require('../models');

/**
 * Tạo stock entry (nhập/xuất kho)
 */
async function createStockEntry(data) {
  const { productId, warehouseId, quantity, type = 'IN', reason, createdBy } = data;

  // Kiểm tra product tồn tại
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Kiểm tra warehouse tồn tại
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  if (!warehouse.isActive) {
    throw new Error('Warehouse is not active');
  }

  // Phase 1: Atomic update — tránh race condition khi nhiều request đồng thời
  const actualQuantity = Math.abs(quantity);
  let stockLevel;

  if (type === 'OUT') {
    // Atomic: chỉ trừ khi availableQuantity (= quantity - reservedQuantity) >= actualQuantity
    // Dùng $expr để so sánh 2 field trong cùng document — đảm bảo tính nhất quán
    stockLevel = await StockLevel.findOneAndUpdate(
      {
        productId,
        warehouseId,
        $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, actualQuantity] }
      },
      { $inc: { quantity: -actualQuantity, availableQuantity: -actualQuantity } },
      { new: true }
    );

    if (!stockLevel) {
      // Phân biệt: không có stock level hay không đủ hàng
      const existing = await StockLevel.findOne({ productId, warehouseId });
      if (!existing) throw new Error('Cannot remove stock from empty warehouse');
      const available = existing.quantity - existing.reservedQuantity;
      throw new Error(`Insufficient stock. Available: ${available}, Requested: ${actualQuantity}`);
    }
  } else {
    // Atomic upsert: tạo mới nếu chưa có, tăng số lượng nếu đã có
    // $setOnInsert chỉ áp dụng khi INSERT (không ảnh hưởng khi UPDATE)
    stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId },
      {
        $inc: { quantity: actualQuantity, availableQuantity: actualQuantity },
        $set: { lastRestockedAt: new Date() },
        $setOnInsert: { reservedQuantity: 0, reorderLevel: 10 }
      },
      { new: true, upsert: true }
    );
  }

  // Cập nhật tổng stock vào Product (bypass validation)
  const totalStock = await StockLevel.aggregate([
    { $match: { productId: product._id } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);
  
  const newStock = totalStock.length > 0 ? totalStock[0].total : 0;
  await Product.updateOne(
    { _id: productId },
    { $set: { stock: newStock } }
  );

  // Tạo stock movement record
  const movementType = type === 'OUT' ? 'OUT' : 'IN';
  const movementNotes = type === 'OUT' 
    ? `Stock removed: ${actualQuantity} units` 
    : `Stock entry: Added ${actualQuantity} units`;
  
  const movement = await StockMovement.create({
    productId,
    warehouseId,
    type: movementType,
    quantity: actualQuantity,
    reason,
    referenceType: type === 'OUT' ? 'SALE' : 'PURCHASE',
    createdBy,
    notes: movementNotes
  });

  return {
    stockLevel: await StockLevel.findById(stockLevel._id)
      .populate('productId', 'name sku price images')
      .populate('warehouseId', 'name code address'),
    movement: await StockMovement.findById(movement._id)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .populate('createdBy', 'email')
  };
}

/**
 * Lấy danh sách stock levels
 */
async function getStockLevels(filters = {}) {
  const { productId, warehouseId, lowStock } = filters;
  
  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  if (lowStock) {
    query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  }

  return StockLevel.find(query)
    .populate('productId', 'name sku price images')
    .populate('warehouseId', 'name code address')
    .sort({ updatedAt: -1 });
}

/**
 * Lấy stock movements history
 */
async function getStockMovements(filters = {}) {
  const { productId, warehouseId, type, page = 1, limit = 20 } = filters;
  
  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  if (type) query.type = type;

  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StockMovement.countDocuments(query)
  ]);

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Lấy tổng stock của một product
 */
async function getProductTotalStock(productId) {
  const stockLevels = await StockLevel.find({ productId });
  
  const total = stockLevels.reduce((sum, level) => sum + level.quantity, 0);
  const available = stockLevels.reduce((sum, level) => sum + level.availableQuantity, 0);
  const reserved = stockLevels.reduce((sum, level) => sum + level.reservedQuantity, 0);

  return {
    total,
    available,
    reserved,
    byWarehouse: stockLevels.map(level => ({
      warehouseId: level.warehouseId,
      quantity: level.quantity,
      available: level.availableQuantity,
      reserved: level.reservedQuantity
    }))
  };
}

/**
 * Xóa stock movement record
 * Note: Chỉ xóa lịch sử giao dịch, KHÔNG ảnh hưởng đến stock level hiện tại
 */
async function deleteStockMovement(movementId) {
  // Tìm movement
  const movement = await StockMovement.findById(movementId);
  
  if (!movement) {
    throw new Error('Stock movement not found');
  }

  // Xóa movement record (chỉ xóa lịch sử, không ảnh hưởng stock level)
  await StockMovement.findByIdAndDelete(movementId);

  return {
    message: 'Stock movement deleted successfully',
    deletedMovement: movement
  };
}

module.exports = {
  createStockEntry,
  getStockLevels,
  getStockMovements,
  getProductTotalStock,
  deleteStockMovement
};
