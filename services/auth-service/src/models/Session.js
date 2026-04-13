const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  refreshToken: {
    type: String,
    unique: true,
    sparse: true
  },
  tokenVersion: {
    type: Number,
    required: true,
    default: 0
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    browser: String,
    os: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logoutAt: {
    type: Date
  }
}, { timestamps: true });

// Index cho query hiệu quả
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ token: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method để invalidate session
sessionSchema.methods.invalidate = async function() {
  this.isActive = false;
  this.logoutAt = new Date();
  await this.save();
};

// Static method để cleanup expired sessions
sessionSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  await this.deleteMany({ expiresAt: { $lt: now } });
};

// Static method để invalidate tất cả sessions của user
sessionSchema.statics.invalidateAllUserSessions = async function(userId) {
  await this.updateMany(
    { userId, isActive: true },
    { 
      isActive: false, 
      logoutAt: new Date() 
    }
  );
};

module.exports = mongoose.model('Session', sessionSchema);
