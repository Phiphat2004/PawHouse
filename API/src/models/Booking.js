const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    petName: { type: String, required: true, trim: true },
    petType: { type: String, required: true, trim: true },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      index: true,
    },
    serviceType: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "confirmed",
        "rejected",
        "cancelled",
        "checked_in",
        "in_progress",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["onsite", "online"],
      default: "onsite",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true },
);

bookingSchema.index({
  appointmentDate: 1,
  startTime: 1,
  status: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);
