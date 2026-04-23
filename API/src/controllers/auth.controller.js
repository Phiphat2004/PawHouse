const authService = require("../services/auth.service");
const cloudinary = require("cloudinary").v2;
const config = require("../config");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    const result = await authService.login(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    if (req.file && req.file.buffer) {
      // Upload buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "pawhouse/avatars" },
          (error, data) => {
            if (error) return reject(error);
            resolve(data);
          },
        );
        stream.end(req.file.buffer);
      });

      if (result && result.secure_url) {
        req.body.avatarUrl = result.secure_url;
      }
    }

    const result = await authService.updateProfile(req.user, req.body);
    res.json({ message: "Cập nhật thông tin thành công", ...result });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const logoutAllDevices = req.body?.logoutAllDevices === true;
    const result = await authService.logout(req.user, token, logoutAllDevices);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyResetOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const googleRegister = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    const result = await authService.googleRegister(req.body, deviceInfo);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    const result = await authService.googleLogin(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    const result = await authService.googleAuth(req.body, deviceInfo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const result = await authService.getActiveSessions(req.user._id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await authService.revokeSession(req.user._id, sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    const result = await authService.selfDeleteAccount(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleRegister,
  googleLogin,
  googleAuth,
  getActiveSessions,
  revokeSession,
  changePassword,
  deleteMe,
};
