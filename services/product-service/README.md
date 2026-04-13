# Product Service

Microservice quản lý sản phẩm và danh mục cho PawCare.

## Features

- Quản lý sản phẩm (Product) - CRUD, search, pagination
- Quản lý danh mục (Category) - CRUD, hierarchical categories
- Quản lý biến thể sản phẩm (ProductVariation) - SKU, stock, price
- Quản lý tags
- Upload ảnh qua Cloudinary
- JWT authentication với auth-service

## Endpoints

### Products
- `GET /api/products` - Lấy danh sách sản phẩm (pagination, filter, search)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/slug/:slug` - Lấy sản phẩm theo slug
- `POST /api/products` - Tạo sản phẩm mới (admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (admin)
- `GET /api/products/search` - Tìm kiếm sản phẩm

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `POST /api/categories` - Tạo danh mục mới (admin)
- `PUT /api/categories/:id` - Cập nhật danh mục (admin)
- `DELETE /api/categories/:id` - Xóa danh mục (admin)

## Setup

```bash
# Install dependencies
npm install

# Copy .env.example to .env and configure
cp .env.example .env

# Run in development
npm run dev

# Run in production
npm start
```

## Environment Variables

- `PORT` - Server port (default: 5002)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `CLOUDINARY_*` - Cloudinary credentials
- `AUTH_SERVICE_URL` - URL của auth-service

## Database Schema

- **Product**: name, slug, description, brand, categoryIds[], images[], isActive
- **Category**: name, slug, description, parentId, isActive
- **ProductVariation**: product_id, sku, name, attributes, price, compareAtPrice, stock, image, status
- **Tag**: name, slug
