# POST SERVICE - API GUIDE

Hướng dẫn chi tiết về các API endpoints của Post Service.

## 📑 Table of Contents

- [Authentication](#authentication)
- [Post Endpoints](#post-endpoints)
- [Tag Endpoints](#tag-endpoints)
- [Examples](#examples)
- [Error Responses](#error-responses)

---

## Authentication

### Headers

Tất cả protected endpoints yêu cầu JWT token trong header:

```http
Authorization: Bearer <your_jwt_token>
```

### Roles

- **customer**: User thông thường, có thể tạo bài viết draft
- **admin**: Admin, có thể publish và quản lý tất cả bài viết

---

## Post Endpoints

### 1. Get Published Posts (Public)

Lấy danh sách bài viết đã được publish.

**Endpoint:** `GET /api/posts/public`

**Auth:** None

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số bài viết mỗi trang (default: 20)
- `search` (optional): Từ khóa tìm kiếm
- `tagId` (optional): Filter theo tag ID

**Response:**
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Cách chăm sóc chó con",
      "slug": "cach-cham-soc-cho-con",
      "excerpt": "Hướng dẫn chi tiết...",
      "content": "...",
      "coverImageUrl": "https://cloudinary.com/...",
      "status": "published",
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "authorId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "user@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "avatarUrl": "..."
        }
      },
      "tagIds": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Chó",
          "slug": "cho"
        }
      ],
      "viewCount": 100,
      "likeCount": 25,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### 2. Get Post by Slug

Lấy bài viết theo slug (URL-friendly identifier).

**Endpoint:** `GET /api/posts/slug/:slug`

**Auth:** Optional (nếu có token thì có thể xem draft của mình)

**URL Parameters:**
- `slug`: Slug của bài viết

**Response:**
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Cách chăm sóc chó con",
    "slug": "cach-cham-soc-cho-con",
    "excerpt": "Hướng dẫn chi tiết...",
    "content": "...",
    "coverImageUrl": "https://cloudinary.com/...",
    "status": "published",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "authorId": { ... },
    "tagIds": [ ... ],
    "viewCount": 101,
    "likeCount": 25,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 3. Create Post

Tạo bài viết mới (user tạo draft, admin có thể tạo và publish luôn).

**Endpoint:** `POST /api/posts`

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "title": "Cách chăm sóc chó con",
  "content": "Nội dung đầy đủ của bài viết...",
  "excerpt": "Tóm tắt ngắn gọn (optional)",
  "coverImageUrl": "https://cloudinary.com/... (optional)",
  "slug": "cach-cham-soc-cho-con (optional, auto-generated if not provided)",
  "status": "published (optional, only for admin)",
  "tagIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}
```

**Response:**
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Cách chăm sóc chó con",
    "slug": "cach-cham-soc-cho-con",
    "excerpt": "Tóm tắt ngắn gọn",
    "content": "Nội dung đầy đủ...",
    "coverImageUrl": "https://cloudinary.com/...",
    "status": "draft",
    "authorId": { ... },
    "tagIds": [ ... ],
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

---

### 4. Get My Posts

Lấy danh sách bài viết của user hiện tại.

**Endpoint:** `GET /api/posts/my-posts`

**Auth:** Required (Bearer token)

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số bài viết mỗi trang (default: 20)
- `status` (optional): Filter theo status (draft, published, hidden)

**Response:** Giống như Get Published Posts

---

### 5. Update My Post

Cập nhật bài viết của chính mình (sẽ đặt lại về draft).

**Endpoint:** `PUT /api/posts/my-posts/:id`

**Auth:** Required (Bearer token, must be post author)

**URL Parameters:**
- `id`: ID của bài viết

**Request Body:**
```json
{
  "title": "Tiêu đề mới (optional)",
  "content": "Nội dung mới (optional)",
  "excerpt": "Tóm tắt mới (optional)",
  "coverImageUrl": "URL ảnh mới (optional)",
  "tagIds": ["507f1f77bcf86cd799439013"] // optional
}
```

**Response:**
```json
{
  "post": { ... }
}
```

---

### 6. Delete My Post

Xóa bài viết của chính mình.

**Endpoint:** `DELETE /api/posts/my-posts/:id`

**Auth:** Required (Bearer token, must be post author)

**URL Parameters:**
- `id`: ID của bài viết

**Response:**
```json
{
  "message": "Xóa bài viết thành công"
}
```

---

### 7. Get All Posts (Admin)

Lấy tất cả bài viết (bao gồm cả draft).

**Endpoint:** `GET /api/posts`

**Auth:** Required (Bearer token, admin role)

**Query Parameters:**
- `page` (optional): Số trang
- `limit` (optional): Số bài viết mỗi trang
- `search` (optional): Từ khóa tìm kiếm
- `status` (optional): Filter theo status
- `authorId` (optional): Filter theo tác giả
- `tagId` (optional): Filter theo tag

**Response:** Giống như Get Published Posts

---

### 8. Get Post by ID (Admin)

Lấy bài viết theo ID.

**Endpoint:** `GET /api/posts/:id`

**Auth:** Required (Bearer token)

**URL Parameters:**
- `id`: ID của bài viết

**Response:**
```json
{
  "post": { ... }
}
```

---

### 9. Update Post (Admin)

Cập nhật bất kỳ bài viết nào.

**Endpoint:** `PUT /api/posts/:id`

**Auth:** Required (Bearer token, admin role)

**URL Parameters:**
- `id`: ID của bài viết

**Request Body:**
```json
{
  "title": "Tiêu đề mới (optional)",
  "slug": "slug-moi (optional)",
  "content": "Nội dung mới (optional)",
  "excerpt": "Tóm tắt mới (optional)",
  "coverImageUrl": "URL ảnh mới (optional)",
  "status": "published (optional)",
  "tagIds": ["507f1f77bcf86cd799439013"] // optional
}
```

**Response:**
```json
{
  "post": { ... }
}
```

---

### 10. Toggle Post Status (Admin)

Chuyển đổi trạng thái giữa published và draft.

**Endpoint:** `PUT /api/posts/:id/toggle-status`

**Auth:** Required (Bearer token, admin role)

**URL Parameters:**
- `id`: ID của bài viết

**Response:**
```json
{
  "post": { ... }
}
```

---

### 11. Delete Post (Admin)

Xóa bất kỳ bài viết nào.

**Endpoint:** `DELETE /api/posts/:id`

**Auth:** Required (Bearer token, admin role)

**URL Parameters:**
- `id`: ID của bài viết

**Response:**
```json
{
  "message": "Xóa bài viết thành công"
}
```

---

### 12. Get Post Statistics (Admin)

Lấy thống kê tổng quan về bài viết.

**Endpoint:** `GET /api/posts/stats`

**Auth:** Required (Bearer token, admin role)

**Response:**
```json
{
  "stats": {
    "total": 100,
    "published": 75,
    "draft": 20,
    "hidden": 5
  }
}
```

---

## Tag Endpoints

### 1. Get All Tags

Lấy danh sách tất cả tags.

**Endpoint:** `GET /api/tags`

**Auth:** None

**Query Parameters:**
- `page` (optional): Số trang
- `limit` (optional): Số tags mỗi trang (default: 50)
- `search` (optional): Tìm kiếm theo tên

**Response:**
```json
{
  "tags": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Chó",
      "slug": "cho",
      "description": "Bài viết về chó",
      "postCount": 25,
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "pages": 1
  }
}
```

---

### 2. Get Tag by ID

**Endpoint:** `GET /api/tags/:id`

**Auth:** None

**Response:**
```json
{
  "tag": { ... }
}
```

---

### 3. Get Tag by Slug

**Endpoint:** `GET /api/tags/slug/:slug`

**Auth:** None

**Response:**
```json
{
  "tag": { ... }
}
```

---

### 4. Get Posts by Tag

Lấy danh sách bài viết theo tag.

**Endpoint:** `GET /api/tags/:id/posts`

**Auth:** None

**Query Parameters:**
- `page` (optional): Số trang
- `limit` (optional): Số bài viết mỗi trang

**Response:**
```json
{
  "tag": { ... },
  "posts": [ ... ],
  "pagination": { ... }
}
```

---

### 5. Create Tag (Admin)

**Endpoint:** `POST /api/tags`

**Auth:** Required (Bearer token, admin role)

**Request Body:**
```json
{
  "name": "Chó",
  "slug": "cho (optional, auto-generated)",
  "description": "Bài viết về chó (optional)"
}
```

**Response:**
```json
{
  "tag": { ... }
}
```

---

### 6. Update Tag (Admin)

**Endpoint:** `PUT /api/tags/:id`

**Auth:** Required (Bearer token, admin role)

**Request Body:**
```json
{
  "name": "Chó Cưng (optional)",
  "slug": "cho-cung (optional)",
  "description": "Mô tả mới (optional)"
}
```

**Response:**
```json
{
  "tag": { ... }
}
```

---

### 7. Delete Tag (Admin)

**Endpoint:** `DELETE /api/tags/:id`

**Auth:** Required (Bearer token, admin role)

**Response:**
```json
{
  "message": "Xóa tag thành công"
}
```

---

## Examples

### Example 1: User tạo bài viết

```bash
curl -X POST http://localhost:5003/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "10 mẹo nuôi chó khỏe mạnh",
    "content": "Nội dung chi tiết về cách nuôi chó...",
    "excerpt": "Chia sẻ kinh nghiệm nuôi chó",
    "coverImageUrl": "https://cloudinary.com/image.jpg",
    "tagIds": ["507f1f77bcf86cd799439013"]
  }'
```

### Example 2: Lấy bài viết public

```bash
curl http://localhost:5003/api/posts/public?page=1&limit=10
```

### Example 3: Admin publish bài viết

```bash
curl -X PUT http://localhost:5003/api/posts/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

### Example 4: Tìm kiếm bài viết

```bash
curl "http://localhost:5003/api/posts/public?search=chó&page=1"
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Tiêu đề và nội dung là bắt buộc"
}
```

hoặc với validation errors:

```json
{
  "errors": [
    {
      "msg": "Tiêu đề là bắt buộc",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Token không hợp lệ hoặc đã hết hạn"
}
```

### 403 Forbidden

```json
{
  "error": "Không có quyền thực hiện"
}
```

### 404 Not Found

```json
{
  "error": "Không tìm thấy bài viết"
}
```

### 409 Conflict

```json
{
  "error": "Slug đã tồn tại"
}
```

### 500 Internal Server Error

```json
{
  "error": "Đã xảy ra lỗi. Vui lòng thử lại sau."
}
```

---

## Tips & Best Practices

1. **Slug Generation**: Nếu không cung cấp slug, system sẽ tự động tạo từ title
2. **Auto-draft**: User tạo bài viết sẽ mặc định là draft, cần admin publish
3. **Text Search**: Sử dụng `search` parameter để tìm kiếm trong title, excerpt, content
4. **Pagination**: Luôn sử dụng pagination cho performance tốt hơn
5. **Image Upload**: Upload ảnh lên Cloudinary trước, sau đó dùng URL trong request
6. **Token**: Đảm bảo token còn hạn và có đúng roles

---

## Contact

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ PawCare Development Team.
