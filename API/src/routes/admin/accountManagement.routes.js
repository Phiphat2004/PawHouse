const express = require("express");
const {
  getAccounts,
  getAccountDetail,
  assignRole,
  banUnbanAccount,
  deleteAccount,
  restoreAccount,
} = require("../../controllers/Admin/accountManagement.controller.js");
const { authenticate } = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(authenticate);
router.use((req, res, next) => {
  const hasAdminRole =
    req.user &&
    Array.isArray(req.user.roles) &&
    req.user.roles.includes("admin");
  const hasAdminRoleSingle = req.user && req.user.role === "admin";

  if (!hasAdminRole && !hasAdminRoleSingle) {
    return res
      .status(403)
      .json({ error: "Access denied. Admin role required." });
  }
  next();
});

router.get("/accounts", getAccounts);
router.get("/accounts/:id", getAccountDetail);
router.put("/accounts/:id/role", assignRole);
router.put("/accounts/:id/ban", banUnbanAccount);
router.delete("/accounts/:id", deleteAccount);
router.put("/accounts/:id/restore", restoreAccount);

module.exports = router;
