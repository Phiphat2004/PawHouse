const careAppointmentService = require("../services/careAppointment.service");

exports.createAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.createAppointment(
      req.user._id,
      req.body,
    );
    res.status(201).json({
      message: "Đặt lịch thành công. Vui lòng chờ nhân viên duyệt.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAppointments = async (req, res, next) => {
  try {
    const result = await careAppointmentService.getMyAppointments(
      req.user._id,
      req.query,
    );
    res.json({ message: "Lấy danh sách lịch hẹn thành công", ...result });
  } catch (error) {
    next(error);
  }
};

exports.updateMyAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.updateMyAppointment(req.user._id, req.params.id, req.body);
    res.json({ message: "Cập nhật lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};

exports.getAppointmentsForStaff = async (req, res, next) => {
  try {
    const result = await careAppointmentService.getAppointmentsForStaff(
      req.query,
    );
    res.json({ message: "Lấy danh sách lịch hẹn thành công", ...result });
  } catch (error) {
    next(error);
  }
};

exports.approveAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.approveAppointment(
      req.params.id,
      req.user._id,
    );
    res.json({ message: "Duyệt lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};
