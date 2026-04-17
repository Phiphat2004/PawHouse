const careAppointmentService = require("../../services/admin/careAppointment.service");

const getAppointmentsForStaff = async (req, res, next) => {
  try {
    const result = await careAppointmentService.getAppointmentsForStaff(
      req.query,
    );
    res.json({ message: "Lấy danh sách lịch hẹn thành công", ...result });
  } catch (error) {
    next(error);
  }
};

const approveAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.approveAppointment(
      req.params.id,
      req.user._id,
    );
    res.json({ message: "Xác nhận lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};

const rejectAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.rejectAppointment(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json({ message: "Từ chối lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.updateAppointmentStatus(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json({
      message: "Cập nhật trạng thái lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointmentsForStaff,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
};
