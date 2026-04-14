const {
  getAccountsService,
  getAccountDetailService,
  updateRoleService,
  updateBanStatusService,
  deleteAccountService,
  restoreAccountService,
} = require("../services/accountManagement.services.js");

const getAccounts = async (req, res) => {
  try {
    const data = await getAccountsService(req.query);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getAccounts controller:", error);
    res.status(400).json({ message: error.message });
  }
};

const getAccountDetail = async (req, res) => {
  try {
    const data = await getAccountDetailService(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getAccountDetail controller:", error);
    res.status(404).json({ message: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const { role } = req.body;
    const data = await updateRoleService(req.params.id, role);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in assignRole controller:", error);
    res.status(400).json({ message: error.message });
  }
};

const banUnbanAccount = async (req, res) => {
  try {
    const { status } = req.body; // "banned" or "active"
    const data = await updateBanStatusService(req.params.id, status);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in banUnbanAccount controller:", error);
    res.status(400).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const data = await deleteAccountService(req.params.id);
    res
      .status(200)
      .json({ message: "Account deleted successfully", account: data });
  } catch (error) {
    console.error("Error in deleteAccount controller:", error);
    const statusCode = error.message === "Account not found!" ? 404 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const restoreAccount = async (req, res) => {
  try {
    const data = await restoreAccountService(req.params.id);
    res
      .status(200)
      .json({ message: "Account restored successfully", account: data });
  } catch (error) {
    console.error("Error in restoreAccount controller:", error);
    const statusCode = error.message === "Account not found!" ? 404 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

module.exports = {
  getAccounts,
  getAccountDetail,
  assignRole,
  banUnbanAccount,
  deleteAccount,
  restoreAccount,
};
