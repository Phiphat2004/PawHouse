const express = require('express');
const { Warehouse } = require('../models');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Get all warehouses
 * GET /api/warehouses
 */
router.get('/', async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    res.json({ warehouses });
  } catch (error) {
    next(error);
  }
});

/**
 * Create warehouse (admin only)
 * POST /api/warehouses
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, code, address } = req.body;    
    console.log('[WAREHOUSE POST] Received data:', { name, code, address });
    console.log('[WAREHOUSE POST] Full body:', req.body);
    if (!name) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Warehouse code is required' });
    }

    const warehouse = await Warehouse.create({ name, address });
    res.status(201).json({ warehouse });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
