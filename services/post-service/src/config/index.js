require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5003,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/pawcare',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'pawhouse_dev_secret',
    expiresIn: process.env.JWT_EXPIRES || '7d'
  },
  
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001'
  }
};
