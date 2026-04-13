const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Session } = require('../models');

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

    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn' });
    }

    // Kiểm tra session có active không (optional - có thể bật/tắt)
    const session = await Session.findOne({ 
      token, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (session) {
      // Update lastActivityAt để track user activity
      session.lastActivityAt = new Date();
      await session.save();
    }
    // Nếu không tìm thấy session nhưng token vẫn valid, vẫn cho phép (backward compatible)

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
