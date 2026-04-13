# PawCare API

Unified API Service cho hệ thống PawCare - dùng một port duy nhất.

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env

# 3. Run
npm run dev     # Development
npm start       # Production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin (Protected)
- `PUT /api/auth/profile` - Cập nhật profle (Protected)
- `POST /api/auth/logout` - Đăng xuất (Protected)

### Products
- `GET /api/products` - Lấy danh sách
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Tạo (Protected)
- `PUT /api/products/:id` - Cập nhật (Protected)
- `DELETE /api/products/:id` - Xóa (Protected)

### Posts
- `GET /api/posts` - Lấy danh sách
- `GET /api/posts/:id` - Chi tiết bài viết
- `POST /api/posts` - Tạo (Protected)
- `PUT /api/posts/:id` - Cập nhật (Protected)
- `DELETE /api/posts/:id` - Xóa (Protected)
- `POST /api/posts/:id/like` - Like (Protected)
- `POST /api/posts/:id/comment` - Bình luận (Protected)

### Orders
- `POST /api/orders` - Tạo đơn (Protected)
- `GET /api/orders` - Danh sách đơn hàng (Protected)
- `GET /api/orders/:id` - Chi tiết đơn hàng (Protected)
- `DELETE /api/orders/:id` - Hủy đơn (Protected)

## Structure

```
src/
├── config/              # Configuration
├── controllers/         # Request handlers
├── middlewares/         # Auth, error handling
├── models/              # MongoDB schemas
├── routes/              # API routes
└── index.js             # Entry point
```

## Technologies

- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt for passwords
