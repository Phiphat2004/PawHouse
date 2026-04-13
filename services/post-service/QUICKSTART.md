# Post Service - Quick Start

## ✅ Đã hoàn thành

Post Service đã được tạo thành công với đầy đủ chức năng theo mô hình microservice!

## 📂 Cấu trúc

```
services/post-service/
├── .env                              # Environment variables
├── .env.example                      # Template for env
├── .gitignore                        # Git ignore rules
├── package.json                      # Dependencies
├── README.md                         # Tài liệu tổng quan
├── POST-SERVICE-GUIDE.md            # Hướng dẫn API chi tiết
└── src/
    ├── config/
    │   └── index.js                 # Cấu hình (port, mongo, jwt, cloudinary)
    ├── controllers/
    │   ├── post.controller.js       # Logic xử lý posts
    │   └── tag.controller.js        # Logic xử lý tags
    ├── middlewares/
    │   ├── auth.middleware.js       # JWT authentication
    │   ├── error.middleware.js      # Error handling
    │   └── index.js                 # Export middlewares
    ├── models/
    │   ├── Post.js                  # Post schema
    │   ├── Tag.js                   # Tag schema
    │   ├── User.js                  # User reference
    │   └── index.js                 # Export models
    ├── routes/
    │   ├── post.routes.js           # Post routes + validation
    │   └── tag.routes.js            # Tag routes + validation
    ├── services/
    │   ├── post.service.js          # Helper functions (slug, trending, etc)
    │   └── cloudinary.service.js    # Image upload service
    └── index.js                     # Main entry point
```

## 🚀 Chạy Service

### 1. Cấu hình môi trường

Chỉnh sửa file `.env`:

```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/pawcare_post
JWT_SECRET=pawhouse_dev_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Chạy service

Development mode (với nodemon):
```bash
cd services/post-service
npm run dev
```

Production mode:
```bash
npm start
```

### 3. Test

Health check:
```bash
curl http://localhost:5003/api/health
```

Database test:
```bash
curl http://localhost:5003/api/test
```

## 🎯 Tính năng chính

### Posts
- ✅ Tạo, xem, cập nhật, xóa bài viết
- ✅ User tạo draft, admin publish
- ✅ Slug tự động từ tiêu đề
- ✅ Full-text search
- ✅ Pagination
- ✅ Filter theo status, author, tag
- ✅ View count tracking

### Tags
- ✅ Quản lý tags (CRUD)
- ✅ Lấy bài viết theo tag
- ✅ Slug tự động
- ✅ Post count tracking

### Authentication & Authorization
- ✅ JWT token authentication
- ✅ Role-based access control (customer, admin)
- ✅ Optional auth cho public endpoints

### Image Upload
- ✅ Cloudinary integration
- ✅ Image optimization
- ✅ Auto format conversion

## 📡 API Endpoints

### Public (no auth)
- `GET /api/posts/public` - Bài viết đã publish
- `GET /api/posts/slug/:slug` - Bài viết theo slug
- `GET /api/tags` - Danh sách tags
- `GET /api/tags/:id/posts` - Bài viết theo tag

### User (authenticated)
- `POST /api/posts` - Tạo bài viết (draft)
- `GET /api/posts/my-posts` - Bài viết của mình
- `PUT /api/posts/my-posts/:id` - Sửa bài viết của mình
- `DELETE /api/posts/my-posts/:id` - Xóa bài viết của mình

### Admin
- `GET /api/posts` - Tất cả bài viết
- `PUT /api/posts/:id` - Sửa bất kỳ bài viết
- `PUT /api/posts/:id/toggle-status` - Toggle publish/draft
- `DELETE /api/posts/:id` - Xóa bất kỳ bài viết
- `GET /api/posts/stats` - Thống kê
- `POST /api/tags` - Tạo tag
- `PUT /api/tags/:id` - Sửa tag
- `DELETE /api/tags/:id` - Xóa tag

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Image Upload**: Cloudinary
- **Dev Tools**: nodemon

## 📝 Database Models

### Post
```javascript
{
  title: String,              // Tiêu đề
  slug: String,               // URL slug (unique)
  excerpt: String,            // Tóm tắt
  content: String,            // Nội dung
  coverImageUrl: String,      // Ảnh cover
  status: String,             // draft/published/hidden
  publishedAt: Date,          // Thời gian publish
  authorId: ObjectId,         // User ID
  tagIds: [ObjectId],         // Tag IDs
  viewCount: Number,          // Lượt xem
  likeCount: Number           // Lượt thích
}
```

### Tag
```javascript
{
  name: String,               // Tên tag
  slug: String,               // URL slug (unique)
  description: String,        // Mô tả
  postCount: Number           // Số bài viết
}
```

## 🔐 Security

- JWT token validation
- Role-based access control
- Input validation với express-validator
- MongoDB injection prevention (Mongoose)
- Error handling không expose sensitive info

## 🎨 Code Style

- ✅ Theo chuẩn microservice architecture
- ✅ Separation of concerns (routes, controllers, services, models)
- ✅ Centralized error handling
- ✅ Validation middleware
- ✅ Async/await cho database operations
- ✅ Proper HTTP status codes
- ✅ Vietnamese error messages

## 📚 Documentation

- `README.md` - Tổng quan và hướng dẫn cài đặt
- `POST-SERVICE-GUIDE.md` - API documentation chi tiết với examples

## 🔗 Integration

Service này hoạt động độc lập nhưng cần:
- **auth-service** (port 5001) để xác thực JWT
- **MongoDB** để lưu trữ data
- **Cloudinary** (optional) để upload ảnh

## ✨ Best Practices

1. ✅ Follows product-service và auth-service patterns
2. ✅ Consistent error handling
3. ✅ Proper validation
4. ✅ Database indexing cho performance
5. ✅ Graceful shutdown
6. ✅ Health check endpoints
7. ✅ Environment-based configuration
8. ✅ TypeScript-ready structure (có thể migrate sau)

## 🎉 Ready to Use!

Post Service đã sẵn sàng để:
- Chạy độc lập trên port 5003
- Kết nối với MongoDB
- Xác thực với JWT từ auth-service
- Upload ảnh với Cloudinary
- Serve API cho frontend

Chúc bạn code vui vẻ! 🚀
