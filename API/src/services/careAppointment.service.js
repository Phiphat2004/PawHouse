const mongoose = require("mongoose");
const { CareAppointment, User } = require("../models");
const emailService = require("./email.service");
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
const ACTIVE_BOOKING_STATUSES = ["pending", "approved", "confirmed"];

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

function parseTimeToMinutes(value) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ""))) {
    return null;
  }
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function normalizeDateOnly(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function validateScheduleNotPast(normalizedDate, startMinutes) {
  const now = new Date();
  const nowDate = normalizeDateOnly(now);

  if (normalizedDate < nowDate) {
    const error = new Error("Không được đặt lịch trong quá khứ");
    error.status = 400;
    throw error;
  }

  if (normalizedDate.getTime() === nowDate.getTime()) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (startMinutes <= nowMinutes) {
      const error = new Error("Giờ bắt đầu phải lớn hơn thời điểm hiện tại");
      error.status = 400;
      throw error;
    }
  }
}

async function createAppointment(customerId, payload) {
  const {
    petName,
    petType,
    serviceType,
    appointmentDate,
    startTime,
    note,
    paymentMethod,
  } = payload;

  if (!petName || !petType || !serviceType || !appointmentDate || !startTime) {
    const error = new Error("Thiếu thông tin đặt lịch");
    error.status = 400;
    throw error;
  }

  const normalizedDate = normalizeDateOnly(appointmentDate);
  if (!normalizedDate) {
    const error = new Error("Ngày hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const startMinutes = parseTimeToMinutes(startTime);
  if (startMinutes === null) {
    const error = new Error("Khung giờ không hợp lệ");
    error.status = 400;
    throw error;
  }

  validateScheduleNotPast(normalizedDate, startMinutes);

  const duplicate = await CareAppointment.findOne({
    customerId,
    appointmentDate: normalizedDate,
    startTime,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  if (duplicate) {
    const error = new Error("Bạn đã có lịch hẹn trong khung giờ này");
    error.status = 409;
    throw error;
  }

  const appointment = await CareAppointment.create({
    customerId,
    petName: String(petName).trim(),
    petType: String(petType).trim(),
    serviceType: String(serviceType).trim(),
    appointmentDate: normalizedDate,
    startTime,
    note: note ? String(note).trim() : "",
    paymentMethod: paymentMethod === "online" ? "online" : "onsite",
    cancellationReason: "",
  });

  const populatedAppointment = await appointment.populate(
    "customerId",
    "email profile.fullName phone",
  );

  try {
    const customer =
      populatedAppointment.customerId || (await User.findById(customerId));
    if (customer?.email) {
      await emailService.sendCareAppointmentReceived(
        populatedAppointment.toObject(),
        customer.email,
        customer.profile?.fullName || "",
      );
    }
  } catch (err) {
    console.error("Error sending appointment received email:", err.message);
  }

  return populatedAppointment;
}

async function updateMyAppointment(customerId, appointmentId, payload) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findOne({
    _id: appointmentId,
    customerId,
  });
  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  if (
    appointment.status !== "pending" &&
    !isConfirmedStatus(appointment.status)
  ) {
    const error = new Error(
      "Chỉ có thể đổi lịch đang chờ duyệt hoặc đã xác nhận",
    );
    error.status = 400;
    throw error;
  }

  const nextPetName =
    payload.petName !== undefined
      ? String(payload.petName).trim()
      : appointment.petName;
  const nextPetType =
    payload.petType !== undefined
      ? String(payload.petType).trim()
      : appointment.petType;
  const nextServiceType =
    payload.serviceType !== undefined
      ? String(payload.serviceType).trim()
      : appointment.serviceType;
  const nextDate =
    payload.appointmentDate !== undefined
      ? normalizeDateOnly(payload.appointmentDate)
      : normalizeDateOnly(appointment.appointmentDate);
  const nextStartTime =
    payload.startTime !== undefined ? payload.startTime : appointment.startTime;
  const nextNote =
    payload.note !== undefined
      ? String(payload.note || "").trim()
      : appointment.note;

  const nextStartMinutes = parseTimeToMinutes(nextStartTime);

  if (
    !nextPetName ||
    !nextPetType ||
    !nextServiceType ||
    !nextDate ||
    !nextStartTime
  ) {
    const error = new Error("Thiếu thông tin đặt lịch");
    error.status = 400;
    throw error;
  }

  if (nextStartMinutes === null) {
    const error = new Error("Khung giờ không hợp lệ");
    error.status = 400;
    throw error;
  }

  validateScheduleNotPast(nextDate, nextStartMinutes);

  const duplicate = await CareAppointment.findOne({
    _id: { $ne: appointment._id },
    customerId,
    appointmentDate: nextDate,
    startTime: nextStartTime,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  if (duplicate) {
    const error = new Error("Bạn đã có lịch hẹn trong khung giờ này");
    error.status = 409;
    throw error;
  }

  appointment.petName = nextPetName;
  appointment.petType = nextPetType;
  appointment.serviceType = nextServiceType;
  appointment.appointmentDate = nextDate;
  appointment.startTime = nextStartTime;
  appointment.note = nextNote;

  // If customer reschedules an already confirmed appointment, it goes back to pending for review.
  if (isConfirmedStatus(appointment.status)) {
    appointment.status = "pending";
    appointment.reviewedBy = undefined;
    appointment.reviewedAt = undefined;
    appointment.rejectionReason = "";
  }

  await appointment.save();

  return appointment;
}

async function getMyAppointmentById(customerId, appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findOne({
    _id: appointmentId,
    customerId,
  }).populate("reviewedBy", "email profile.fullName");

  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  return appointment;
}

async function cancelMyAppointment(customerId, appointmentId, payload = {}) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.status = 400;
    throw error;
  }

  const appointment = await CareAppointment.findOne({
    _id: appointmentId,
    customerId,
  });
  if (!appointment) {
    const error = new Error("Không tìm thấy lịch hẹn");
    error.status = 404;
    throw error;
  }

  if (
    appointment.status !== "pending" &&
    !isConfirmedStatus(appointment.status)
  ) {
    const error = new Error("Lịch hẹn này không thể hủy ở thời điểm hiện tại");
    error.status = 400;
    throw error;
  }

  const cancellationReason = String(payload.reason || "").trim();
  if (!cancellationReason) {
    const error = new Error("Vui lòng nhập lý do hủy lịch");
    error.status = 400;
    throw error;
  }

  appointment.status = "cancelled";
  appointment.reviewedAt = new Date();
  appointment.cancellationReason = cancellationReason;
  await appointment.save();

  return appointment;
}

async function getMyAppointments(
  customerId,
  { status, page = 1, limit = 10 } = {},
) {
  const query = { customerId };
  const normalizedStatus = normalizeStatusFilter(status);
  if (normalizedStatus) query.status = normalizedStatus;

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const skip = (parsedPage - 1) * parsedLimit;

  const [appointments, total] = await Promise.all([
    CareAppointment.find(query)
      .sort({ appointmentDate: -1, startTime: -1 })
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

  const appointment = await CareAppointment.findById(appointmentId).populate(
    "customerId",
    "email profile.fullName",
  );
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
  createAppointment,
  updateMyAppointment,
  getMyAppointmentById,
  cancelMyAppointment,
  getMyAppointments,
  getAppointmentsForStaff,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
};
