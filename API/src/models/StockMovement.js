const mongoose = require("mongoose");
const DEFAULT_WAREHOUSE_ID = "000000000000000000000001";

function createDefaultWarehouseId() {
  return new mongoose.Types.ObjectId(DEFAULT_WAREHOUSE_ID);
}

function createDefaultWarehouseSnapshot() {
  return {
    name: "Kho Cần Thơ",
    code: "WH001",
  };
}

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: createDefaultWarehouseId,
    },
    warehouseSnapshot: {
      name: {
        type: String,
        default: "Kho Cần Thơ",
        trim: true,
      },
      code: {
        type: String,
        default: "WH001",
        trim: true,
      },
    },
    type: {
      type: String,
      enum: [
        "IN",
        "OUT",
        "ADJUSTMENT",
        "TRANSFER",
        "RETURN",
        "RESERVE",
        "RELEASE",
        "FULFILL",
        "RESTORE",
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: [
        "PURCHASE",
        "SALE",
        "ADJUSTMENT",
        "TRANSFER",
        "RETURN",
        "ORDER",
        "POS",
        "OTHER",
      ],
    },
    referenceId: {
      type: String,
    },
    sourceStatus: {
      type: String,
    },
    targetStatus: {
      type: String,
    },
    quantityBefore: {
      type: Number,
    },
    quantityAfter: {
      type: Number,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deleteReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index để truy vấn nhanh
stockMovementSchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
stockMovementSchema.index({ referenceType: 1, referenceId: 1, createdAt: -1 });
stockMovementSchema.index({ isDeleted: 1, createdAt: -1 });

stockMovementSchema.pre("save", function (next) {
  if (!this.warehouseId) {
    this.warehouseId = createDefaultWarehouseId();
  }
  if (!this.warehouseSnapshot || !this.warehouseSnapshot.name) {
    this.warehouseSnapshot = createDefaultWarehouseSnapshot();
  }
  next();
});

module.exports = mongoose.model("StockMovement", stockMovementSchema);
