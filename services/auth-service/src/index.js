const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
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
  AUTH-SERVICE running on port ${config.port}
========================================
  Endpoints:
  POST /api/auth/register
  POST /api/auth/verify-otp
  POST /api/auth/resend-otp
  POST /api/auth/login
  GET  /api/auth/me
  PUT  /api/auth/profile
  PUT  /api/auth/change-password      🔒 NEW
  POST /api/auth/logout
  GET  /api/auth/sessions
  DELETE /api/auth/sessions/:sessionId
  POST /api/auth/forgot-password
  POST /api/auth/verify-reset-otp
  POST /api/auth/reset-password
  POST /api/auth/google/auth          ⭐ NEW
  POST /api/auth/google/register      (Legacy)
  POST /api/auth/google/login         (Legacy)
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