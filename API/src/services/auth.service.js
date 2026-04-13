const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const {
  User,
  EmailVerificationOtp,
  PasswordResetOtp,
  Session,
} = require("../models");
const { sendOtpEmail } = require("./email.service");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Helper để extract device info từ user-agent và IP
function extractDeviceInfo(userAgent, ip) {
  const ua = userAgent || "";
  let device = "Unknown";
  let browser = "Unknown";
  let os = "Unknown";

  // Detect OS
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "MacOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iOS|iPhone|iPad/i.test(ua)) os = "iOS";

  // Detect Browser
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  // Detect Device
  if (/Mobile|Android|iPhone/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";
  else device = "Desktop";

  return { userAgent: ua, ip: ip || "Unknown", device, browser, os };
}

// ==================== REGISTER ====================
async function register({ fullName, email, password }) {
  if (!email || !password) {
    throw { status: 400, message: "Email và mật khẩu là bắt buộc" };
  }
  if (password.length < 6) {
    throw { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser?.isVerified) {
    throw { status: 409, message: "Email đã được đăng ký" };
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  if (existingUser) {
    existingUser.passwordHash = passwordHash;
    existingUser.profile.fullName = fullName || existingUser.profile.fullName;
    await existingUser.save();
  } else {
    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      isVerified: false,
      tokenVersion: 0,
      roles: ["customer", "admin"], // Default to admin for development
      profile: { fullName: fullName || "" },
    });
  }

  // Generate and send OTP
  await EmailVerificationOtp.deleteMany({ email: email.toLowerCase() });
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, config.bcrypt.saltRounds);
  const expiresAt = new Date(
    Date.now() + config.otp.expiresMinutes * 60 * 1000,
  );

  await EmailVerificationOtp.create({
    email: email.toLowerCase(),
    otpHash,
    expiresAt,
  });

  const emailResult = await sendOtpEmail(email, otp, "verification");

  return {
    message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.",
    email: email.toLowerCase(),
    devOtp: emailResult.devMode ? otp : undefined,
  };
}

// ==================== VERIFY OTP ====================
async function verifyOtp({ email, otp }) {
  if (!email || !otp) {
    throw { status: 400, message: "Email và mã OTP là bắt buộc" };
  }

  const otpRecord = await EmailVerificationOtp.findOne({
    email: email.toLowerCase(),
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw { status: 400, message: "Mã OTP không tồn tại hoặc đã sử dụng" };
  }
  if (otpRecord.expiresAt < new Date()) {
    throw { status: 400, message: "Mã OTP đã hết hạn" };
  }
  if (otpRecord.attempts >= config.otp.maxAttempts) {
    throw { status: 429, message: "Quá nhiều lần thử" };
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw { status: 400, message: "Mã OTP không chính xác" };
  }

  otpRecord.usedAt = new Date();
  await otpRecord.save();

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isVerified: true },
  );

  return { message: "Xác thực thành công. Bạn có thể đăng nhập." };
}

// ==================== RESEND OTP ====================
async function resendOtp({ email }) {
  if (!email) {
    throw { status: 400, message: "Email là bắt buộc" };
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw { status: 404, message: "Người dùng không tồn tại" };
  }
  if (user.isVerified) {
    throw { status: 400, message: "Tài khoản đã được xác thực" };
  }

  await EmailVerificationOtp.deleteMany({ email: email.toLowerCase() });
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, config.bcrypt.saltRounds);
  const expiresAt = new Date(
    Date.now() + config.otp.expiresMinutes * 60 * 1000,
  );

  await EmailVerificationOtp.create({
    email: email.toLowerCase(),
    otpHash,
    expiresAt,
  });
  const emailResult = await sendOtpEmail(email, otp, "verification");

  return {
    message: "Đã gửi lại mã OTP.",
    devOtp: emailResult.devMode ? otp : undefined,
  };
}

// ==================== LOGIN ====================
async function login({ email, password }, deviceInfo = {}) {
  if (!email || !password) {
    throw { status: 400, message: "Email và mật khẩu là bắt buộc" };
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw { status: 401, message: "Email hoặc mật khẩu không đúng" };
  }

  if (!user.passwordHash) {
    throw {
      status: 401,
      message:
        "Tài khoản này được tạo qua Google. Vui lòng đăng nhập bằng Google.",
    };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: "Email hoặc mật khẩu không đúng" };
  }

  if (!user.isVerified) {
    throw {
      status: 403,
      message: "Tài khoản chưa được xác thực",
      data: { needVerify: true, email: user.email },
    };
  }

  if (user.status !== "active") {
    throw { status: 403, message: "Tài khoản đã bị khóa hoặc xóa" };
  }

  const token = jwt.sign(
    {
      userId: user._id,
      tokenVersion: user.tokenVersion,
      email: user.email,
      roles: user.roles.includes("admin")
        ? user.roles
        : [...user.roles, "admin"], // Temporarily grant admin
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  // Tạo session mới và lưu thông tin device
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
  await Session.create({
    userId: user._id,
    token,
    tokenVersion: user.tokenVersion,
    deviceInfo: extractDeviceInfo(deviceInfo.userAgent, deviceInfo.ip),
    expiresAt,
    isActive: true,
  });

  return {
    message: "Đăng nhập thành công",
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.profile?.fullName || "",
      roles: user.roles,
      isAdmin: user.roles.includes("admin"),
    },
  };
}

// ==================== GET ME ====================
async function getMe(user) {
  return {
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone || "",
      profile: {
        fullName: user.profile?.fullName || "",
        avatarUrl: user.profile?.avatarUrl || "",
        gender: user.profile?.gender || "",
        dob: user.profile?.dob || null,
        address: user.profile?.address || {},
      },
      roles: user.roles,
      isAdmin: user.roles.includes("admin"),
      settings: user.settings || {},
      createdAt: user.createdAt,
    },
  };
}

// ==================== UPDATE PROFILE ====================
async function updateProfile(user, updateData) {
  const { fullName, phone, gender, dob, address, settings, avatarUrl } =
    updateData;

  if (phone) {
    const existingPhone = await User.findOne({
      phone: phone.trim(),
      _id: { $ne: user._id },
    });
    if (existingPhone) {
      throw { status: 409, message: "Số điện thoại đã được sử dụng" };
    }
    user.phone = phone.trim();
  }

  if (fullName !== undefined) user.profile.fullName = fullName.trim();
  if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;
  if (gender !== undefined) user.profile.gender = gender || undefined;
  if (dob !== undefined) user.profile.dob = dob ? new Date(dob) : undefined;
  if (address !== undefined) {
    user.profile.address = {
      city: address.city?.trim() || "",
      district: address.district?.trim() || "",
      ward: address.ward?.trim() || "",
      addressLine: address.addressLine?.trim() || "",
    };
  }
  if (settings !== undefined) {
    if (typeof settings.marketingEmail === "boolean")
      user.settings.marketingEmail = settings.marketingEmail;
    if (typeof settings.pushNotification === "boolean")
      user.settings.pushNotification = settings.pushNotification;
  }

  await user.save();
  return getMe(user);
}

// ==================== LOGOUT ====================
async function logout(user, token, logoutAllDevices = false) {
  try {
    if (logoutAllDevices) {
      // Logout khỏi tất cả các thiết bị
      await Session.invalidateAllUserSessions(user._id);

      // Tăng tokenVersion để invalidate tất cả tokens hiện tại
      user.tokenVersion += 1;
      await user.save();

      return {
        message: "Đã đăng xuất khỏi tất cả thiết bị",
        loggedOutDevices: "all",
      };
    } else {
      // Logout chỉ thiết bị hiện tại
      const session = await Session.findOne({ token, isActive: true });
      if (session) {
        await session.invalidate();
      }

      return {
        message: "Đăng xuất thành công",
        loggedOutDevices: "current",
      };
    }
  } catch (error) {
    console.error("[Logout Error]", error);
    // Vẫn trả về success để đảm bảo user được logout
    return { message: "Đăng xuất thành công" };
  }
}

// ==================== GET ACTIVE SESSIONS ====================
async function getActiveSessions(userId) {
  const sessions = await Session.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActivityAt: -1 })
    .select("deviceInfo createdAt lastActivityAt");

  return {
    sessions: sessions.map((s) => ({
      id: s._id,
      device: s.deviceInfo?.device || "Unknown",
      browser: s.deviceInfo?.browser || "Unknown",
      os: s.deviceInfo?.os || "Unknown",
      ip: s.deviceInfo?.ip || "Unknown",
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
    })),
  };
}

// ==================== REVOKE SESSION ====================
async function revokeSession(userId, sessionId) {
  const session = await Session.findOne({
    _id: sessionId,
    userId,
    isActive: true,
  });
  if (!session) {
    throw { status: 404, message: "Session không tồn tại" };
  }

  await session.invalidate();
  return { message: "Đã thu hồi session thành công" };
}

// ==================== FORGOT PASSWORD ====================
async function forgotPassword({ email }) {
  if (!email) {
    throw { status: 400, message: "Email là bắt buộc" };
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw { status: 404, message: "Email không tồn tại trong hệ thống" };
  }
  if (!user.isVerified) {
    throw { status: 400, message: "Tài khoản chưa được xác thực" };
  }

  await PasswordResetOtp.deleteMany({ email: email.toLowerCase() });
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, config.bcrypt.saltRounds);
  const expiresAt = new Date(
    Date.now() + config.otp.expiresMinutes * 60 * 1000,
  );

  await PasswordResetOtp.create({
    email: email.toLowerCase(),
    otpHash,
    expiresAt,
  });
  const emailResult = await sendOtpEmail(email, otp, "reset");

  return {
    message: "Mã OTP đã được gửi đến email của bạn.",
    email: email.toLowerCase(),
    devOtp: emailResult.devMode ? otp : undefined,
  };
}

// ==================== VERIFY RESET OTP ====================
async function verifyResetOtp({ email, otp }) {
  if (!email || !otp) {
    throw { status: 400, message: "Email và mã OTP là bắt buộc" };
  }

  const otpRecord = await PasswordResetOtp.findOne({
    email: email.toLowerCase(),
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw { status: 400, message: "Mã OTP không tồn tại hoặc đã sử dụng" };
  }
  if (otpRecord.expiresAt < new Date()) {
    throw { status: 400, message: "Mã OTP đã hết hạn" };
  }
  if (otpRecord.attempts >= config.otp.maxAttempts) {
    throw { status: 429, message: "Quá nhiều lần thử" };
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw { status: 400, message: "Mã OTP không chính xác" };
  }

  otpRecord.usedAt = new Date();
  await otpRecord.save();

  const resetToken = jwt.sign(
    { email: email.toLowerCase(), purpose: "password-reset" },
    config.jwt.secret,
    { expiresIn: "10m" },
  );

  return { message: "Xác thực OTP thành công.", resetToken };
}

// ==================== RESET PASSWORD ====================
async function resetPassword({ resetToken, newPassword }) {
  if (!resetToken || !newPassword) {
    throw { status: 400, message: "Token và mật khẩu mới là bắt buộc" };
  }
  if (newPassword.length < 6) {
    throw { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, config.jwt.secret);
  } catch {
    throw { status: 400, message: "Token không hợp lệ hoặc đã hết hạn" };
  }

  if (decoded.purpose !== "password-reset") {
    throw { status: 400, message: "Token không hợp lệ" };
  }

  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    throw { status: 404, message: "Người dùng không tồn tại" };
  }

  user.passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  user.tokenVersion += 1;
  await user.save();

  return { message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." };
}

// ==================== GOOGLE AUTH ====================
// Unified Google Auth - Auto-register nếu chưa có tài khoản
async function googleAuth({ userInfo }, deviceInfo = {}) {
  if (!userInfo?.email) {
    throw { status: 400, message: "Không thể lấy email từ Google" };
  }

  // Check if user exists
  let user = await User.findOne({ email: userInfo.email.toLowerCase() });
  let isNewUser = false;

  if (!user) {
    // Auto-create new user
    user = await User.create({
      email: userInfo.email.toLowerCase(),
      isVerified: true,
      authProvider: "google",
      status: "active",
      tokenVersion: 0,
      roles: ["customer"],
      profile: {
        fullName: userInfo.name || "",
        avatarUrl: userInfo.picture || "",
      },
    });
    isNewUser = true;
  } else {
    // User exists - check status
    if (user.status !== "active") {
      throw { status: 403, message: "Tài khoản đã bị khóa hoặc xóa" };
    }

    // Update avatar from Google if user doesn't have one
    if (userInfo.picture && !user.profile.avatarUrl) {
      user.profile.avatarUrl = userInfo.picture;
      await user.save();
    }
  }

  // Generate token
  const token = jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  // Create session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await Session.create({
    userId: user._id,
    token,
    tokenVersion: user.tokenVersion,
    deviceInfo: extractDeviceInfo(deviceInfo.userAgent, deviceInfo.ip),
    expiresAt,
    isActive: true,
  });

  return {
    message: isNewUser ? "Đăng ký thành công" : "Đăng nhập thành công",
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.profile?.fullName || "",
      roles: user.roles,
      isAdmin: user.roles.includes("admin"),
    },
    isNewUser,
  };
}

// @deprecated Use googleAuth() instead for better UX
async function googleRegister({ userInfo }, deviceInfo = {}) {
  if (!userInfo?.email) {
    throw { status: 400, message: "Không thể lấy email từ Google" };
  }

  const existingUser = await User.findOne({
    email: userInfo.email.toLowerCase(),
  });
  if (existingUser) {
    throw {
      status: 409,
      message: "Email đã được đăng ký. Vui lòng đăng nhập.",
    };
  }

  const user = await User.create({
    email: userInfo.email.toLowerCase(),
    isVerified: true,
    authProvider: "google",
    status: "active",
    tokenVersion: 0,
    roles: ["customer"],
    profile: {
      fullName: userInfo.name || "",
      avatarUrl: userInfo.picture || "",
    },
  });

  const token = jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  // Tạo session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
  await Session.create({
    userId: user._id,
    token,
    tokenVersion: user.tokenVersion,
    deviceInfo: extractDeviceInfo(deviceInfo.userAgent, deviceInfo.ip),
    expiresAt,
    isActive: true,
  });

  return {
    message: "Đăng ký Google thành công",
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.profile?.fullName || "",
      roles: user.roles,
      isAdmin: false,
    },
  };
}

// @deprecated Use googleAuth() instead for better UX
async function googleLogin({ userInfo }, deviceInfo = {}) {
  if (!userInfo?.email) {
    throw { status: 400, message: "Không thể lấy email từ Google" };
  }

  const user = await User.findOne({ email: userInfo.email.toLowerCase() });
  if (!user) {
    throw {
      status: 404,
      message: "Tài khoản chưa được đăng ký. Vui lòng đăng ký trước.",
    };
  }
  if (user.status !== "active") {
    throw { status: 403, message: "Tài khoản đã bị khóa hoặc xóa" };
  }

  const token = jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  // Tạo session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
  await Session.create({
    userId: user._id,
    token,
    tokenVersion: user.tokenVersion,
    deviceInfo: extractDeviceInfo(deviceInfo.userAgent, deviceInfo.ip),
    expiresAt,
    isActive: true,
  });

  return {
    message: "Đăng nhập Google thành công",
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.profile?.fullName || "",
      roles: user.roles,
      isAdmin: user.roles.includes("admin"),
    },
  };
}

// ==================== CHANGE PASSWORD ====================
async function changePassword(userId, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    throw { status: 400, message: "Mật khẩu cũ và mật khẩu mới là bắt buộc" };
  }

  if (newPassword.length < 6) {
    throw { status: 400, message: "Mật khẩu mới tối thiểu 6 ký tự" };
  }

  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: "Người dùng không tồn tại" };
  }

  if (!user.passwordHash) {
    throw {
      status: 400,
      message: "Tài khoản này không có mật khẩu. Vui lòng đặt mật khẩu trước.",
    };
  }

  // Kiểm tra mật khẩu cũ
  const isOldPasswordValid = await bcrypt.compare(
    oldPassword,
    user.passwordHash,
  );
  if (!isOldPasswordValid) {
    throw { status: 400, message: "Mật khẩu cũ không đúng" };
  }

  // Kiểm tra mật khẩu mới khác mật khẩu cũ
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw { status: 400, message: "Mật khẩu mới phải khác mật khẩu cũ" };
  }

  // Hash mật khẩu mới và cập nhật
  user.passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  user.tokenVersion += 1; // Invalidate old tokens
  await user.save();

  return { message: "Đổi mật khẩu thành công" };
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
  logout,
  getActiveSessions,
  revokeSession,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword, // NEW
  googleAuth, // NEW - Recommended
  googleRegister, // Legacy - deprecated
  googleLogin, // Legacy - deprecated
};
