const mongoose = require("mongoose");

const careAppointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    petName: { type: String, required: true, trim: true },
    petType: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

careAppointmentSchema.index({
  appointmentDate: 1,
  startTime: 1,
  status: 1,
});

module.exports = mongoose.model("CareAppointment", careAppointmentSchema);
