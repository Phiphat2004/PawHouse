const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const stockRoutes = require('./routes/stock.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/warehouses', warehouseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    res.json({ message: 'Test OK', productCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Internal service endpoint — called by order-service to deduct stock after order creation
// Phase 1: Atomic deduction with guard — prevents negative stock under concurrent load
app.post('/api/internal/deduct-stock', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const StockLevel = require('./models/StockLevel');
    const { items } = req.body; // [{ productId, quantity }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    const failures = [];

    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const qty = Math.abs(item.quantity);

      // Atomic: only deduct if stock >= qty — prevents stock going negative
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updatedProduct) {
        failures.push({ productId: item.productId, error: 'Insufficient stock' });
        console.warn(`[Internal] deduct-stock: insufficient stock for product ${item.productId}`);
        continue;
      }

      // Atomically deduct from StockLevel (first warehouse with enough available stock)
      await StockLevel.findOneAndUpdate(
        {
          productId: item.productId,
          $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, qty] }
        },
        { $inc: { quantity: -qty, availableQuantity: -qty } }
      );
    }

    if (failures.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock for some items',
        failures
      });
    }

    res.json({ success: true, message: 'Stock deducted' });
  } catch (err) {
    console.error('[Internal] deduct-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error handler
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Reserved Stock: giữ hàng cho đơn chưa hoàn thành
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/internal/reserve-stock
 * Gọi khi tạo đơn hàng (status: pending).
 * Tăng reservedQuantity, giảm availableQuantity — atomic.
 * Body: { items: [{ productId, quantity }], orderId, orderCode }
 */
app.post('/api/internal/reserve-stock', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const Warehouse = require('./models/Warehouse');
    const StockLevel = require('./models/StockLevel');
    const StockMovement = require('./models/StockMovement');
    const { items, orderId, orderCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    // Lazy-init: tạo StockLevel cho sản phẩm chưa có record (sản phẩm cũ trước Phase 2)
    // Dùng $setOnInsert để idempotent — không ghi đè nếu đã tồn tại
    const warehouse = await Warehouse.findOne();
    if (warehouse) {
      for (const item of items) {
        if (!item.productId) continue;
        const existing = await StockLevel.findOne({ productId: item.productId });
        if (!existing) {
          const product = await Product.findById(item.productId).select('stock');
          if (product) {
            await StockLevel.findOneAndUpdate(
              { productId: item.productId, warehouseId: warehouse._id },
              {
                $setOnInsert: {
                  quantity: product.stock,
                  reservedQuantity: 0,
                  availableQuantity: product.stock
                }
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    }

    const failures = [];
    const reserved = []; // track để rollback nếu batch thất bại

    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const qty = Math.abs(item.quantity);

      // Atomic: chỉ reserve khi availableQuantity >= qty
      const stockLevel = await StockLevel.findOneAndUpdate(
        {
          productId: item.productId,
          $expr: { $gte: ['$availableQuantity', qty] }
        },
        { $inc: { reservedQuantity: qty, availableQuantity: -qty } },
        { new: true }
      );

      if (!stockLevel) {
        // Phân biệt: không có StockLevel (đã khởi tạo nhưng thiếu warehouse?) vs không đủ hàng
        const sl = await StockLevel.findOne({ productId: item.productId });
        const reason = sl
          ? `Không đủ hàng (còn ${sl.availableQuantity}, cần ${qty})`
          : 'Sản phẩm chưa có dữ liệu kho';
        failures.push({ productId: item.productId, error: reason });
        continue;
      }


      reserved.push({ productId: item.productId, qty, warehouseId: stockLevel.warehouseId });
    }

    if (failures.length > 0) {
      // All-or-nothing: rollback tất cả items đã reserve trong batch này
      for (const r of reserved) {
        await StockLevel.findOneAndUpdate(
          { productId: r.productId, reservedQuantity: { $gte: r.qty } },
          { $inc: { reservedQuantity: -r.qty, availableQuantity: r.qty } }
        ).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        error: 'Không đủ hàng cho một số sản phẩm trong đơn',
        failures
      });
    }

    // Tất cả items reserve thành công — sync Product.stock và ghi movement log
    for (const r of reserved) {
      await Product.findByIdAndUpdate(r.productId, { $inc: { stock: -r.qty } }).catch(() => {});
      await StockMovement.create({
        productId: r.productId,
        warehouseId: r.warehouseId,
        type: 'RESERVE',
        quantity: r.qty,
        referenceType: 'ORDER',
        referenceId: orderId || orderCode || null,
        notes: `Reserved ${r.qty} units for order ${orderCode || orderId}`
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Stock reserved' });
  } catch (err) {
    console.error('[Internal] reserve-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/internal/release-stock
 * Gọi khi huỷ đơn hàng — trả hàng về available.
 * Body: { items: [{ productId, quantity }], orderId, orderCode }
 */
app.post('/api/internal/release-stock', async (req, res) => {
  try {
    const StockLevel = require('./models/StockLevel');
    const StockMovement = require('./models/StockMovement');
    const { items, orderId, orderCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const qty = Math.abs(item.quantity);

      // Atomic: giảm reservedQuantity, tăng availableQuantity
      // Guard: reservedQuantity >= qty để tránh âm
      const stockLevel = await StockLevel.findOneAndUpdate(
        {
          productId: item.productId,
          reservedQuantity: { $gte: qty }
        },
        { $inc: { reservedQuantity: -qty, availableQuantity: qty } },
        { new: true }
      );

      if (!stockLevel) {
        console.warn(`[Internal] release-stock: no reserved stock found for product ${item.productId}`);
        continue; // non-fatal
      }

      // Sync Product.stock — khôi phục số lượng khách hàng thấy
      const Product = require('./models/Product');
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: qty } });

      await StockMovement.create({
        productId: item.productId,
        warehouseId: stockLevel.warehouseId,
        type: 'RELEASE',
        quantity: qty,
        referenceType: 'ORDER',
        referenceId: orderId || orderCode || null,
        notes: `Released ${qty} units — order ${orderCode || orderId} cancelled`
      });
    }

    res.json({ success: true, message: 'Stock released' });
  } catch (err) {
    console.error('[Internal] release-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/internal/fulfill-stock
 * Gọi khi đơn hàng hoàn thành (status: completed).
 * Trừ hẳn quantity + reservedQuantity — bước "chốt" cuối cùng.
 * Body: { items: [{ productId, quantity }], orderId, orderCode }
 */
app.post('/api/internal/fulfill-stock', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Product = require('./models/Product');
    const StockLevel = require('./models/StockLevel');
    const StockMovement = require('./models/StockMovement');
    const { items, orderId, orderCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const qty = Math.abs(item.quantity);

      // Atomic: trừ quantity và reservedQuantity cùng lúc
      let stockLevel = await StockLevel.findOneAndUpdate(
        {
          productId: item.productId,
          quantity: { $gte: qty },
          reservedQuantity: { $gte: qty }
        },
        { $inc: { quantity: -qty, reservedQuantity: -qty } },
        { new: true }
      );

      if (!stockLevel) {
        // Best-effort: trừ quantity nếu chưa reserve (đơn cũ trước Phase 2)
        console.warn(`[Internal] fulfill-stock: guard failed for product ${item.productId}, best-effort fallback`);
        stockLevel = await StockLevel.findOneAndUpdate(
          { productId: item.productId, quantity: { $gte: qty } },
          { $inc: { quantity: -qty } },
          { new: true }
        );
      }

      // Sync Product.stock
      const totalStock = await StockLevel.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(item.productId) } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);
      await Product.findByIdAndUpdate(item.productId, { $set: { stock: totalStock[0]?.total || 0 } });

      if (stockLevel) {
        await StockMovement.create({
          productId: item.productId,
          warehouseId: stockLevel.warehouseId,
          type: 'FULFILL',
          quantity: qty,
          referenceType: 'ORDER',
          referenceId: orderId || orderCode || null,
          notes: `Fulfilled ${qty} units — order ${orderCode || orderId} completed`
        });
      }
    }

    res.json({ success: true, message: 'Stock fulfilled' });
  } catch (err) {
    console.error('[Internal] fulfill-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Recalculate stock từ transaction log
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/internal/return-stock
 * Gọi khi đơn hàng bị refund — trả hàng vật lý về kho.
 * Đơn đã completed nên đã fulfill (quantity bị trừ), nay cộng lại.
 * $inc: quantity +qty, availableQuantity +qty (reservedQuantity ko thay đổi vì đã fulfill rồi)
 * Body: { items: [{ productId, quantity }], orderId, orderCode }
 */
app.post('/api/internal/return-stock', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Product = require('./models/Product');
    const StockLevel = require('./models/StockLevel');
    const StockMovement = require('./models/StockMovement');
    const { items, orderId, orderCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const qty = Math.abs(item.quantity);

      // Cộng lại quantity và availableQuantity vào kho
      const stockLevel = await StockLevel.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { quantity: qty, availableQuantity: qty } },
        { new: true }
      );

      if (!stockLevel) {
        console.warn(`[Internal] return-stock: no StockLevel found for product ${item.productId}`);
        continue;
      }

      // Sync Product.stock để phản ánh hàng đã quay về
      const totalStock = await StockLevel.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(item.productId) } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);
      await Product.findByIdAndUpdate(item.productId, { $set: { stock: totalStock[0]?.total || 0 } });

      await StockMovement.create({
        productId: item.productId,
        warehouseId: stockLevel.warehouseId,
        type: 'RETURN',
        quantity: qty,
        referenceType: 'ORDER',
        referenceId: orderId || orderCode || null,
        notes: `Returned ${qty} units — order ${orderCode || orderId} refunded`
      });
    }

    res.json({ success: true, message: 'Stock returned' });
  } catch (err) {
    console.error('[Internal] return-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/internal/recalculate-stock/:productId
 * Tái tính lại StockLevel từ toàn bộ lịch sử StockMovement.
 * Dùng khi nghi ngờ dữ liệu bị lệch (audit / disaster recovery).
 */
app.post('/api/internal/recalculate-stock/:productId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const StockLevel = require('./models/StockLevel');
    const StockMovement = require('./models/StockMovement');
    const Product = require('./models/Product');

    const { productId } = req.params;
    const productObjId = new mongoose.Types.ObjectId(productId);

    const stockLevels = await StockLevel.find({ productId: productObjId });
    const report = [];

    for (const sl of stockLevels) {
      const movements = await StockMovement.find({
        productId: productObjId,
        warehouseId: sl.warehouseId
      }).sort({ createdAt: 1 });

      let calculatedQty = 0;
      let calculatedReserved = 0;

      for (const m of movements) {
        if (['IN', 'RETURN'].includes(m.type))       calculatedQty += m.quantity;
        else if (['OUT', 'FULFILL'].includes(m.type)) calculatedQty -= m.quantity;
        else if (m.type === 'RESERVE')                calculatedReserved += m.quantity;
        else if (m.type === 'RELEASE')                calculatedReserved -= m.quantity;
        // ADJUSTMENT: bỏ qua — cần xử lý riêng nếu có quantity âm/dương sau này
      }

      calculatedQty = Math.max(0, calculatedQty);
      calculatedReserved = Math.max(0, calculatedReserved);
      const calculatedAvailable = Math.max(0, calculatedQty - calculatedReserved);

      const before = {
        quantity: sl.quantity,
        reservedQuantity: sl.reservedQuantity,
        availableQuantity: sl.availableQuantity
      };

      await StockLevel.findByIdAndUpdate(sl._id, {
        $set: { quantity: calculatedQty, reservedQuantity: calculatedReserved, availableQuantity: calculatedAvailable }
      });

      report.push({ warehouseId: sl.warehouseId, before, after: { quantity: calculatedQty, reservedQuantity: calculatedReserved, availableQuantity: calculatedAvailable }, movementsProcessed: movements.length });
    }

    // Sync Product.stock
    const totalStock = await StockLevel.aggregate([
      { $match: { productId: productObjId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const newStock = totalStock[0]?.total || 0;
    await Product.findByIdAndUpdate(productId, { $set: { stock: newStock } });

    res.json({ success: true, productId, newProductStock: newStock, warehouseReport: report });
  } catch (err) {
    console.error('[Internal] recalculate-stock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`
========================================
  PRODUCT-SERVICE running on port ${config.port}
========================================
  Endpoints:
  GET    /api/products
  GET    /api/products/:id
  GET    /api/products/slug/:slug
  POST   /api/products
  PUT    /api/products/:id
  DELETE /api/products/:id
  GET    /api/products/search
  
  GET    /api/categories
  GET    /api/categories/:id
  POST   /api/categories
  PUT    /api/categories/:id
  DELETE /api/categories/:id

  POST   /api/cart/add
  GET    /api/cart
  PUT    /api/cart/:itemId
  DELETE /api/cart
  DELETE /api/cart/clear

      `);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start:', err.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

start();

