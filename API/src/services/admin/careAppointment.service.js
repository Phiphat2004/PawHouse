const mongoose = require("mongoose");
const { CareAppointment, User } = require("../../models");
const emailService = require("../email.service");

const APPOINTMENT_STATUSES = [
  "pending",
  "approved",
  "confirmed",
  "rejected",
  "cancelled",
  "checked_in",
  "in_progress",
  "completed",
];

function isConfirmedStatus(status) {
  return status === "approved" || status === "confirmed";
}

function normalizeStatusFilter(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (!value || value === "all") return null;
  return APPOINTMENT_STATUSES.includes(value) ? value : null;
}

function normalizeDateOnly(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function getAppointmentsForStaff({
  status,
  date,
  page = 1,
  limit = 20,
} = {}) {
  const query = {};
  const normalizedStatus = normalizeStatusFilter(status);
  if (normalizedStatus) query.status = normalizedStatus;
  if (date) {
    const day = normalizeDateOnly(date);
    if (day) {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = { $gte: day, $lt: nextDay };
    }
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const [appointments, total] = await Promise.all([
    CareAppointment.find(query)
      .populate("customerId", "email profile.fullName phone")
      .populate("serviceId", "name durationMinutes basePrice isActive")
      .populate("reviewedBy", "email profile.fullName")
      .sort({ appointmentDate: 1, startTime: 1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    CareAppointment.countDocuments(query),
  ]);

  return {
    appointments,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    },
  };
}

async function approveAppointment(appointmentId, reviewerId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findById(appointmentId)
    .populate("customerId", "email profile.fullName")
    .populate("serviceId", "name durationMinutes basePrice isActive");
  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  if (appointment.status !== "pending") {
    const error = new Error("Chỉ có thể duyệt lịch đang chờ");
    error.status = 400;
    throw error;
  }

  appointment.status = "confirmed";
  appointment.reviewedBy = reviewerId;
  appointment.reviewedAt = new Date();
  appointment.rejectionReason = "";
  appointment.cancellationReason = "";
  await appointment.save();

  try {
    const customer =
      appointment.customerId || (await User.findById(appointment.customerId));
    if (customer?.email) {
      await emailService.sendCareAppointmentApproved(
        appointment.toObject(),
        customer.email,
        customer.profile?.fullName || "",
      );
    }
  } catch (err) {
    console.error("Error sending appointment approval email:", err.message);
  }

  return appointment;
}

async function rejectAppointment(appointmentId, reviewerId, payload = {}) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  if (appointment.status !== "pending") {
    const error = new Error("Chỉ có thể từ chối lịch đang chờ duyệt");
    error.status = 400;
    throw error;
  }

  appointment.status = "rejected";
  appointment.reviewedBy = reviewerId;
  appointment.reviewedAt = new Date();
  appointment.rejectionReason = String(payload.reason || "").trim();
  appointment.cancellationReason = "";
  await appointment.save();

  return appointment;
}

function validateStatusTransition(currentStatus, nextStatus) {
  const allowFromPending =
    nextStatus === "confirmed" && currentStatus === "pending";
  if (allowFromPending) return;

  if (nextStatus === "checked_in") {
    if (!isConfirmedStatus(currentStatus)) {
      const error = new Error(
        "Chỉ có thể nhận khách sau khi lịch đã được xác nhận",
      );
      error.status = 400;
      throw error;
    }
    return;
  }

  if (nextStatus === "in_progress") {
    if (currentStatus !== "checked_in") {
      const error = new Error(
        "Cần chuyển sang Đã check-in trước khi bắt đầu dịch vụ",
      );
      error.status = 400;
      throw error;
    }
    return;
  }

  if (nextStatus === "completed") {
    if (currentStatus !== "in_progress") {
      const error = new Error(
        "Cần chuyển sang Đang chăm sóc trước khi hoàn tất",
      );
      error.status = 400;
      throw error;
    }
    return;
  }

  const error = new Error("Trạng thái cập nhật không hợp lệ");
  error.status = 400;
  throw error;
}

async function updateAppointmentStatus(
  appointmentId,
  reviewerId,
  payload = {},
) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const nextStatus = String(payload.status || "")
    .trim()
    .toLowerCase();
  const allowedNextStatuses = [
    "checked_in",
    "in_progress",
    "completed",
    "confirmed",
  ];
  if (!allowedNextStatuses.includes(nextStatus)) {
    const error = new Error("Trạng thái cập nhật không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  validateStatusTransition(appointment.status, nextStatus);

  appointment.status = nextStatus;
  appointment.reviewedBy = reviewerId;
  appointment.reviewedAt = new Date();
  if (nextStatus !== "rejected") {
    appointment.rejectionReason = "";
  }
  if (nextStatus !== "cancelled") {
    appointment.cancellationReason = "";
  }
  await appointment.save();

  return appointment;
}

module.exports = {
  getAppointmentsForStaff,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
};
