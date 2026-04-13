module.exports = {
  port: process.env.PORT || 5006,
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pawcare',
  jwtSecret: process.env.JWT_SECRET || 'pawhouse_dev_secret',
  env: process.env.NODE_ENV || 'development',
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'PawCare <noreply@nganlnx.store>',
    smtpHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.EMAIL_PORT, 10) || 587,
    smtpUser: process.env.EMAIL_USER || '',
    smtpPass: process.env.EMAIL_PASS || ''
  }
};

