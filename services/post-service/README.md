# Post Service - PawCare

Microservice quản lý bài viết và tags cho hệ thống PawCare.

## 🚀 Tính năng

- Quản lý bài viết (posts): tạo, xem, cập nhật, xóa
- Quản lý tags
- Phân quyền (user có thể tạo draft, admin có thể publish)
- Upload ảnh với Cloudinary
- Tìm kiếm full-text
- Pagination
- Slug tự động

## 📋 Yêu cầu

- Node.js >= 16
- MongoDB >= 5.0
- Cloudinary account (cho upload ảnh)

## 🔧 Cài đặt

1. **Cài đặt dependencies:**

```bash
cd services/post-service
npm install
```

2. **Cấu hình môi trường:**

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/pawcare_post
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Chạy service:**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📡 API Endpoints

### Posts

#### Public Endpoints (không cần authentication)

- `GET /api/posts/public` - Lấy danh sách bài viết đã publish
  - Query params: `page`, `limit`, `search`, `tagId`
  
- `GET /api/posts/slug/:slug` - Lấy bài viết theo slug

#### User Endpoints (cần authentication)

- `POST /api/posts` - Tạo bài viết mới (tạo draft)
  - Body: `{ title, content, excerpt?, coverImageUrl?, tagIds? }`
  
- `GET /api/posts/my-posts` - Lấy bài viết của user hiện tại
  - Query params: `page`, `limit`, `status`
  
- `PUT /api/posts/my-posts/:id` - Cập nhật bài viết của mình
  - Body: `{ title?, content?, excerpt?, coverImageUrl?, tagIds? }`
  
- `DELETE /api/posts/my-posts/:id` - Xóa bài viết của mình

#### Admin Endpoints

- `GET /api/posts` - Lấy tất cả bài viết
  - Query params: `page`, `limit`, `search`, `status`, `authorId`, `tagId`
  
- `GET /api/posts/:id` - Lấy bài viết theo ID
  
- `PUT /api/posts/:id` - Cập nhật bài viết (admin có thể publish)
  - Body: `{ title?, content?, excerpt?, coverImageUrl?, status?, tagIds? }`
  
- `PUT /api/posts/:id/toggle-status` - Toggle trạng thái publish/draft
  
- `DELETE /api/posts/:id` - Xóa bài viết
  
- `GET /api/posts/stats` - Lấy thống kê bài viết

### Tags

#### Public Endpoints

- `GET /api/tags` - Lấy danh sách tags
  - Query params: `page`, `limit`, `search`
  
- `GET /api/tags/:id` - Lấy tag theo ID
  
- `GET /api/tags/slug/:slug` - Lấy tag theo slug
  
- `GET /api/tags/:id/posts` - Lấy bài viết theo tag
  - Query params: `page`, `limit`

#### Admin Endpoints

- `POST /api/tags` - Tạo tag mới
  - Body: `{ name, slug?, description? }`
  
- `PUT /api/tags/:id` - Cập nhật tag
  - Body: `{ name?, slug?, description? }`
  
- `DELETE /api/tags/:id` - Xóa tag

### Utilities

- `GET /api/health` - Health check
- `GET /api/test` - Test database connection

## 🔐 Authentication

Service sử dụng JWT token từ auth-service. Token được gửi trong header:

```
Authorization: Bearer <token>
```

Token phải chứa:
- `userId`: ID của user
- `email`: Email của user
- `roles`: Array roles (ví dụ: `['customer']`, `['admin']`)

## 🗂️ Cấu trúc thư mục

```
src/
├── config/           # Cấu hình
│   └── index.js
├── controllers/      # Controllers (business logic)
│   ├── post.controller.js
│   └── tag.controller.js
├── middlewares/      # Middlewares (auth, error handling)
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── index.js
├── models/          # MongoDB models
│   ├── Post.js
│   ├── Tag.js
│   ├── User.js
│   └── index.js
├── routes/          # Route definitions
│   ├── post.routes.js
│   └── tag.routes.js
├── services/        # Helper services
│   ├── post.service.js
│   └── cloudinary.service.js
└── index.js         # Entry point
```

## 📊 Database Schema

### Post

```javascript
{
  title: String,              // Tiêu đề bài viết
  slug: String,               // URL-friendly slug (unique)
  excerpt: String,            // Tóm tắt ngắn
  content: String,            // Nội dung đầy đủ
  coverImageUrl: String,      // URL ảnh cover
  status: String,             // draft, published, hidden
  publishedAt: Date,          // Thời điểm publish
  authorId: ObjectId,         // Reference to User
  tagIds: [ObjectId],         // References to Tags
  viewCount: Number,          // Số lượt xem
  likeCount: Number,          // Số lượt thích
  createdAt: Date,
  updatedAt: Date
}
```

### Tag

```javascript
{
  name: String,               // Tên tag
  slug: String,               // URL-friendly slug (unique)
  description: String,        // Mô tả
  postCount: Number,          // Số bài viết
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Workflow

### User tạo bài viết

1. User gọi `POST /api/posts` với thông tin bài viết
2. System tạo bài viết với status = 'draft'
3. Slug được tự động generate từ title
4. Admin có thể review và publish bài viết

### Admin publish bài viết

1. Admin gọi `PUT /api/posts/:id` hoặc `PUT /api/posts/:id/toggle-status`
2. Status được đổi thành 'published'
3. `publishedAt` được set = thời điểm hiện tại
4. Bài viết hiển thị ở endpoint public

## 🧪 Testing

Test health endpoint:
```bash
curl http://localhost:5003/api/health
```

Test database connection:
```bash
curl http://localhost:5003/api/test
```

## 🚨 Error Handling

Service sử dụng centralized error handling với các HTTP status codes chuẩn:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (không có token hoặc token không hợp lệ)
- `403` - Forbidden (không có quyền)
- `404` - Not Found
- `409` - Conflict (duplicate slug, etc.)
- `500` - Internal Server Error

## 📝 Notes

- User chỉ có thể tạo draft, admin mới có thể publish
- User chỉ có thể sửa/xóa bài viết của mình
- Admin có thể quản lý tất cả bài viết
- Slug tự động được generate, có đảm bảo unique
- Text search được index trên title, excerpt, content
- Cloudinary được dùng để upload ảnh cover

## 🔗 Related Services

- **auth-service** (port 5001): Xác thực và quản lý user
- **product-service** (port 5002): Quản lý sản phẩm

## 👥 Maintainers

PawCare Development Team
