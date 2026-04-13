require("dotenv").config();

module.exports = {
  // Server — 1 port duy nhất kết nối với frontend
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pawcare",

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "pawhouse_dev_secret",
    expiresIn: process.env.JWT_EXPIRES || "7d",
  },

  // Email (Resend)
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    emailFrom: process.env.EMAIL_FROM || "PawCare <noreply@resend.dev>",
  },

  // OTP
  otp: {
    expiresMinutes: 5,
    maxAttempts: 5,
  },

  // Bcrypt
  bcrypt: {
    saltRounds: 10,
  },

  // Cloudinary (Image Upload)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // CORS — Frontend URL
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};
