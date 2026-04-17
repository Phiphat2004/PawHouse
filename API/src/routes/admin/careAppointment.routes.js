const express = require("express");
const adminCareAppointmentController = require("../../controllers/Admin/careAppointment.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize(["admin"]));

router.get("/", adminCareAppointmentController.getAppointmentsForStaff);
router.patch("/:id/approve", adminCareAppointmentController.approveAppointment);
router.patch("/:id/reject", adminCareAppointmentController.rejectAppointment);
router.patch(
  "/:id/status",
  adminCareAppointmentController.updateAppointmentStatus,
);

module.exports = router;
