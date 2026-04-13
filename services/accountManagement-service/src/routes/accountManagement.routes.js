const express = require("express");
const {
    getAccounts,
    getAccountDetail,
    assignRole,
    banUnbanAccount,
    deleteAccount,
} = require("../controllers/accountManagement.controller.js");
const { authenticate } = require("../middlewares/auth.middleware.js");

const router = express.Router();

// Protect all routes - check authentication and admin role
router.use(authenticate);
router.use((req, res, next) => {
    // Check if user has admin role
    // Backend uses roles array, check if it includes 'admin'
    const hasAdminRole = req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin');
    const hasAdminRoleSingle = req.user && req.user.role === 'admin';
    
    if (!hasAdminRole && !hasAdminRoleSingle) {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
});

// GET /api/admin/account-management/accounts - List with filters/pagination
router.get("/accounts", getAccounts);

// GET /api/admin/account-management/accounts/:id - Detail
router.get("/accounts/:id", getAccountDetail);

// PUT /api/admin/account-management/accounts/:id/role - Assign role
router.put("/accounts/:id/role", assignRole);

// PUT /api/admin/account-management/accounts/:id/ban - Ban/unban
router.put("/accounts/:id/ban", banUnbanAccount);

// DELETE /api/admin/account-management/accounts/:id - Delete (soft delete)
router.delete("/accounts/:id", deleteAccount);

module.exports = router;