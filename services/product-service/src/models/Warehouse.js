const mongoose = require('mongoose');

// Clear any existing model to force fresh compilation
if (mongoose.models.Warehouse) {
  delete mongoose.models.Warehouse;
}

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'warehouses'
});

// Compile the model fresh
const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
