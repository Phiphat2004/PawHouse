const careAppointmentService = require("../../services/customer/careAppointment.service");

const createAppointment = async (req, res, next) => {
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

const getMyAppointments = async (req, res, next) => {
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

const getMyAppointmentById = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.getMyAppointmentById(
      req.user._id,
      req.params.id,
    );
    res.json({ message: "Lấy chi tiết lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};

const updateMyAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.updateMyAppointment(
      req.user._id,
      req.params.id,
      req.body,
    );
    res.json({
      message:
        "Cập nhật lịch hẹn thành công. Nếu lịch đã duyệt, hệ thống sẽ chuyển về chờ duyệt lại.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancelMyAppointment = async (req, res, next) => {
  try {
    const appointment = await careAppointmentService.cancelMyAppointment(
      req.user._id,
      req.params.id,
      req.body,
    );
    res.json({ message: "Đã hủy lịch hẹn thành công", appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getMyAppointmentById,
  updateMyAppointment,
  cancelMyAppointment,
};
