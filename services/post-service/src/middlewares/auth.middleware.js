const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware xác thực JWT token
 * Decode token và gán thông tin user vào req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Gán user info từ token vào request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || ['customer'],
      tokenVersion: payload.tokenVersion
    };

    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    res.status(401).json({ error: 'Xác thực thất bại' });
  }
}

/**
 * Middleware kiểm tra roles
 * Usage: protectRoute(['admin', 'staff'])
 */
function protectRoute(allowedRoles = []) {
  return [
    authenticate,
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Chưa xác thực' });
      }

      if (allowedRoles.length > 0) {
        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
          return res.status(403).json({ error: 'Không có quyền thực hiện' });
        }
      }

      next();
    }
  ];
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints that want to know if user is logged in
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles || ['customer'],
        tokenVersion: payload.tokenVersion
      };
    } catch {
      // Invalid token, continue without user
    }
    
    next();
  } catch (error) {
    next();
  }
}

module.exports = { 
  authenticate, 
  protectRoute,
  optionalAuth
};
