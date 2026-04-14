const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Session } = require('../models');

/**
 * Middleware xác thực JWT token bắt buộc.
 * - Kiểm tra Bearer token trong header Authorization
 * - Xác minh tokenVersion để phát hiện token bị thu hồi
 * - Kiểm tra trạng thái user (status, is_banned, is_deleted)
 * - Cập nhật lastActivityAt của Session nếu có
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
    } catch (err) {
      return res.status(401).json({ error: `Token không hợp lệ hoặc đã hết hạn: ${err.message}` });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }

    // Kiểm tra trạng thái user
    if (user.status === 'banned' || user.status === 'deleted') {
      return res.status(403).json({ error: `Tài khoản đã bị ${user.status}` });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'Tài khoản đã bị khoá' });
    }
    if (user.is_deleted) {
      return res.status(403).json({ error: 'Tài khoản đã bị xoá' });
    }

    // Kiểm tra tokenVersion để phát hiện token bị thu hồi (logout toàn bộ)
    if (user.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn' });
    }

    // Cập nhật Session nếu tồn tại (không fail nếu không có)
    try {
      const session = await Session.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      if (session) {
        session.lastActivityAt = new Date();
        await session.save();
      }
    } catch (_) {
      // Session check là optional, không block request
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[AUTH] Unexpected error:', err);
    next(err);
  }
}

/**
 * Middleware xác thực không bắt buộc.
 * Dùng cho các endpoint public nhưng muốn biết user đã login chưa.
 * Nếu không có token hoặc token không hợp lệ, tiếp tục mà không gán req.user.
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
        tokenVersion: payload.tokenVersion,
      };
    } catch {
      // Invalid token — bỏ qua, tiếp tục như guest
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Middleware kiểm tra quyền dựa trên roles.
 * Phải dùng sau authenticate.
 * Usage: router.get('/admin', authenticate, authorize(['admin']), handler)
 */
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }

    if (roles.length > 0) {
      const userRoles = req.user.roles || [];
      const hasRole = roles.some(role => userRoles.includes(role));
      if (!hasRole) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
      }
    }

    next();
  };
}

/**
 * Middleware gộp authenticate + authorize thành một bước.
 * Usage: router.get('/admin', ...protectRoute(['admin']), handler)
 */
function protectRoute(allowedRoles = []) {
  return [authenticate, authorize(allowedRoles)];
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  protectRoute,
};
