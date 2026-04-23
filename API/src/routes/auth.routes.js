const express = require("express");
const multer = require("multer");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"));
    }
  },
});

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/google/auth", authController.googleAuth);
router.post("/google/register", authController.googleRegister);
router.post("/google/login", authController.googleLogin);

router.get("/me", authenticate, authController.getMe);
router.put(
  "/profile",
  authenticate,
  upload.single("avatar"),
  authController.updateProfile,
);
router.put("/change-password", authenticate, authController.changePassword);
router.post("/logout", authenticate, authController.logout);
router.get("/sessions", authenticate, authController.getActiveSessions);
router.delete(
  "/sessions/:sessionId",
  authenticate,
  authController.revokeSession,
);

// Self delete — authenticated user deletes their own account
router.delete("/me", authenticate, authController.deleteMe);

module.exports = router;
