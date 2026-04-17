const express = require("express");
const customerCareAppointmentController = require("../../controllers/customer/careAppointment.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", customerCareAppointmentController.createAppointment);
router.get("/my", customerCareAppointmentController.getMyAppointments);
router.get("/my/:id", customerCareAppointmentController.getMyAppointmentById);
router.patch("/:id", customerCareAppointmentController.updateMyAppointment);
router.patch(
  "/:id/reschedule",
  customerCareAppointmentController.updateMyAppointment,
);
router.patch(
  "/:id/cancel",
  customerCareAppointmentController.cancelMyAppointment,
);

module.exports = router;
