# API Setup Complete

✅ API folder đã được thiết lập lại theo mô hình MVC services với **1 port duy nhất**.

## 📋 Cấu Trúc Hoàn Chỉnh

```
API/
├── src/
│   ├── config/
│   │   └── index.js                 # Configuration (PORT, DB, JWT)
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   └── error.middleware.js      # Error handling
│   │
│   ├── models/
│   │   ├── User.js                  # Users
│   │   ├── Product.js               # Products
│   │   ├── Category.js              # Categories
│   │   ├── Post.js                  # Posts/Blog
│   │   ├── Order.js                 # Orders
│   │   └── index.js                 # Export models
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # Auth logic
│   │   ├── product.controller.js    # Product logic
│   │   ├── post.controller.js       # Post logic
│   │   └── order.controller.js      # Order logic
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # /api/auth/*
│   │   ├── product.routes.js        # /api/products/*
│   │   ├── post.routes.js           # /api/posts/*
│   │   └── order.routes.js          # /api/orders/*
│   │
│   └── index.js                     # Entry point
│
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

## 🚀 Quick Start

```bash
cd API

# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env if needed (PORT, MONGO_URI, JWT_SECRET)

# 3. Make sure MongoDB is running
# mongod --dbpath "C:\path\to\db"

# 4. Run
npm run dev     # Development (auto-reload)
npm start       # Production
```

## 🔌 API Endpoints (Port 3000)

### Auth
```
POST   /api/auth/register         - Register new user
POST   /api/auth/login            - Login
GET    /api/auth/me      🔒       - Get current user
PUT    /api/auth/profile 🔒       - Update profile
POST   /api/auth/logout  🔒       - Logout
```

### Products
```
GET    /api/products              - Get all products
GET    /api/products/:id          - Get product
POST   /api/products    🔒        - Create
PUT    /api/products/:id 🔒       - Update
DELETE /api/products/:id 🔒       - Delete
```

### Posts
```
GET    /api/posts                 - Get all posts
GET    /api/posts/:id             - Get post
POST   /api/posts       🔒        - Create
PUT    /api/posts/:id   🔒        - Update
DELETE /api/posts/:id   🔒        - Delete
POST   /api/posts/:id/like 🔒     - Like post
POST   /api/posts/:id/comment 🔒  - Comment post
```

### Orders
```
POST   /api/orders       🔒       - Create order
GET    /api/orders       🔒       - Get orders
GET    /api/orders/:id   🔒       - Get order
DELETE /api/orders/:id   🔒       - Cancel order
```

🔒 = Requires JWT token

## 📊 Key Differences from Services

| Aspect | Services Folder | API Folder |
|--------|-----------------|-----------|
| **Structure** | Multiple services (5001-5005) | Single service (port 3000) |
| **MVC Pattern** | Each service has own MVC | Unified MVC |
| **Models** | Service-specific | Centralized (User, Product, Post, Order) |
| **Dependencies** | Varies per service | Common stack |
| **Proxy** | Gateway pattern | Direct logic |

## ✅ What Was Done

1. ✓ Cleaned up old structure
2. ✓ Created fresh folder structure (config, controllers, middlewares, models, routes)
3. ✓ Implemented MVC pattern from services folder
4. ✓ Added 5 essential models:
   - User (authentication)
   - Product (e-commerce)
   - Category (product taxonomy)
   - Post (blog/feed)
   - Order (order management)
5. ✓ Created controllers with full business logic
6. ✓ Set up authentication middleware (JWT)
7. ✓ Error handling middleware
8. ✓ All routes configured
9. ✓ Dependencies installed
10. ✓ Single port configuration (PORT=3000)

## 🔍 Health Check

```bash
curl http://localhost:3000/api/health
# Response: { "status": "ok", "service": "api" }
```

## 📝 Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get products
curl http://localhost:3000/api/products

# Get authenticated user (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/auth/me
```

## 🎯 Next Steps

1. Create .env file with proper values
2. Ensure MongoDB is running
3. Run `npm run dev`
4. Start building/testing endpoints

---

**Port**: 3000  
**Database**: MongoDB (mongodb://localhost:27017/pawcare)
