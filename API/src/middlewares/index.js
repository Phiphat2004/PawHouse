const { authenticate, optionalAuth, authorize, protectRoute } = require('./auth.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  protectRoute,
  errorHandler,
};
