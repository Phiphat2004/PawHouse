const { authenticate, protectRoute, optionalAuth } = require('./auth.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = {
  authenticate,
  protectRoute,
  optionalAuth,
  errorHandler
};
