const User = require("../../models/User.js");
const mongoose = require("mongoose");

let Veterinarian = null;
try {
  Veterinarian = require("../../models/veterinarian.model.js");
} catch (e) {
  console.log(
    "Veterinarian model not found, skipping veterinarian-specific logic",
  );
}

const getUserName = (user) => {
  return (
    user.profile?.fullName ||
    user.name ||
    user.email?.split("@")[0] ||
    "Unknown"
  );
};

const getUserRole = (user) => {
  if (user.roles && user.roles.length > 0) {
    if (user.roles.includes("admin")) return "admin";
    if (user.roles.includes("staff")) return "staff";
    if (user.roles.includes("customer")) return "user";
  }

  if (user.role) {
    if (user.role === "admin") return "admin";
    if (user.role === "staff") return "staff";
    return "user";
  }
  return "user";
};

const isAdminAccount = (user) => {
  return getUserRole(user) === "admin";
};

const getUserStatus = (user) => {
  if (user.status === "deleted" || user.is_deleted) return "inactive";
  if (user.status === "banned" || user.is_banned) return "banned";
  if (user.status === "active") return "active";
  return "active";
};

const getAccountsService = async (query = {}) => {
  const { search, role, status, page = 1, limit = 8 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {
    $and: [
      {
        $or: [
          { status: { $ne: "deleted" } },
          { status: { $exists: false }, is_deleted: { $ne: true } },
        ],
      },
    ],
  };
  const searchConditions = [];
  const roleConditions = [];

  if (search) {
    searchConditions.push(
      { "profile.fullName": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    );
  }

  if (role && role !== "all") {
    const roleValue = ["admin", "staff", "user"].includes(role) ? role : "user";

    const rolesArrayValue =
      roleValue === "admin"
        ? "admin"
        : roleValue === "staff"
          ? "staff"
          : "customer";

    roleConditions.push({ role: roleValue }, { roles: rolesArrayValue });
  }

  if (searchConditions.length > 0) {
    filter.$and.push({ $or: searchConditions });
  }

  if (roleConditions.length > 0) {
    filter.$and.push({ $or: roleConditions });
  }

  if (status && status !== "all") {
    if (status === "active") {
      filter.$and.push({
        $or: [
          { status: "active" },
          {
            status: { $exists: false },
            is_banned: false,
            is_deleted: { $ne: true },
          },
        ],
      });
    } else if (status === "banned") {
      filter.$and.push({
        $or: [
          { status: "banned" },
          {
            status: { $exists: false },
            is_banned: true,
            is_deleted: { $ne: true },
          },
        ],
      });
    } else if (status === "inactive") {
      filter.$and = [
        {
          $or: [{ status: "deleted" }, { is_deleted: true }],
        },
      ];

      if (searchConditions.length > 0) {
        filter.$and.push({ $or: searchConditions });
      }

      if (roleConditions.length > 0) {
        filter.$and.push({ $or: roleConditions });
      }
    }
  }

  const accounts = await User.find(filter)
    .select("email profile roles role status is_banned is_deleted createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const formattedAccounts = accounts.map((user) => ({
    id: user._id.toString(),
    name: getUserName(user),
    email: user.email,
    role: getUserRole(user),
    status: getUserStatus(user),
    is_deleted: user.status === "deleted" || user.is_deleted,
    createdAt: user.createdAt,
  }));

  const totalItems = await User.countDocuments(filter);

  return {
    accounts: formattedAccounts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      totalItems,
      itemsPerPage: parseInt(limit),
    },
  };
};

const getAccountDetailService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  const user = await User.findOne({ _id: userId })
    .select("email profile roles role status is_banned is_deleted createdAt")
    .lean();

  if (!user) {
    throw new Error("Account not found!");
  }

  return {
    id: user._id.toString(),
    name: getUserName(user),
    email: user.email,
    role: getUserRole(user),
    status: getUserStatus(user),
    is_deleted: user.status === "deleted" || user.is_deleted,
    createdAt: user.createdAt,
  };
};

const updateRoleService = async (userId, newRole) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  const validRoles = ["user", "staff", "admin"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role!");
  }

  try {
    const mappedRole =
      newRole === "admin"
        ? "admin"
        : newRole === "staff"
          ? "staff"
          : "customer";

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        status: { $ne: "deleted" },
      },
      {
        role: newRole,
        roles: [mappedRole],
      },
      { new: true },
    ).select("email profile roles role status is_banned is_deleted createdAt");

    if (!user) {
      throw new Error("Account not found!");
    }

    return {
      id: user._id.toString(),
      name: getUserName(user),
      email: user.email,
      role: getUserRole(user),
      status: getUserStatus(user),
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Error in updateRoleService:", error);
    throw error;
  }
};

const updateBanStatusService = async (userId, banStatus) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  if (banStatus !== "active" && banStatus !== "banned") {
    throw new Error("Invalid status! Use 'active' or 'banned'.");
  }

  const targetUser = await User.findById(userId).select(
    "role roles status is_deleted",
  );
  if (!targetUser) {
    throw new Error("Account not found!");
  }

  if (targetUser.status === "deleted" || targetUser.is_deleted) {
    throw new Error("Cannot update deleted account!");
  }

  if (isAdminAccount(targetUser)) {
    throw new Error("Admin account cannot be banned!");
  }

  const isBanned = banStatus === "banned";
  const newStatus = isBanned ? "banned" : "active";

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      status: { $ne: "deleted" },
      is_deleted: { $ne: true },
    },
    {
      is_banned: isBanned,
      status: newStatus,
    },
    { new: true },
  ).select("email profile roles role status is_banned is_deleted createdAt");

  if (!user) {
    throw new Error("Account not found!");
  }

  return {
    id: user._id.toString(),
    name: getUserName(user),
    email: user.email,
    role: getUserRole(user),
    status: getUserStatus(user),
    createdAt: user.createdAt,
  };
};

const deleteAccountService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  const existingUser = await User.findById(userId).select(
    "tokenVersion status is_deleted",
  );
  if (!existingUser) {
    throw new Error("Account not found!");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      status: "deleted",
      is_deleted: true,
      is_banned: false,
      tokenVersion: (existingUser.tokenVersion || 0) + 1,
    },
    { new: true },
  ).select("email profile roles role status is_banned is_deleted createdAt");

  return {
    id: updatedUser._id.toString(),
    name: getUserName(updatedUser),
    email: updatedUser.email,
    role: getUserRole(updatedUser),
    status: getUserStatus(updatedUser),
    is_deleted: updatedUser.status === "deleted" || updatedUser.is_deleted,
    createdAt: updatedUser.createdAt,
  };
};

const restoreAccountService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  const existingUser = await User.findById(userId).select(
    "tokenVersion status is_deleted",
  );
  if (!existingUser) {
    throw new Error("Account not found!");
  }

  if (existingUser.status !== "deleted" && !existingUser.is_deleted) {
    throw new Error("Account is not deleted!");
  }

  const restoredUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      status: "active",
      is_deleted: false,
      is_banned: false,
      tokenVersion: (existingUser.tokenVersion || 0) + 1,
    },
    { new: true },
  ).select("email profile roles role status is_banned is_deleted createdAt");

  return {
    id: restoredUser._id.toString(),
    name: getUserName(restoredUser),
    email: restoredUser.email,
    role: getUserRole(restoredUser),
    status: getUserStatus(restoredUser),
    is_deleted: restoredUser.status === "deleted" || restoredUser.is_deleted,
    createdAt: restoredUser.createdAt,
  };
};

module.exports = {
  getAccountsService,
  getAccountDetailService,
  updateRoleService,
  updateBanStatusService,
  deleteAccountService,
  restoreAccountService,
};
