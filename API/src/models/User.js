const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: { type: String },
    status: {
      type: String,
      enum: ["active", "banned", "deleted"],
      default: "active",
    },
    isVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profile: {
      fullName: { type: String, trim: true },
      avatarUrl: { type: String },
      gender: { type: String, enum: ["male", "female", "other"] },
      dob: { type: Date },
      address: {
        city: String,
        district: String,
        ward: String,
        addressLine: String,
      },
    },
    roles: {
      type: [
        {
          type: String,
          enum: ["customer", "admin", "staff", "veterinarian"],
        },
      ],
      default: ["customer"],
    },
    is_banned: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    settings: {
      marketingEmail: { type: Boolean, default: true },
      pushNotification: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
