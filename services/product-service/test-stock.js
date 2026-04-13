/**
 * TEST SCRIPT CHO STOCK MANAGEMENT
 * Chạy: node test-stock.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';
let authToken = '';
let warehouseId = '';
let productId = '';

// Thay token của bạn ở đây
authToken = 'YOUR_AUTH_TOKEN';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  }
});

async function testStockManagement() {
  console.log('🚀 BẮT ĐẦU TEST STOCK MANAGEMENT\n');

  try {
    // 1. Lấy danh sách products
    console.log('1️⃣ Lấy danh sách products...');
    const productsRes = await api.get('/products?limit=1');
    if (productsRes.data.products && productsRes.data.products.length > 0) {
      productId = productsRes.data.products[0]._id;
      console.log(`✅ Product ID: ${productId}\n`);
    } else {
      console.log('❌ Không có product nào. Vui lòng tạo product trước.\n');
      return;
    }

    // 2. Tạo warehouse
    console.log('2️⃣ Tạo warehouse...');
    try {
      const warehouseRes = await api.post('/stock/warehouses', {
        name: 'Kho Test ' + Date.now(),
        code: 'WH-TEST-' + Date.now(),
        address: {
          street: '123 Test St',
          city: 'Hanoi',
          country: 'Vietnam'
        }
      });
      warehouseId = warehouseRes.data.warehouse._id;
      console.log(`✅ Warehouse ID: ${warehouseId}\n`);
    } catch (err) {
      console.log('⚠️ Warehouse đã tồn tại hoặc lỗi:', err.response?.data?.error);
      // Lấy warehouse có sẵn
      const warehousesRes = await api.get('/stock/warehouses');
      if (warehousesRes.data.warehouses && warehousesRes.data.warehouses.length > 0) {
        warehouseId = warehousesRes.data.warehouses[0]._id;
        console.log(`✅ Sử dụng warehouse: ${warehouseId}\n`);
      }
    }

    // 3. Tạo stock entry
    console.log('3️⃣ Tạo stock entry (nhập kho)...');
    const entryRes = await api.post('/stock/entry', {
      productId,
      warehouseId,
      quantity: 50,
      reason: 'Test nhập kho'
    });
    console.log('✅ Stock entry created:');
    console.log(`   - Product: ${entryRes.data.stockLevel.productId.name}`);
    console.log(`   - Warehouse: ${entryRes.data.stockLevel.warehouseId.name}`);
    console.log(`   - Quantity: ${entryRes.data.stockLevel.quantity}`);
    console.log(`   - Available: ${entryRes.data.stockLevel.availableQuantity}\n`);

    // 4. Kiểm tra stock levels
    console.log('4️⃣ Kiểm tra stock levels...');
    const levelsRes = await api.get('/stock/levels');
    console.log(`✅ Tìm thấy ${levelsRes.data.stockLevels.length} stock levels`);
    levelsRes.data.stockLevels.slice(0, 3).forEach((level, index) => {
      console.log(`   ${index + 1}. ${level.productId?.name || 'N/A'} - Qty: ${level.quantity}`);
    });
    console.log();

    // 5. Kiểm tra stock movements
    console.log('5️⃣ Kiểm tra stock movements...');
    const movementsRes = await api.get('/stock/movements?limit=5');
    console.log(`✅ Tìm thấy ${movementsRes.data.movements.length} movements`);
    movementsRes.data.movements.forEach((mov, index) => {
      console.log(`   ${index + 1}. ${mov.type} - ${mov.quantity} units - ${mov.reason || 'N/A'}`);
    });
    console.log();

    // 6. Kiểm tra stock của 1 product
    console.log('6️⃣ Kiểm tra stock của product...');
    const productStockRes = await api.get(`/stock/product/${productId}`);
    console.log('✅ Product stock:');
    console.log(`   - Total: ${productStockRes.data.stock.total}`);
    console.log(`   - Available: ${productStockRes.data.stock.available}`);
    console.log(`   - Reserved: ${productStockRes.data.stock.reserved}`);
    console.log();

    console.log('🎉 TẤT CẢ TEST ĐỀU PASS!\n');

  } catch (error) {
    console.error('❌ LỖI:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

// Chạy test
testStockManagement();
