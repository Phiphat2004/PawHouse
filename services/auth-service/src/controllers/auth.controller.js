const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  } 
};

exports.login = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    const result = await authService.login(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // Handle avatar file upload
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `user_${req.user._id}_${Date.now()}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write file
      fs.writeFileSync(filepath, req.file.buffer);
      
      // Add avatarUrl to body data
      req.body.avatarUrl = `/uploads/avatars/${filename}`;
    }
    
    const result = await authService.updateProfile(req.user, req.body); 
    res.json({ message: 'Cập nhật thông tin thành công', ...result });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const logoutAllDevices = req.body?.logoutAllDevices === true;
    const result = await authService.logout(req.user, token, logoutAllDevices);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyResetOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.googleRegister = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    const result = await authService.googleRegister(req.body, deviceInfo);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    const result = await authService.googleLogin(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// NEW - Unified Google Auth (Recommended)
exports.googleAuth = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    const result = await authService.googleAuth(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getActiveSessions = async (req, res, next) => {
  try {
    const result = await authService.getActiveSessions(req.user._id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await authService.revokeSession(req.user._id, sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => { 
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
