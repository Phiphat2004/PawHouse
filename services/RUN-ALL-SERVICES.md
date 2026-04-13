# ✅ SETUP COMPLETE - Run All Services

## 🎉 Đã hoàn thành!

Bạn đã có thể chạy tất cả 3 services cùng lúc với **một lệnh duy nhất**!

---

## 🚀 Cách sử dụng

### Chạy tất cả services

```bash
cd services
npm run dev
```

Lệnh này sẽ chạy đồng thời:
- 🔵 **AUTH-SERVICE** (port 5001)
- 🟢 **PRODUCT-SERVICE** (port 5002)  
- 🟡 **POST-SERVICE** (port 5003)
- 🟣 **ADMIN-SERVICE** (port 5004)
- 🔷 **ORDER-SERVICE** (port 5005)

Mỗi service sẽ có màu riêng trong terminal để dễ theo dõi logs!

---

## 📋 Các lệnh đã tạo

### 1. Chạy tất cả services

```bash
npm run dev          # Development mode (auto-restart khi code thay đổi)
npm start            # Production mode
```

### 2. Chạy từng service riêng

```bash
npm run dev:auth     # Chỉ chạy auth-service
npm run dev:product  # Chỉ chạy product-service
npm run dev:post     # Chỉ chạy post-service
npm run dev:admin    # Chỉ chạy admin-service
npm run dev:order    # Chỉ chạy order-service
```

### 3. Cài đặt dependencies

```bash
npm run install:all     # Cài đặt cho tất cả services
npm run install:auth    # Chỉ auth-service
npm run install:admin   # Chỉ admin-service
npm run install:order   # Chỉ order-service
npm run install:product # Chỉ product-service
npm run install:post    # Chỉ post-service
```

---

## 📁 Files đã tạo

```
services/
├── package.json           # ✅ Scripts để chạy tất cả services
├── node_modules/          # ✅ concurrently package
├── README.md              # ✅ Documentation đầy đủ
├── QUICK-START.md         # ✅ Hướng dẫn nhanh
├── test-setup.ps1         # ✅ Script kiểm tra setup
│
├── auth-service/          Port 5001
├── product-service/       Port 5002
└── post-service/          Port 5003
```

---

## 🔧 Setup lần đầu (nếu chưa làm)

### 1. Cài dependencies cho từng service

```bash
cd services
npm run install:all
```

### 2. Tạo file .env cho mỗi service

```bash
# Auth Service
cd auth-service
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế

# Product Service  
cd ../product-service
cp .env.example .env
# Chỉnh sửa .env

# Post Service
cd ../post-service
cp .env.example .env
# Chỉnh sửa .env
```

### 3. Đảm bảo MongoDB đang chạy

```bash
# Windows - Check MongoDB service
services.msc
# Tìm "MongoDB" và Start nếu chưa chạy

# Hoặc chạy MongoDB manually
mongod
```

### 4. Test setup

```bash
cd services
.\test-setup.ps1
```

---

## 🎬 Demo Output

Khi chạy `npm run dev`, bạn sẽ thấy:

```
[AUTH]    [DB] Connected to MongoDB
[AUTH]    AUTH-SERVICE running on port 5001
[PRODUCT] [DB] Connected to MongoDB  
[PRODUCT] PRODUCT-SERVICE running on port 5002
[POST]    [DB] Connected to MongoDB
[POST]    POST-SERVICE running on port 5003
```

---

## ✅ Kiểm tra services đang chạy

### Health checks

```bash
curl http://localhost:5001/api/health
curl http://localhost:5002/api/health
curl http://localhost:5003/api/health
```

### Hoặc mở trình duyệt
- http://localhost:5001/api/health
- http://localhost:5002/api/health
- http://localhost:5003/api/health

---

## 🛠️ Tech Stack

### Services Runner
- **concurrently** - Chạy nhiều npm scripts song song
- **Colored output** - Dễ phân biệt logs từ các services

### Services Architecture
- **auth-service** (port 5001) - JWT, Users, Sessions
- **product-service** (port 5002) - Products, Categories, Reviews
- **post-service** (port 5003) - Posts, Tags, Community

---

## 📚 Documentation

Xem chi tiết tại:
- [services/README.md](README.md) - Tài liệu đầy đủ
- [services/QUICK-START.md](QUICK-START.md) - Hướng dẫn nhanh
- [auth-service/GUIDE.md](auth-service/GUIDE.md)
- [product-service/PRODUCT-SERVICE-GUIDE.md](product-service/PRODUCT-SERVICE-GUIDE.md)
- [post-service/POST-SERVICE-GUIDE.md](post-service/POST-SERVICE-GUIDE.md)

---

## 🎯 Tính năng

✅ **Chạy tất cả services với 1 lệnh**  
✅ **Colored output** - Dễ theo dõi logs  
✅ **Auto-restart** - Khi code thay đổi (dev mode)  
✅ **Chạy riêng lẻ** - Nếu chỉ cần 1 service  
✅ **Batch install** - Cài dependencies cho tất cả  
✅ **Test script** - Kiểm tra setup  

---

## 🚀 Sẵn sàng!

Giờ bạn có thể:

1. **Chạy tất cả:**
   ```bash
   cd services
   npm run dev
   ```

2. **Develop thoải mái** - Nodemon tự động restart khi code thay đổi

3. **Xem logs** - Tất cả trong một terminal, có màu sắc

4. **Test API** - Tất cả services chạy đồng thời

---

## 💡 Tips

- **Ctrl+C** để dừng tất cả services
- Logs có màu: 🔵 AUTH | 🟢 PRODUCT | 🟡 POST
- Port conflict? Đổi PORT trong .env của service
- Chỉ cần 1 service? Dùng `npm run dev:auth` (hoặc product/post)

---

**Happy Coding! 🎉**

Bạn vừa setup xong hệ thống microservices với 3 services chạy song song!
