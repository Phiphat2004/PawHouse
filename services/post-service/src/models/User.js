const mongoose = require('mongoose');

// User model (minimal, for reference only - actual user data in auth-service)
const userSchema = new mongoose.Schema({
  email: String,
  profile: {
    firstName: String,
    lastName: String,
    avatarUrl: String
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
