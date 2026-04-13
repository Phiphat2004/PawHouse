const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  roles: [{ type: String }],
  profile: {
    fullName: String,
    avatarUrl: String
  }
}, { timestamps: true });

// We only need this for population, so we don't need strict validation or methods
module.exports = mongoose.model('User', userSchema);
