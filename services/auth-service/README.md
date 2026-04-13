# Auth Service

Authentication microservice cho PawCare/PawHouse.

## Cấu trúc

```
auth-service/
├── src/
│   ├── config/         # Cấu hình
│   ├── controllers/    # Xử lý request/response
│   ├── middlewares/    # Auth, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Định tuyến
│   ├── services/       # Business logic
│   └── index.js        # Entry point
├── .env
└── package.json
```

## Cài đặt

```bash
cd services/auth-service
npm install
```

## Cấu hình

File `.env` đã được tạo với config giống backend.

## Chạy

```bash
npm run dev
# hoặc
npm start
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/verify-otp | Xác thực OTP |
| POST | /api/auth/resend-otp | Gửi lại OTP |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Lấy thông tin user |
| PUT | /api/auth/profile | Cập nhật profile |
| POST | /api/auth/logout | Đăng xuất |
| POST | /api/auth/forgot-password | Quên mật khẩu |
| POST | /api/auth/verify-reset-otp | Xác thực OTP reset |
| POST | /api/auth/reset-password | Đổi mật khẩu |
| POST | /api/auth/google/register | Đăng ký Google |
| POST | /api/auth/google/login | Đăng nhập Google |

## Port

- Auth service: **5001**
- Backend: **5000**
- Frontend: **5173**
