const mongoose = require('mongoose');
const { StockLevel, StockMovement, Product, Warehouse, ProductVariation, Order } = require('../models');

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

// Reserve stock for an order: increase reservedQuantity, decrease availableQuantity
async function reserveStock(orderId, items = [], createdBy) {
  const { Warehouse } = require('../models');
  const warehouse = await Warehouse.findOne({ isActive: true });
  if (!warehouse) throw new Error('No active warehouse found to reserve stock');

  const movements = [];
  for (const item of items) {
    const productId = item.productId || item.productId;
    const variationId = item.variationId || item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    // Try to reserve on StockLevel first
    let stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id, $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, qty] } },
      { $inc: { reservedQuantity: qty, availableQuantity: -qty } },
      { new: true }
    );

    if (stockLevel) {
      const totalStock = await StockLevel.aggregate([{ $match: { productId: mongoose.Types.ObjectId(productId) } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]);
      await Product.updateOne({ _id: productId }, { $set: { stock: totalStock.length > 0 ? totalStock[0].total : 0 } });

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        type: 'RESERVE',
        quantity: qty,
        reason: 'Reserve for order',
        referenceType: 'ORDER',
        referenceId: String(orderId),
        createdBy,
        notes: `Reserved ${qty} units for order ${orderId}`
      });

      movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
      continue;
    }

    // Fallback: if item is a variation, decrement variation.stock as a form of reservation
    if (variationId) {
      // Try to update ProductVariation stock directly
      const pv = await ProductVariation.findById(variationId);
      if (!pv) throw new Error('Product variation not found for reservation');
      if ((pv.stock || 0) < qty) throw new Error(`Insufficient variation stock for reservation. Available: ${pv.stock || 0}, Requested: ${qty}`);
      await ProductVariation.findByIdAndUpdate(variationId, { $inc: { stock: -qty } });

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        type: 'RESERVE',
        quantity: qty,
        reason: 'Reserve variation for order',
        referenceType: 'ORDER',
        referenceId: String(orderId),
        createdBy,
        notes: `Reserved variation ${variationId} ${qty} units for order ${orderId}`
      });

      movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
      continue;
    }

    const existing = await StockLevel.findOne({ productId, warehouseId: warehouse._id });
    const available = existing ? existing.quantity - existing.reservedQuantity : 0;
    throw new Error(`Insufficient stock to reserve. Available: ${available}, Requested: ${qty}`);
  }

  return { message: 'Reserved stock for order', movements };
}

// Release reserved stock (e.g., order cancelled)
async function releaseStock(orderId, items = [], createdBy) {
  const { Warehouse } = require('../models');
  const warehouse = await Warehouse.findOne({ isActive: true });
  if (!warehouse) throw new Error('No active warehouse found to release stock');

  const movements = [];
  for (const item of items) {
    const productId = item.productId || item.productId;
    const variationId = item.variationId || item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id },
      { $inc: { reservedQuantity: -qty, availableQuantity: qty } },
      { new: true }
    );

    // If no stockLevel found, fallback to ProductVariation stock update
    if (!stockLevel && variationId) {
      await ProductVariation.findByIdAndUpdate(variationId, { $inc: { stock: qty } });
      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        type: 'RELEASE',
        quantity: qty,
        reason: 'Release reserved variation for order',
        referenceType: 'ORDER',
        referenceId: String(orderId),
        createdBy,
        notes: `Released variation ${variationId} ${qty} units for order ${orderId}`
      });
      movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
      continue;
    }

    // ensure reservedQuantity not negative
    if (stockLevel && stockLevel.reservedQuantity < 0) {
      stockLevel.reservedQuantity = 0;
      stockLevel.availableQuantity = Math.max(0, stockLevel.quantity - stockLevel.reservedQuantity);
      await stockLevel.save();
    }

    const totalStock = await StockLevel.aggregate([{ $match: { productId: mongoose.Types.ObjectId(productId) } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]);
    await Product.updateOne({ _id: productId }, { $set: { stock: totalStock.length > 0 ? totalStock[0].total : 0 } });

    const movement = await StockMovement.create({
      productId,
      warehouseId: warehouse._id,
      type: 'RELEASE',
      quantity: qty,
      reason: 'Release reserved for order',
      referenceType: 'ORDER',
      referenceId: String(orderId),
      createdBy,
      notes: `Released ${qty} units for order ${orderId}`
    });

    movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
  }

  return { message: 'Released reserved stock for order', movements };
}

// Fulfill reserved stock: subtract from quantity and reservedQuantity (finalize sale)
async function fulfillStock(orderId, items = [], createdBy) {
  const { Warehouse } = require('../models');
  const warehouse = await Warehouse.findOne({ isActive: true });
  if (!warehouse) throw new Error('No active warehouse found to fulfill stock');

  const movements = [];
  for (const item of items) {
    const productId = item.productId || item.productId;
    const variationId = item.variationId || item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id, $expr: { $gte: ['$reservedQuantity', qty] } },
      { $inc: { reservedQuantity: -qty, quantity: -qty, availableQuantity: -qty } },
      { new: true }
    );

    if (!stockLevel) {
      // If no stockLevel but this is a variation previously reserved via variation.stock decrement,
      // create a FULFILL movement without double-decrementing variation stock.
      if (variationId) {
        const movement = await StockMovement.create({
          productId,
          warehouseId: warehouse._id,
          type: 'FULFILL',
          quantity: qty,
          reason: 'Fulfill variation order',
          referenceType: 'SALE',
          referenceId: String(orderId),
          createdBy,
          notes: `Fulfilled variation ${variationId} ${qty} units for order ${orderId}`
        });
        movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
        continue;
      }

      const existing = await StockLevel.findOne({ productId, warehouseId: warehouse._id });
      const reserved = existing ? existing.reservedQuantity : 0;
      throw new Error(`Cannot fulfill stock. Reserved: ${reserved}, Requested: ${qty}`);
    }

    const totalStock = await StockLevel.aggregate([{ $match: { productId: mongoose.Types.ObjectId(productId) } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]);
    await Product.updateOne({ _id: productId }, { $set: { stock: totalStock.length > 0 ? totalStock[0].total : 0 } });

    const movement = await StockMovement.create({
      productId,
      warehouseId: warehouse._id,
      type: 'FULFILL',
      quantity: qty,
      reason: 'Fulfill order',
      referenceType: 'SALE',
      referenceId: String(orderId),
      createdBy,
      notes: `Fulfilled ${qty} units for order ${orderId}`
    });

    movements.push(await StockMovement.findById(movement._id).populate('productId', 'name sku').populate('warehouseId', 'name code'));
  }

  return { message: 'Fulfilled stock for order', movements };
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
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 20;

  // 1) Manual stock movements (non-order-reference only)
  const manualQuery = {
    $or: [
      { referenceId: { $exists: false } },
      { referenceId: null },
      { referenceId: '' },
    ],
  };
  if (productId) manualQuery.productId = productId;
  if (warehouseId) manualQuery.warehouseId = warehouseId;
  if (type) manualQuery.type = type;

  const manualMovements = await StockMovement.find(manualQuery)
    .populate('productId', 'name sku')
    .populate('warehouseId', 'name code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // 2) Order-synced movements (authoritative from current order status)
  const statusToType = {
    pending: 'RESERVE',
    shipping: 'OUT',
    completed: 'FULFILL',
  };

  const orderStatusQuery = { $in: Object.keys(statusToType) };
  const orderQuery = { status: orderStatusQuery };
  if (productId) {
    orderQuery['items.productId'] = productId;
  }

  const orders = await Order.find(orderQuery)
    .populate('userId', 'name email')
    .sort({ updatedAt: -1 })
    .lean();

  const orderMovements = [];
  for (const order of orders) {
    const movementType = statusToType[order.status];
    if (!movementType) continue;

    const visibleStatus =
      order.status === 'pending'
        ? 'Chờ xác nhận'
        : order.status === 'shipping'
          ? 'Đang giao hàng'
          : 'Đã giao hàng';

    if (type && type !== movementType) continue;

    const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const statusAt = statusHistory.find((h) => h?.to === order.status)?.at;
    const createdAt = statusAt || order.updatedAt || order.createdAt;
    const orderUserName = order.userId?.name || order.addressSnapshot?.fullName || order.userId?.email || 'Khach hang';

    for (const item of order.items || []) {
      const itemProductId = item.productId?._id || item.productId;
      if (productId && String(itemProductId) !== String(productId)) continue;

      const productStockLevel = warehouseId
        ? await StockLevel.findOne({ productId: itemProductId, warehouseId })
            .populate('warehouseId', 'name code')
            .lean()
        : await StockLevel.findOne({ productId: itemProductId })
            .populate('warehouseId', 'name code')
            .sort({ quantity: -1, updatedAt: -1 })
            .lean();

      if (!productStockLevel) {
        continue;
      }

      const resolvedWarehouse = productStockLevel.warehouseId || {
        name: 'Kho sản phẩm',
        code: 'STOCK',
      };

      orderMovements.push({
        _id: `order-${order._id}-${itemProductId}-${movementType}`,
        productId: {
          _id: itemProductId,
          name: item.productName || 'San pham',
          sku: item.sku || '',
        },
        warehouseId: resolvedWarehouse,
        type: movementType,
        quantity: Number(item.quantity) || 0,
        reason: visibleStatus,
        referenceType: 'ORDER',
        referenceId: String(order._id),
        createdBy: {
          email: orderUserName,
        },
        orderStatus: order.status,
        statusLabel: visibleStatus,
        createdAt,
      });
    }
  }

  const combined = [...orderMovements, ...manualMovements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const total = combined.length;
  const skip = (numericPage - 1) * numericLimit;
  const movements = combined.slice(skip, skip + numericLimit);

  return {
    movements,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.max(1, Math.ceil(total / numericLimit)),
    },
  };
}

async function getProductTotalStock(productId) {
  const stockLevels = await StockLevel.find({ productId })
    .populate('warehouseId', 'name code address')
    .lean();

  // Reserve should reflect orders that are still pending (waiting confirmation)
  const pendingOrders = await Order.find({
    status: 'pending',
    'items.productId': productId,
  })
    .select('items')
    .lean();

  const reservedFromOrders = pendingOrders.reduce((sum, order) => {
    return (
      sum +
      (order.items || []).reduce((itemSum, item) => {
        const itemProductId = item.productId?._id || item.productId;
        return String(itemProductId) === String(productId)
          ? itemSum + (Number(item.quantity) || 0)
          : itemSum;
      }, 0)
    );
  }, 0);

  const totalQuantity = stockLevels.reduce((sum, l) => sum + l.quantity, 0);
  const reservedQuantity = Math.min(reservedFromOrders, totalQuantity);
  const availableQuantity = Math.max(totalQuantity - reservedQuantity, 0);

  const warehouseCount = stockLevels.length || 0;
  let remainingReserved = reservedQuantity;
  const byWarehouse = stockLevels.map((level, index) => {
    const isLast = index === warehouseCount - 1;
    const proportionalReserved = warehouseCount > 0
      ? Math.floor((reservedQuantity * (Number(level.quantity) || 0)) / Math.max(totalQuantity, 1))
      : 0;
    const reservedForWarehouse = isLast
      ? remainingReserved
      : Math.min(proportionalReserved, Number(level.quantity) || 0);
    remainingReserved -= reservedForWarehouse;

    return {
      warehouseId: level.warehouseId || null,
      quantity: level.quantity,
      available: Math.max((Number(level.quantity) || 0) - reservedForWarehouse, 0),
      reserved: reservedForWarehouse,
    };
  });

  return {
    total: totalQuantity,
    available: availableQuantity,
    reserved: reservedQuantity,
    byWarehouse,
  };
}

async function deleteStockMovement(movementId) {
  const movement = await StockMovement.findById(movementId);
  if (!movement) throw new Error('Stock movement not found');
  await StockMovement.findByIdAndDelete(movementId);
  return { message: 'Stock movement deleted successfully', deletedMovement: movement };
}

module.exports = { createStockEntry, reserveStock, releaseStock, fulfillStock, getStockLevels, getStockMovements, getProductTotalStock, deleteStockMovement };
