const mongoose = global.mongoose || require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  passwordHash: { type: String },
  status: {
    type: String,
    enum: ['active', 'banned', 'deleted'],
    default: 'active'
  },
  isVerified: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 0 },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profile: {
    fullName: { type: String, trim: true },
    avatarUrl: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: { type: Date },
    address: {
      city: String,
      district: String,
      ward: String,
      addressLine: String
    }
  },
  // Single role field (new)
  role: {
    type: String,
    enum: ['user', 'admin', 'staff', 'veterinarian'],
    default: 'user'
  },
  // Roles array (for backward compatibility)
  roles: [{
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  }],
  // Name field for easier access
  name: {
    type: String,
    trim: true
  },
  is_banned: {
    type: Boolean,
    default: false,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  settings: {
    marketingEmail: { type: Boolean, default: true },
    pushNotification: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Check if model already exists (backend might have defined it)
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
