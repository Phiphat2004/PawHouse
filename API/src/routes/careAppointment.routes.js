const express = require("express");
const router = express.Router();
const careAppointmentController = require("../controllers/careAppointment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate);

// Customer
router.post("/", careAppointmentController.createAppointment);
router.get("/my", careAppointmentController.getMyAppointments);
router.patch("/:id", careAppointmentController.updateMyAppointment);

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

module.exports = router;
