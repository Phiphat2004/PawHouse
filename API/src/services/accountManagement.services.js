const User = require("../models/User.js");
const mongoose = require("mongoose");

// Try to load Veterinarian model if it exists
let Veterinarian = null;
try {
  Veterinarian = require("../models/veterinarian.model.js");
} catch (e) {
  // Veterinarian model doesn't exist, that's okay
  console.log(
    "Veterinarian model not found, skipping veterinarian-specific logic",
  );
}

// Helper function to get name from user
const getUserName = (user) => {
  return (
    user.profile?.fullName ||
    user.name ||
    user.email?.split("@")[0] ||
    "Unknown"
  );
};

// Helper function to get role from user (handle both single role and roles array)
const getUserRole = (user) => {
  if (user.role) {
    return user.role === "admin" ? "admin" : "user";
  }
  if (user.roles && user.roles.length > 0) {
    return user.roles.includes("admin") ? "admin" : "user";
  }
  return "user";
};

const isAdminAccount = (user) => {
  // Use the same effective-role resolver used for API responses
  // so backend behavior matches what admin UI displays.
  return getUserRole(user) === "admin";
};

// Helper to determine status from user object (handling mixed schemas)
const getUserStatus = (user) => {
  // Deleted has highest priority (support both new + legacy schema)
  if (user.status === "deleted" || user.is_deleted) return "inactive";
  if (user.status === "banned" || user.is_banned) return "banned";
  if (user.status === "active") return "active";
  return "active";
};

const getAccountsService = async (query = {}) => {
  const { search, role, status, page = 1, limit = 8 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build filter
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
    const roleValue = role === "admin" ? "admin" : "user";

    roleConditions.push(
      { role: roleValue },
      { roles: roleValue === "admin" ? "admin" : "customer" },
    );
  }

  // Combine conditions with base filter
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
      // Override base default to show soft-deleted accounts only
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

  // Fetch paginated accounts
  // Select both sets of fields to be safe
  const accounts = await User.find(filter)
    .select("email profile roles role status is_banned is_deleted createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Map to frontend format
  const formattedAccounts = accounts.map((user) => ({
    id: user._id.toString(),
    name: getUserName(user),
    email: user.email,
    role: getUserRole(user),
    status: getUserStatus(user),
    is_deleted: user.status === "deleted" || user.is_deleted,
    createdAt: user.createdAt,
  }));

  // Get total count for pagination
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

  const validRoles = ["user", "admin"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role!");
  }

  try {
    const oldRole = newRole === "admin" ? "admin" : "customer";

    // Update user
    // We use { status: { $ne: 'deleted' } } instead of is_deleted: false
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        status: { $ne: "deleted" },
      },
      {
        role: newRole,
        roles: [oldRole], // Update roles array for backward compatibility
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

  // Update both is_banned (legacy) and status (new)
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

// Soft-delete an account by marking it deleted and bumping token version to invalidate sessions
const deleteAccountService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format!");
  }

  // Use findOne first to grab current tokenVersion, then update
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
