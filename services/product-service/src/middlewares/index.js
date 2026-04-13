const { authenticate, protectRoute } = require('./auth.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = {
  authenticate,
  protectRoute,
  errorHandler
};
