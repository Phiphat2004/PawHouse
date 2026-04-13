const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const routes = require('./routes');
app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PawHouse API (Monolith)', port: config.port });
});

app.use(errorHandler);

async function start() {
  try {
    const connectDB = require('./config/database');
    await connectDB();

    app.listen(config.port, () => {
      console.log(`
    Port : ${config.port}
    Mode : ${config.nodeEnv}
      `);
    });
  } catch (err) {
    console.error('[ERROR] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
