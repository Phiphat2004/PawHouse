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
      // RESERVE   : giữ hàng khi tạo đơn (pending)
      // FULFILL   : trừ hẳn khi đơn xác nhận (confirmed)
      // RELEASE   : trả hàng khi huỷ đơn (pending status)
      // RESTORE   : hoàn lại hàng khi huỷ đơn đã confirm (confirmed+ status)
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
        "OTHER",
      ],
    },
    referenceId: {
      type: String, // orderId hoặc orderCode
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

// Index để truy vấn nhanh
stockMovementSchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

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
