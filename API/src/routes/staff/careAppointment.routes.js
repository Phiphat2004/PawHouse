const express = require("express");
const staffCareAppointmentController = require("../../controllers/staff/careAppointment.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["staff", "admin"]));

router.get("/", staffCareAppointmentController.getAppointmentsForStaff);
router.patch("/:id/approve", staffCareAppointmentController.approveAppointment);
router.patch("/:id/reject", staffCareAppointmentController.rejectAppointment);
router.patch(
  "/:id/status",
  staffCareAppointmentController.updateAppointmentStatus,
);

module.exports = router;
