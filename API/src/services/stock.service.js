const { StockLevel, StockMovement, Product, Warehouse } = require('../models');

async function createStockEntry(data) {
  const { productId, warehouseId, quantity, type = 'IN', reason, createdBy } = data;

  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) throw new Error('Warehouse not found');
  if (!warehouse.isActive) throw new Error('Warehouse is not active');

  const actualQuantity = Math.abs(quantity);
  let stockLevel;

  if (type === 'OUT') {
    stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId, $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, actualQuantity] } },
      { $inc: { quantity: -actualQuantity, availableQuantity: -actualQuantity } },
      { new: true }
    );
    if (!stockLevel) {
      const existing = await StockLevel.findOne({ productId, warehouseId });
      if (!existing) throw new Error('Cannot remove stock from empty warehouse');
      const available = existing.quantity - existing.reservedQuantity;
      throw new Error(`Insufficient stock. Available: ${available}, Requested: ${actualQuantity}`);
    }
  } else {
    stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId },
      { $inc: { quantity: actualQuantity, availableQuantity: actualQuantity }, $set: { lastRestockedAt: new Date() }, $setOnInsert: { reservedQuantity: 0, reorderLevel: 10 } },
      { new: true, upsert: true }
    );
  }

  // Cập nhật tổng stock vào Product
  const totalStock = await StockLevel.aggregate([{ $match: { productId: product._id } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]);
  await Product.updateOne({ _id: productId }, { $set: { stock: totalStock.length > 0 ? totalStock[0].total : 0 } });

  const movement = await StockMovement.create({
    productId, warehouseId, type: type === 'OUT' ? 'OUT' : 'IN',
    quantity: actualQuantity, reason,
    referenceType: type === 'OUT' ? 'SALE' : 'PURCHASE',
    createdBy,
    notes: type === 'OUT' ? `Stock removed: ${actualQuantity} units` : `Stock entry: Added ${actualQuantity} units`
  });

  return {
    stockLevel: await StockLevel.findById(stockLevel._id).populate('productId', 'name sku price images').populate('warehouseId', 'name code address'),
    movement: await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code').populate('createdBy', 'email')
  };
}

async function getStockLevels(filters = {}) {
  const { productId, warehouseId, lowStock } = filters;
  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  if (lowStock) query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  return StockLevel.find(query).populate('productId', 'name sku price images').populate('warehouseId', 'name code address').sort({ updatedAt: -1 });
}

async function getStockMovements(filters = {}) {
  const { productId, warehouseId, type, page = 1, limit = 20 } = filters;
  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  if (type) query.type = type;
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    StockMovement.find(query).populate('productId', 'name sku').populate('warehouseId', 'name code').populate('createdBy', 'email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    StockMovement.countDocuments(query)
  ]);
  return { movements, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getProductTotalStock(productId) {
  const stockLevels = await StockLevel.find({ productId });
  return {
    total: stockLevels.reduce((sum, l) => sum + l.quantity, 0),
    available: stockLevels.reduce((sum, l) => sum + l.availableQuantity, 0),
    reserved: stockLevels.reduce((sum, l) => sum + l.reservedQuantity, 0),
    byWarehouse: stockLevels.map(l => ({ warehouseId: l.warehouseId, quantity: l.quantity, available: l.availableQuantity, reserved: l.reservedQuantity }))
  };
}

async function deleteStockMovement(movementId) {
  const movement = await StockMovement.findById(movementId);
  if (!movement) throw new Error('Stock movement not found');
  await StockMovement.findByIdAndDelete(movementId);
  return { message: 'Stock movement deleted successfully', deletedMovement: movement };
}

module.exports = { createStockEntry, getStockLevels, getStockMovements, getProductTotalStock, deleteStockMovement };
