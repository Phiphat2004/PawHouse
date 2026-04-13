const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const accountManagementRoutes = require('./routes/accountManagement.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin/account-management', accountManagementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'account-management-service' });
});

// Error handler
app.use(errorHandler);

// Connect DB & Start server
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Connected to MongoDB');

    app.listen(config.port, () => {
      console.log('[DEBUG] JWT Secret:', config.jwt.secret);
      console.log(`
========================================
  ACCOUNT-MANAGEMENT-SERVICE running on port ${config.port}
========================================
  Endpoints:
  GET  /api/admin/account-management/accounts        - List accounts with filters
  GET  /api/admin/account-management/accounts/:id    - Get account details
  PUT  /api/admin/account-management/accounts/:id/role - Assign role
  PUT  /api/admin/account-management/accounts/:id/ban  - Ban/unban account
  DELETE /api/admin/account-management/accounts/:id    - Delete account (soft)
========================================
      `);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
// Auto restart