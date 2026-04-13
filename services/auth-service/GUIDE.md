# Auth-Service - Hướng Dẫn Chi Tiết

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Cấu Trúc Thư Mục](#2-cấu-trúc-thư-mục)
3. [Giải Thích Từng File](#3-giải-thích-từng-file)
4. [Luồng Hoạt Động](#4-luồng-hoạt-động)
5. [API Endpoints](#5-api-endpoints)
6. [Cách Chạy](#6-cách-chạy)
7. [Tích Hợp Với Frontend](#7-tích-hợp-với-frontend)

---

## 1. Tổng Quan

### Auth-Service là gì?
Auth-Service là một microservice độc lập xử lý toàn bộ chức năng xác thực (authentication) cho hệ thống PawCare/PawHouse.

### Đặc điểm:
- **Port**: 5001
- **Database**: Dùng chung MongoDB với backend (`pawcare`)
- **JWT Secret**: Giống backend (để token tương thích)
- **Pattern**: MVC + Service Layer

### Kiến trúc tổng quan:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │Auth-Service │     │   Backend   │
│  (port 5173)│     │ (port 5001) │     │ (port 5000) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  /api/auth/*      │                   │
       │──────────────────►│                   │
       │                   │                   │
       │  /api/* (other)   │                   │
       │───────────────────────────────────────►
       │                   │                   │
       │                   ▼                   ▼
       │            ┌─────────────────────────────┐
       │            │         MongoDB             │
       │            │    (pawcare database)       │
       │            └─────────────────────────────┘
```

---

## 2. Cấu Trúc Thư Mục

```
auth-service/
├── src/
│   ├── config/
│   │   └── index.js          # Cấu hình (port, DB, JWT, email)
│   │
│   ├── controllers/
│   │   └── auth.controller.js # Nhận request, gọi service, trả response
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js # Xác thực JWT token
│   │   └── error.middleware.js# Xử lý lỗi tập trung
│   │
│   ├── models/
│   │   ├── User.js            # Schema User
│   │   ├── EmailVerificationOtp.js
│   │   ├── PasswordResetOtp.js
│   │   └── index.js           # Export tất cả models
│   │
│   ├── routes/
│   │   └── auth.routes.js     # Định nghĩa endpoints
│   │
│   ├── services/
│   │   ├── auth.service.js    # Business logic chính
│   │   └── email.service.js   # Gửi email OTP
│   │
│   └── index.js               # Entry point - khởi động server
│
├── .env                       # Biến môi trường
├── .env.example               # Template
├── package.json
└── README.md
```

---

## 3. Giải Thích Từng File

### 3.1 `src/index.js` - Entry Point
```javascript
// Khởi động server
// 1. Kết nối MongoDB
// 2. Setup Express middleware (cors, json)
// 3. Mount routes
// 4. Start listening on port 5001
```

**Vai trò**: Điểm khởi đầu của ứng dụng.

---

### 3.2 `src/config/index.js` - Cấu Hình
```javascript
module.exports = {
  port: 5001,
  mongoUri: 'mongodb://localhost:27017/pawcare',
  jwt: { secret: '...', expiresIn: '7d' },
  otp: { expiresMinutes: 5, maxAttempts: 5 },
  // ...
};
```

**Vai trò**: Tập trung tất cả cấu hình, dễ thay đổi.

---

### 3.3 `src/models/` - Database Schemas

#### User.js
```javascript
const userSchema = {
  email: String,           // Email đăng nhập
  passwordHash: String,    // Mật khẩu đã hash
  isVerified: Boolean,     // Đã xác thực OTP chưa
  tokenVersion: Number,    // Tăng khi logout (invalidate tokens)
  status: 'active'|'banned'|'deleted',
  roles: ['customer'|'admin'|'staff'],
  profile: { fullName, avatarUrl, gender, dob, address }
};
```

#### EmailVerificationOtp.js
```javascript
const otpSchema = {
  email: String,      // Email
  otpHash: String,    // OTP đã hash (bảo mật)
  expiresAt: Date,    // Thời gian hết hạn
  attempts: Number,   // Số lần thử sai
  usedAt: Date        // Đã sử dụng chưa
};
```

---

### 3.4 `src/services/auth.service.js` - Business Logic

**Đây là file QUAN TRỌNG NHẤT**, chứa toàn bộ logic nghiệp vụ:

| Function | Mô tả |
|----------|-------|
| `register()` | Đăng ký user mới, gửi OTP |
| `verifyOtp()` | Xác thực OTP, set isVerified = true |
| `resendOtp()` | Gửi lại OTP |
| `login()` | Đăng nhập, trả về JWT token |
| `getMe()` | Lấy thông tin user hiện tại |
| `updateProfile()` | Cập nhật profile |
| `logout()` | Đăng xuất (tăng tokenVersion) |
| `forgotPassword()` | Gửi OTP reset password |
| `verifyResetOtp()` | Xác thực OTP reset |
| `resetPassword()` | Đổi mật khẩu |
| `googleRegister()` | Đăng ký bằng Google |
| `googleLogin()` | Đăng nhập bằng Google |

---

### 3.5 `src/controllers/auth.controller.js` - Request Handler

```javascript
// Controller CHỈ làm 3 việc:
exports.login = async (req, res, next) => {
  try {
    // 1. Gọi service
    const result = await authService.login(req.body);
    
    // 2. Trả response
    res.json(result);
  } catch (err) {
    // 3. Chuyển lỗi cho error handler
    next(err);
  }
};
```

**Vai trò**: Cầu nối giữa HTTP request và business logic. KHÔNG chứa logic.

---

### 3.6 `src/routes/auth.routes.js` - Routing

```javascript
// Public routes (không cần token)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (cần token)
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
```

**Vai trò**: Map URL → Controller function.

---

### 3.7 `src/middlewares/auth.middleware.js` - Xác Thực Token

```javascript
async function authenticate(req, res, next) {
  // 1. Lấy token từ header
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Verify token
  const payload = jwt.verify(token, secret);
  
  // 3. Tìm user
  const user = await User.findById(payload.userId);
  
  // 4. Kiểm tra tokenVersion (đã logout chưa)
  if (user.tokenVersion !== payload.tokenVersion) {
    throw Error('Token expired');
  }
  
  // 5. Gắn user vào request
  req.user = user;
  next();
}
```

---

## 4. Luồng Hoạt Động

### 4.1 Luồng Đăng Ký (Register)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           LUỒNG ĐĂNG KÝ                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User nhập email + password                                              │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Frontend     │  POST /api/auth/register                            │
│  │                 │  { email, password, fullName }                      │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │     Routes      │  router.post('/register', controller.register)      │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │   Controller    │  Gọi authService.register(req.body)                 │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Service      │                                                     │
│  │                 │  1. Kiểm tra email đã tồn tại?                      │
│  │                 │  2. Hash password với bcrypt                        │
│  │                 │  3. Tạo user mới (isVerified = false)               │
│  │                 │  4. Tạo OTP 6 số                                    │
│  │                 │  5. Hash OTP và lưu vào EmailVerificationOtp        │
│  │                 │  6. Gửi email chứa OTP                              │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    MongoDB      │  users.insert(), emailverificationotps.insert()     │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  Response: { message: "Đăng ký thành công", email, devOtp? }             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Luồng Xác Thực OTP (Verify OTP)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         LUỒNG XÁC THỰC OTP                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User nhập OTP từ email                                                  │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Frontend     │  POST /api/auth/verify-otp                          │
│  │                 │  { email, otp: "123456" }                           │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Service      │                                                     │
│  │                 │  1. Tìm OTP record theo email (chưa dùng)           │
│  │                 │  2. Kiểm tra hết hạn? (5 phút)                      │
│  │                 │  3. Kiểm tra số lần thử? (max 5)                    │
│  │                 │  4. So sánh OTP với bcrypt.compare()                │
│  │                 │  5. Nếu đúng: đánh dấu OTP đã dùng                  │
│  │                 │  6. Cập nhật user.isVerified = true                 │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  Response: { message: "Xác thực thành công" }                            │
│                                                                          │
│  ❌ Nếu OTP sai: tăng attempts, trả lỗi                                  │
│  ❌ Nếu hết hạn: trả lỗi "OTP đã hết hạn"                                │
│  ❌ Nếu quá 5 lần: trả lỗi "Quá nhiều lần thử"                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Luồng Đăng Nhập (Login)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          LUỒNG ĐĂNG NHẬP                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User nhập email + password                                              │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Frontend     │  POST /api/auth/login                               │
│  │                 │  { email, password }                                │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Service      │                                                     │
│  │                 │  1. Tìm user theo email                             │
│  │                 │  2. So sánh password với bcrypt                     │
│  │                 │  3. Kiểm tra isVerified == true?                    │
│  │                 │  4. Kiểm tra status == 'active'?                    │
│  │                 │  5. Tạo JWT token chứa { userId, tokenVersion }     │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  Response: {                                                             │
│    message: "Đăng nhập thành công",                                      │
│    token: "eyJhbGciOiJIUzI1NiIs...",                                     │
│    user: { id, email, fullName, roles, isAdmin }                         │
│  }                                                                       │
│                                                                          │
│  Frontend lưu token vào localStorage.setItem('pawhouse_token', token)    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Luồng Truy Cập Protected Route (VD: /me)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LUỒNG TRUY CẬP PROTECTED ROUTE                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                     │
│  │    Frontend     │  GET /api/auth/me                                   │
│  │                 │  Headers: { Authorization: "Bearer <token>" }       │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │   Middleware    │  authenticate()                                     │
│  │                 │                                                     │
│  │                 │  1. Lấy token từ header                             │
│  │                 │  2. jwt.verify(token, secret)                       │
│  │                 │  3. Tìm user theo payload.userId                    │
│  │                 │  4. Kiểm tra tokenVersion khớp?                     │
│  │                 │  5. req.user = user                                 │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼ (nếu OK)                                                     │
│  ┌─────────────────┐                                                     │
│  │   Controller    │  authController.getMe(req, res)                     │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Service      │  return req.user với format chuẩn                   │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  Response: {                                                             │
│    user: { id, email, phone, profile, roles, isAdmin, settings }         │
│  }                                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Luồng Đăng Xuất (Logout)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          LUỒNG ĐĂNG XUẤT                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                     │
│  │    Frontend     │  POST /api/auth/logout                              │
│  │                 │  Headers: { Authorization: "Bearer <token>" }       │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │   Middleware    │  authenticate() → req.user                          │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │    Service      │                                                     │
│  │                 │  user.tokenVersion += 1                             │
│  │                 │  user.save()                                        │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  Response: { message: "Đăng xuất thành công" }                           │
│                                                                          │
│  ⚡ Sau khi tokenVersion tăng, TẤT CẢ tokens cũ sẽ INVALID               │
│     vì payload.tokenVersion !== user.tokenVersion                        │
│                                                                          │
│  Frontend: localStorage.removeItem('pawhouse_token')                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Luồng Reset Password

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       LUỒNG RESET PASSWORD                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BƯỚC 1: Yêu cầu reset                                                   │
│  ─────────────────────                                                   │
│  POST /api/auth/forgot-password { email }                                │
│           │                                                              │
│           ▼                                                              │
│  Service: Tạo OTP → Gửi email                                            │
│           │                                                              │
│           ▼                                                              │
│  Response: { message: "OTP đã gửi", devOtp? }                            │
│                                                                          │
│                                                                          │
│  BƯỚC 2: Xác thực OTP                                                    │
│  ────────────────────                                                    │
│  POST /api/auth/verify-reset-otp { email, otp }                          │
│           │                                                              │
│           ▼                                                              │
│  Service: Verify OTP → Tạo resetToken (JWT, 10 phút)                     │
│           │                                                              │
│           ▼                                                              │
│  Response: { resetToken: "eyJ..." }                                      │
│                                                                          │
│                                                                          │
│  BƯỚC 3: Đổi mật khẩu                                                    │
│  ────────────────────                                                    │
│  POST /api/auth/reset-password { resetToken, newPassword }               │
│           │                                                              │
│           ▼                                                              │
│  Service:                                                                │
│    1. Verify resetToken                                                  │
│    2. Hash newPassword                                                   │
│    3. Update user.passwordHash                                           │
│    4. Tăng tokenVersion (logout tất cả devices)                          │
│           │                                                              │
│           ▼                                                              │
│  Response: { message: "Đổi mật khẩu thành công" }                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoints

### Public Endpoints (không cần token)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ email, password, fullName? }` | `{ message, email, devOtp? }` |
| POST | `/api/auth/verify-otp` | `{ email, otp }` | `{ message }` |
| POST | `/api/auth/resend-otp` | `{ email }` | `{ message, devOtp? }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ message, token, user }` |
| POST | `/api/auth/forgot-password` | `{ email }` | `{ message, email, devOtp? }` |
| POST | `/api/auth/verify-reset-otp` | `{ email, otp }` | `{ message, resetToken }` |
| POST | `/api/auth/reset-password` | `{ resetToken, newPassword }` | `{ message }` |
| POST | `/api/auth/google/register` | `{ userInfo }` | `{ message, token, user }` |
| POST | `/api/auth/google/login` | `{ userInfo }` | `{ message, token, user }` |

### Protected Endpoints (cần token)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/auth/me` | - | `{ user }` |
| PUT | `/api/auth/profile` | `{ fullName?, phone?, ... }` | `{ message, user }` |
| POST | `/api/auth/logout` | - | `{ message }` |

---

## 6. Cách Chạy

### 6.1 Cài đặt
```bash
cd D:\PawCare\services\auth-service
npm install
```

### 6.2 Cấu hình
File `.env` đã được tạo sẵn với config giống backend.

### 6.3 Chạy development
```bash
npm run dev
```

### 6.4 Chạy production
```bash
npm start
```

### 6.5 Chạy cả hệ thống (3 terminals)

```bash
# Terminal 1 - Backend
cd D:\PawCare\backend && npm run dev

# Terminal 2 - Auth Service
cd D:\PawCare\services\auth-service && npm run dev

# Terminal 3 - Frontend
cd D:\PawCare\frontend && npm run dev
```

---

## 7. Tích Hợp Với Frontend

### 7.1 Vite Proxy Config

File `frontend/vite.config.js`:
```javascript
proxy: {
  // Auth routes → auth-service (port 5001)
  '/api/auth': {
    target: 'http://localhost:5001',
    changeOrigin: true
  },
  // Other routes → backend (port 5000)
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

### 7.2 Frontend API calls

File `frontend/src/services/api.js`:
```javascript
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  // ...
};
```

Frontend **KHÔNG CẦN SỬA GÌ** vì:
- URL vẫn là `/api/auth/*`
- Vite proxy tự động chuyển đến đúng service

---

## Tóm Tắt

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP Request                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────┐                                                │
│  │ Routes  │  Định tuyến URL → Controller                   │
│  └────┬────┘                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │ Middleware  │  Authenticate (nếu protected route)        │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Controller  │  Nhận request, gọi service, trả response   │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Service    │  Business logic (validate, hash, query)    │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │   Models    │  Mongoose schemas & queries                │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  MongoDB    │  Database                                  │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Ưu điểm của cấu trúc này:
1. **Đơn giản** - Dễ hiểu với team 4 người
2. **Tách biệt** - Service chứa logic, Controller chỉ xử lý HTTP
3. **Dễ test** - Test service độc lập
4. **Dễ maintain** - Mỗi file có 1 nhiệm vụ rõ ràng
