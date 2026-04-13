require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/pawcare',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'pawhouse_dev_secret',
    expiresIn: process.env.JWT_EXPIRES || '7d'
  },
  
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  },
  
  otp: {
    expiresMinutes: 5,
    maxAttempts: 5
  },
  
  bcrypt: {
    saltRounds: 10
  }
};
