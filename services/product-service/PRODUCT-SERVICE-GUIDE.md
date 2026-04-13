# Product Service - Hướng Dẫn Triển Khai

## ✅ Trạng Thái: HOÀN THÀNH

Product-service đã được tạo thành công và đang chạy ổn định trên port **5002**.

## 📦 Cấu Trúc Service

```
product-service/
├── src/
│   ├── config/           # Cấu hình (DB, JWT, Cloudinary)
│   │   └── index.js
│   ├── models/           # Mongoose models
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Tag.js
│   │   ├── ProductVariation.js
│   │   └── index.js
│   ├── controllers/      # Business logic
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   └── variation.controller.js
│   ├── routes/           # Express routes
│   │   ├── product.routes.js
│   │   ├── category.routes.js
│   │   └── variation.routes.js
│   ├── middlewares/      # Auth, validation, error handling
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── index.js
│   ├── services/         # External services
│   │   └── cloudinary.service.js
│   ├── utils/            # Helper functions
│   └── index.js          # Entry point
├── .env                  # Environment variables
├── .env.example
├── package.json
└── README.md
```

## 🎯 Features Implemented

### Product Management
- ✅ Get all products (pagination, filter by category, brand, isActive, search)
- ✅ Get product by ID (with variations)
- ✅ Get product by slug (public access)
- ✅ Create product (admin only)
- ✅ Update product (admin only)
- ✅ Delete product (admin only)
- ✅ Search products
- ✅ Get product statistics
- ✅ Auto-create default variation if none exists

### Category Management
- ✅ Get all categories (hierarchical support)
- ✅ Get category by ID
- ✅ Create category (admin only, auto-generate unique slug)
- ✅ Update category (admin only)
- ✅ Delete category (admin only, prevent delete if has children)

### Variation Management
- ✅ Get variations by product ID
- ✅ Create variation (admin only)
- ✅ Update variation (admin only)
- ✅ Delete variation (soft delete, admin only)

### Additional Features
- ✅ JWT authentication (decode từ auth-service)
- ✅ Role-based access control (admin/customer)
- ✅ Cloudinary image upload/delete
- ✅ Input validation (express-validator)
- ✅ Error handling middleware
- ✅ MongoDB connection với Mongoose

## 🚀 Cách Chạy

### 1. Cài đặt dependencies
```bash
cd services/product-service
npm install
```

### 2. Cấu hình .env
```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/pawcare
JWT_SECRET=pawhouse_dev_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

AUTH_SERVICE_URL=http://localhost:5001
```

### 3. Chạy service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Service sẽ chạy tại: **http://localhost:5002**

## 📡 API Endpoints

### Products
```
GET    /api/products                   # Lấy danh sách sản phẩm
GET    /api/products/stats             # Thống kê sản phẩm
GET    /api/products/slug/:slug        # Lấy sản phẩm theo slug
GET    /api/products/search?q=...      # Tìm kiếm sản phẩm
GET    /api/products/:id               # Lấy sản phẩm theo ID
POST   /api/products                   # Tạo sản phẩm (admin)
PUT    /api/products/:id               # Cập nhật sản phẩm (admin)
DELETE /api/products/:id               # Xóa sản phẩm (admin)
```

### Categories
```
GET    /api/categories                 # Lấy danh sách danh mục
GET    /api/categories/:id             # Lấy danh mục theo ID
POST   /api/categories                 # Tạo danh mục (admin)
PUT    /api/categories/:id             # Cập nhật danh mục (admin)
DELETE /api/categories/:id             # Xóa danh mục (admin)
```

### Variations
```
GET    /api/variations/product/:productId  # Lấy variations theo productId
POST   /api/variations                     # Tạo variation (admin)
PUT    /api/variations/:id                 # Cập nhật variation (admin)
DELETE /api/variations/:id                 # Xóa variation (admin)
```

## 🔐 Authentication

Service sử dụng JWT token từ auth-service:

```javascript
// Headers
Authorization: Bearer <token>

// Token payload (decoded)
{
  userId: "...",
  email: "...",
  roles: ["admin", "customer"],
  tokenVersion: 0
}
```

## 📊 Database Models

### Product
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  brand: String,
  categoryIds: [ObjectId],
  images: [{ url, sortOrder }],
  isActive: Boolean,
  createdBy: ObjectId,
  timestamps
}
```

### Category
```javascript
{
  parentId: ObjectId (nullable),
  name: String,
  slug: String (unique),
  description: String,
  isActive: Boolean,
  timestamps
}
```

### ProductVariation
```javascript
{
  product_id: ObjectId (required),
  productId: ObjectId,  // backward compatibility
  sku: String (unique),
  name: String,
  attributes: Mixed,
  price: Number,
  compareAtPrice: Number,
  stock: Number,
  image: String,
  status: 'active' | 'inactive',
  isDeleted: Boolean,
  createdBy: ObjectId,
  timestamps
}
```

## 🧪 Test Service

```bash
# Health check
curl http://localhost:5002/api/health

# Get all products
curl http://localhost:5002/api/products

# Get product by slug
curl http://localhost:5002/api/products/slug/product-slug-name

# Create product (requires admin token)
curl -X POST http://localhost:5002/api/products \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thức ăn cho chó",
    "slug": "thuc-an-cho-cho",
    "categoryIds": ["category-id"],
    "images": [{"url": "https://...", "sortOrder": 0}],
    "isActive": true
  }'
```

## ⚠️ Lưu Ý

1. **Database**: Service dùng chung database `pawcare` với auth-service. Nếu muốn tách riêng, đổi `MONGO_URI` thành `mongodb://localhost:27017/pawcare_product`.

2. **JWT Secret**: Phải giống với auth-service để decode token chính xác.

3. **Default Variation**: Khi product không có variation, service tự động tạo variation mặc định với SKU = `SKU-{productId}-DEFAULT`.

4. **Slug Uniqueness**: Service tự động thêm số đếm nếu slug trùng (ví dụ: `product-1`, `product-2`).

5. **Admin Only**: Các endpoint CREATE/UPDATE/DELETE yêu cầu role `admin` trong JWT token.

## 🔄 Migration từ Backend Cũ

Service này đã migrate toàn bộ logic từ:
- `backend/models/Product.js`
- `backend/models/Category.js`
- `backend/models/ProductVariation.js`
- `backend/controllers/product.controller.js`
- `backend/controllers/category.controller.js`
- `backend/routes/product.routes.js`
- `backend/services/cloudinary.services.js`

Tất cả logic giữ nguyên, chỉ điều chỉnh:
- Auth middleware (decode JWT thay vì query User từ DB)
- Error handling (chuẩn hóa response format)
- Validation (dùng express-validator)

## 📝 Next Steps

1. ✅ Service đã hoàn thành và đang chạy
2. ⏭️ Tích hợp với frontend (cập nhật API endpoints)
3. ⏭️ Tạo docker-compose cho multi-service setup
4. ⏭️ Thêm logging (Winston/Pino)
5. ⏭️ Thêm caching (Redis)
6. ⏭️ API Gateway (NGINX/Kong)
7. ⏭️ Monitoring (Prometheus/Grafana)

## 🎉 Kết Luận

Product-service đã được tạo thành công theo đúng pattern của auth-service với tất cả features hoàn chỉnh. Service có thể chạy độc lập và sẵn sàng triển khai.
