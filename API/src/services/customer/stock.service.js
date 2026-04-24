const mongoose = require("mongoose");
const {
  StockLevel,
  StockMovement,
  Product,
  ProductVariation,
  Order,
  OrderItem,
} = require("../../models");

const DEFAULT_WAREHOUSE_ID = new mongoose.Types.ObjectId(
  "000000000000000000000001",
);
const DEFAULT_WAREHOUSE = {
  _id: DEFAULT_WAREHOUSE_ID,
  name: "Kho Cần Thơ",
  code: "WH001",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  },
  isActive: true,
};

function toObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}

function warehouseFromStockLevel(level) {
  if (!level) return { ...DEFAULT_WAREHOUSE };
  return {
    _id: level.warehouseId || DEFAULT_WAREHOUSE._id,
    name: level.warehouse?.name || DEFAULT_WAREHOUSE.name,
    code: level.warehouse?.code || DEFAULT_WAREHOUSE.code,
    address: level.warehouse?.address || DEFAULT_WAREHOUSE.address,
    isActive: level.warehouse?.isActive ?? true,
  };
}

function warehouseFromMovement(movement, fallbackWarehouse) {
  const base = fallbackWarehouse || DEFAULT_WAREHOUSE;
  return {
    _id: movement?.warehouseId || base._id,
    name: movement?.warehouseSnapshot?.name || base.name,
    code: movement?.warehouseSnapshot?.code || base.code,
    address: base.address,
    isActive: true,
  };
}

async function resolveSingleWarehouse() {
  const existing = await StockLevel.findOne({})
    .select("warehouseId warehouse")
    .sort({ updatedAt: -1 })
    .lean();

  if (!existing) {
    return { ...DEFAULT_WAREHOUSE };
  }

  return warehouseFromStockLevel(existing);
}

async function getWarehouseObjectById(warehouseId) {
  const filterId = toObjectId(warehouseId);
  if (!filterId) {
    return resolveSingleWarehouse();
  }

  const stockLevel = await StockLevel.findOne({ warehouseId: filterId })
    .select("warehouseId warehouse")
    .sort({ updatedAt: -1 })
    .lean();

  if (!stockLevel) {
    return {
      ...DEFAULT_WAREHOUSE,
      _id: filterId,
    };
  }

  return warehouseFromStockLevel(stockLevel);
}

function attachWarehouseToStockLevel(level, fallbackWarehouse) {
  const warehouse =
    warehouseFromStockLevel(level) || fallbackWarehouse || DEFAULT_WAREHOUSE;
  return {
    ...level,
    warehouseId: {
      _id: warehouse._id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      isActive: warehouse.isActive,
    },
  };
}

function attachWarehouseToMovement(movement, fallbackWarehouse) {
  const warehouse = warehouseFromMovement(movement, fallbackWarehouse);
  return {
    ...movement,
    warehouseId: {
      _id: warehouse._id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      isActive: warehouse.isActive,
    },
  };
}

async function recalculateAndSyncProductStock(productId) {
  const totalStock = await StockLevel.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    { $set: { stock: totalStock.length > 0 ? totalStock[0].total : 0 } },
  );
}

async function createStockEntry(data) {
  const {
    productId,
    warehouseId,
    quantity,
    type = "IN",
    reason,
    createdBy,
  } = data;

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const warehouse = warehouseId
    ? await getWarehouseObjectById(warehouseId)
    : await resolveSingleWarehouse();

  const actualQuantity = Math.abs(Number(quantity) || 0);
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";
  if (actualQuantity <= 0) throw new Error("Invalid quantity");

  let stockLevel;

  if (type === "OUT") {
    stockLevel = await StockLevel.findOneAndUpdate(
      {
        productId,
        warehouseId: warehouse._id,
        $expr: {
          $gte: [
            { $subtract: ["$quantity", "$reservedQuantity"] },
            actualQuantity,
          ],
        },
      },
      {
        $inc: { quantity: -actualQuantity, availableQuantity: -actualQuantity },
      },
      { new: true },
    );

    if (!stockLevel) {
      const existing = await StockLevel.findOne({
        productId,
        warehouseId: warehouse._id,
      });
      if (!existing)
        throw new Error("Cannot remove stock from empty warehouse");
      const available = existing.quantity - existing.reservedQuantity;
      throw new Error(
        `Insufficient stock. Available: ${available}, Requested: ${actualQuantity}`,
      );
    }
  } else {
    stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id },
      {
        $inc: { quantity: actualQuantity, availableQuantity: actualQuantity },
        $set: { lastRestockedAt: new Date() },
        $setOnInsert: {
          reservedQuantity: 0,
          reorderLevel: 10,
          warehouse: {
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address,
            isActive: true,
          },
        },
      },
      { new: true, upsert: true },
    );
  }

  await recalculateAndSyncProductStock(productId);

  const movement = await StockMovement.create({
    productId,
    warehouseId: warehouse._id,
    warehouseSnapshot: {
      name: warehouse.name,
      code: warehouse.code,
    },
    type: type === "OUT" ? "OUT" : "IN",
    quantity: actualQuantity,
    reason:
      normalizedReason ||
      (type === "OUT" ? "Direct in-store sale" : "Manual stock entry"),
    referenceType: type === "OUT" ? "SALE" : "PURCHASE",
    createdBy,
    notes:
      type === "OUT"
        ? `Stock removed: ${actualQuantity} units`
        : `Stock entry: Added ${actualQuantity} units`,
  });

  const stockLevelDoc = await StockLevel.findById(stockLevel._id)
    .populate("productId", "name sku price images")
    .lean();
  const movementDoc = await StockMovement.findById(movement._id)
    .populate("productId", "name sku")
    .populate("createdBy", "email")
    .lean();

  return {
    stockLevel: attachWarehouseToStockLevel(stockLevelDoc, warehouse),
    movement: attachWarehouseToMovement(movementDoc, warehouse),
  };
}

async function reserveStock(orderId, items = [], createdBy) {
  const warehouse = await resolveSingleWarehouse();
  const movements = [];
  const targetStatus = "confirmed";

  for (const item of items) {
    const productId = item.productId;
    const variationId = item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      {
        productId,
        warehouseId: warehouse._id,
        $expr: {
          $gte: [{ $subtract: ["$quantity", "$reservedQuantity"] }, qty],
        },
      },
      { $inc: { reservedQuantity: qty, availableQuantity: -qty } },
      { new: true },
    );

    if (stockLevel) {
      await recalculateAndSyncProductStock(productId);

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "RESERVE",
        quantity: qty,
        reason: "Reserved for order",
        referenceType: "ORDER",
        referenceId: String(orderId),
        createdBy,
        targetStatus,
        sourceStatus: "manual",
        notes: `Reserved ${qty} units for order ${orderId}`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
      continue;
    }

    // StockLevel not found with sufficient stock - try fallback to ProductVariation stock or fail
    if (variationId) {
      const pv = await ProductVariation.findById(variationId);
      if (!pv) throw new Error("Product variation not found for reservation");
      if ((pv.stock || 0) < qty) {
        throw new Error(
          `Insufficient variation stock for reservation. Available: ${pv.stock || 0}, Requested: ${qty}`,
        );
      }
      // Deduct from ProductVariation stock as fallback
      await ProductVariation.findByIdAndUpdate(variationId, {
        $inc: { stock: -qty },
      });

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "RESERVE",
        quantity: qty,
        reason: "Reserved for order",
        referenceType: "ORDER",
        referenceId: String(orderId),
        createdBy,
        targetStatus,
        sourceStatus: "manual",
        notes: `Reserved variation ${variationId} ${qty} units for order ${orderId}`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
      continue;
    }

    // No StockLevel and no variationId - cannot reserve
    const existing = await StockLevel.findOne({
      productId,
      warehouseId: warehouse._id,
    });
    const available = existing
      ? existing.quantity - existing.reservedQuantity
      : 0;
    throw new Error(
      `Insufficient stock to reserve. Available: ${available}, Requested: ${qty}. Please ensure product stock is properly configured in StockLevel.`,
    );
  }

  return { message: "Reserved stock for order", movements };
}

async function releaseStock(orderId, items = [], createdBy, sourceStatus = "pending") {
  const warehouse = await resolveSingleWarehouse();
  const movements = [];

  for (const item of items) {
    const productId = item.productId;
    const variationId = item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id },
      { $inc: { reservedQuantity: -qty, availableQuantity: qty } },
      { new: true },
    );

    if (!stockLevel && variationId) {
      await ProductVariation.findByIdAndUpdate(variationId, {
        $inc: { stock: qty },
      });
      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "RELEASE",
        quantity: qty,
        reason: "Order cancelled",
        referenceType: "ORDER",
        referenceId: String(orderId),
        createdBy,
        targetStatus: "cancelled",
        sourceStatus,
        notes: `Released variation ${variationId} ${qty} units for order ${orderId}`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
      continue;
    }

    if (stockLevel && stockLevel.reservedQuantity < 0) {
      stockLevel.reservedQuantity = 0;
      stockLevel.availableQuantity = Math.max(
        0,
        stockLevel.quantity - stockLevel.reservedQuantity,
      );
      await stockLevel.save();
    }

    await recalculateAndSyncProductStock(productId);

    const movement = await StockMovement.create({
      productId,
      warehouseId: warehouse._id,
      warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
      type: "RELEASE",
      quantity: qty,
      reason: "Order cancelled",
      referenceType: "ORDER",
      referenceId: String(orderId),
      createdBy,
      targetStatus: "cancelled",
      sourceStatus,
      notes: `Released ${qty} units for order ${orderId}`,
    });

    const movementDoc = await StockMovement.findById(movement._id)
      .populate("productId", "name sku")
      .lean();
    movements.push(attachWarehouseToMovement(movementDoc, warehouse));
  }

  return { message: "Released reserved stock for order", movements };
}

async function fulfillStock(orderId, items = [], createdBy) {
  const warehouse = await resolveSingleWarehouse();
  const movements = [];
  const order = await Order.findById(orderId).lean();
  const targetStatus = order?.status || "confirmed";

  for (const item of items) {
    const productId = item.productId;
    const variationId = item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      {
        productId,
        warehouseId: warehouse._id,
        availableQuantity: { $gte: qty },
      },
      {
        $inc: {
          reservedQuantity: qty,
          availableQuantity: -qty,
        },
      },
      { new: true },
    );

    if (!stockLevel) {
      if (variationId) {
        const movement = await StockMovement.create({
          productId,
          warehouseId: warehouse._id,
          warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
          type: "FULFILL",
          quantity: qty,
          reason: "Order confirmed - stock deducted",
          referenceType: "SALE",
          referenceId: String(orderId),
          createdBy,
          targetStatus,
          sourceStatus: "pending",
          notes: `Fulfilled variation ${variationId} ${qty} units for order ${orderId}`,
        });

        const movementDoc = await StockMovement.findById(movement._id)
          .populate("productId", "name sku")
          .lean();
        movements.push(attachWarehouseToMovement(movementDoc, warehouse));
        continue;
      }

      const existing = await StockLevel.findOne({
        productId,
        warehouseId: warehouse._id,
      });
      const available = existing ? existing.availableQuantity : 0;
      throw new Error(
        `Insufficient stock to confirm order. Available: ${available}, Requested: ${qty}`,
      );
    }

    await recalculateAndSyncProductStock(productId);

    const movement = await StockMovement.create({
      productId,
      warehouseId: warehouse._id,
      warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
      type: "FULFILL",
      quantity: qty,
      reason: "Order confirmed - stock deducted",
      referenceType: "SALE",
      referenceId: String(orderId),
      createdBy,
      targetStatus,
      sourceStatus: "pending",
      notes: `Fulfilled ${qty} units for order ${orderId}`,
    });

    const movementDoc = await StockMovement.findById(movement._id)
      .populate("productId", "name sku")
      .lean();
    movements.push(attachWarehouseToMovement(movementDoc, warehouse));
  }

  return { message: "Fulfilled stock for order", movements };
}

async function getStockLevels(filters = {}) {
  const { productId, warehouseId, lowStock } = filters;
  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId && mongoose.Types.ObjectId.isValid(warehouseId)) {
    query.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }
  if (lowStock) query.$expr = { $lte: ["$quantity", "$reorderLevel"] };

  const levels = await StockLevel.find(query)
    .populate("productId", "name sku price images")
    .sort({ updatedAt: -1 })
    .lean();

  return levels.map((level) => attachWarehouseToStockLevel(level));
}

async function getStockMovements(filters = {}) {
  const { productId, warehouseId, type, targetStatus, page = 1, limit = 20 } = filters;
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 20;

  const query = {};
  if (productId) query.productId = productId;
  if (warehouseId && mongoose.Types.ObjectId.isValid(warehouseId)) {
    query.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }
  query.isDeleted = { $ne: true };
  if (type) query.type = type;
  if (targetStatus) {
    if (targetStatus === "cancelled") {
      query.$or = [
        { targetStatus: "cancelled" },
        { type: { $in: ["RELEASE", "RESTORE"] } },
      ];
    } else {
      query.targetStatus = targetStatus;
    }
  }

  const fallbackWarehouse = await (warehouseId
    ? getWarehouseObjectById(warehouseId)
    : resolveSingleWarehouse());

  const movements = await StockMovement.find(query)
    .populate("productId", "name sku")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const normalizedMovements = movements.map((movement) =>
    attachWarehouseToMovement(movement, fallbackWarehouse),
  );

  const total = normalizedMovements.length;
  const skip = (numericPage - 1) * numericLimit;
  const paginatedMovements = normalizedMovements.slice(
    skip,
    skip + numericLimit,
  );

  return {
    movements: paginatedMovements,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.max(1, Math.ceil(total / numericLimit)),
    },
  };
}

async function getProductTotalStock(productId) {
  const stockLevels = await StockLevel.find({ productId }).lean();

  const pendingOrders = await Order.find({ status: "pending" })
    .select("_id")
    .lean();

  const pendingOrderIds = pendingOrders.map((order) => order._id);
  const reservationAgg = pendingOrderIds.length
    ? await OrderItem.aggregate([
        {
          $match: {
            orderId: { $in: pendingOrderIds },
            productId: new mongoose.Types.ObjectId(productId),
          },
        },
        { $group: { _id: null, quantity: { $sum: "$quantity" } } },
      ])
    : [];

  const reservedFromOrders = Number(reservationAgg?.[0]?.quantity || 0);

  const totalQuantity = stockLevels.reduce((sum, l) => sum + l.quantity, 0);
  const reservedQuantity = Math.min(reservedFromOrders, totalQuantity);
  const availableQuantity = Math.max(totalQuantity - reservedQuantity, 0);

  const warehouseCount = stockLevels.length || 0;
  let remainingReserved = reservedQuantity;
  const byWarehouse = stockLevels.map((level, index) => {
    const isLast = index === warehouseCount - 1;
    const proportionalReserved =
      warehouseCount > 0
        ? Math.floor(
            (reservedQuantity * (Number(level.quantity) || 0)) /
              Math.max(totalQuantity, 1),
          )
        : 0;
    const reservedForWarehouse = isLast
      ? remainingReserved
      : Math.min(proportionalReserved, Number(level.quantity) || 0);
    remainingReserved -= reservedForWarehouse;

    const warehouse = warehouseFromStockLevel(level);
    return {
      warehouseId: warehouse,
      quantity: level.quantity,
      available: Math.max(
        (Number(level.quantity) || 0) - reservedForWarehouse,
        0,
      ),
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

async function getWarehouses() {
  const warehouse = await resolveSingleWarehouse();
  return [warehouse];
}

async function createWarehouse() {
  throw new Error(
    "Single warehouse mode does not allow creating extra warehouses",
  );
}

async function deleteWarehouse() {
  throw new Error("Single warehouse mode does not allow deleting warehouse");
}

async function restoreStock(orderId, items = [], createdBy, sourceStatus = "shipping") {
  // Restore quantity when cancelling from confirmed/packing/shipping (after fulfill)
  const warehouse = await resolveSingleWarehouse();
  const movements = [];

  for (const item of items) {
    const productId = item.productId;
    const variationId = item.variationId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id },
      {
        ...(sourceStatus === "shipping"
          ? { $inc: { quantity: qty, availableQuantity: qty } }
          : { $inc: { reservedQuantity: -qty, availableQuantity: qty } }),
      },
      { new: true },
    );

    if (!stockLevel && variationId) {
      await ProductVariation.findByIdAndUpdate(variationId, {
        $inc: { stock: qty },
      });
      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "RESTORE",
        quantity: qty,
        reason: "Order cancelled",
        referenceType: "ORDER",
        referenceId: String(orderId),
        createdBy,
        targetStatus: "cancelled",
        sourceStatus,
        notes: `Restored variation ${variationId} ${qty} units due to order cancellation`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
      continue;
    }

    if (stockLevel) {
      await recalculateAndSyncProductStock(productId);

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "RESTORE",
        quantity: qty,
        reason: "Order cancelled",
        referenceType: "ORDER",
        referenceId: String(orderId),
        createdBy,
        targetStatus: "cancelled",
        sourceStatus,
        notes: `Restored ${qty} units due to order cancellation`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
    }
  }

  return { message: "Restored stock for cancelled order", movements };
}

async function shipStock(orderId, items = [], createdBy) {
  const warehouse = await resolveSingleWarehouse();
  const movements = [];

  for (const item of items) {
    const productId = item.productId;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (!productId || qty <= 0) continue;

    const stockLevel = await StockLevel.findOneAndUpdate(
      { productId, warehouseId: warehouse._id },
      { $inc: { quantity: -qty, reservedQuantity: -qty } },
      { new: true },
    );

    if (stockLevel) {
      await recalculateAndSyncProductStock(productId);

      const movement = await StockMovement.create({
        productId,
        warehouseId: warehouse._id,
        warehouseSnapshot: { name: warehouse.name, code: warehouse.code },
        type: "FULFILL",
        quantity: qty,
        reason: "Order shipped - physical stock deducted",
        referenceType: "SALE",
        referenceId: String(orderId),
        createdBy,
        targetStatus: "shipping",
        sourceStatus: "packing",
        notes: `Shipped ${qty} units for order ${orderId}`,
      });

      const movementDoc = await StockMovement.findById(movement._id)
        .populate("productId", "name sku")
        .lean();
      movements.push(attachWarehouseToMovement(movementDoc, warehouse));
    }
  }

  return { message: "Stock deducted for shipped order", movements };
}

async function deleteStockMovement(movementId) {
  const movement = await StockMovement.findById(movementId);
  if (!movement) throw new Error("Stock movement not found");
  if (!movement.isDeleted) {
    movement.isDeleted = true;
    movement.deletedAt = new Date();
    movement.deleteReason = "Deleted from stock history";
    await movement.save();
  }
  return {
    message: "Stock movement deleted successfully",
    deletedMovement: movement,
  };
}

module.exports = {
  createStockEntry,
  reserveStock,
  releaseStock,
  fulfillStock,
  shipStock,
  restoreStock,
  getStockLevels,
  getStockMovements,
  getProductTotalStock,
  getWarehouses,
  createWarehouse,
  deleteWarehouse,
  deleteStockMovement,
};
