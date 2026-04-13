require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// Error handler
app.use(errorHandler);

// Connect DB & Start server
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`
========================================
  ORDER-SERVICE running on port ${config.port}
========================================
  Endpoints:
  POST   /api/orders              - Create order
  GET    /api/orders/my           - Get my orders
  GET    /api/orders              - Get all orders (admin)
  GET    /api/orders/search       - Search orders (admin)
  GET    /api/orders/:id          - Get order detail
  PATCH  /api/orders/:id/status   - Update order status (admin)
  PATCH  /api/orders/:id/cancel   - Cancel order

  POST   /api/payments/cash       - Create cash payment (COD)
  PATCH  /api/payments/order/:orderId/mark-paid - Admin confirm COD
  GET    /api/payments/order/:orderId - Get payment by order
  GET    /api/payments/:id        - Get payment detail
========================================
      `);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
