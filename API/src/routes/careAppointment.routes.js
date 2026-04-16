const express = require("express");
const router = express.Router();
const careAppointmentController = require("../controllers/careAppointment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate);

// Customer
router.post("/", careAppointmentController.createAppointment);
router.get("/my", careAppointmentController.getMyAppointments);
router.get("/my/:id", careAppointmentController.getMyAppointmentById);
router.patch("/:id", careAppointmentController.updateMyAppointment);
router.patch("/:id/reschedule", careAppointmentController.updateMyAppointment);
router.patch("/:id/cancel", careAppointmentController.cancelMyAppointment);

// Staff/Admin
router.get(
  "/",
  authorize(["staff", "admin"]),
  careAppointmentController.getAppointmentsForStaff,
);
router.patch(
  "/:id/approve",
  authorize(["staff", "admin"]),
  careAppointmentController.approveAppointment,
);
router.patch(
  "/:id/reject",
  authorize(["staff", "admin"]),
  careAppointmentController.rejectAppointment,
);
router.patch(
  "/:id/status",
  authorize(["staff", "admin"]),
  careAppointmentController.updateAppointmentStatus,
);

module.exports = router;
