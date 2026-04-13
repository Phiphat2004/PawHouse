# Stock Management Improvements

Tài liệu mô tả chi tiết 3 phase cải tiến logic quản lý kho hàng.

---

## Tổng quan vấn đề trước khi cải tiến

| Vấn đề | Mô tả | Hậu quả |
|---|---|---|
| **Không có Reserved Stock** | `reservedQuantity` luôn = 0, hàng bị trừ thẳng lúc đặt | Huỷ đơn → stock không được cộng lại → kho mất dần |
| **Race Condition** | `findOne` → tính toán → `save()` là 3 bước riêng rẽ | 2 người mua cùng lúc có thể cùng đặt hàng khi chỉ còn 1 sản phẩm |
| **Transaction Log không đầy đủ** | Đơn hàng không tạo `StockMovement` record | Không thể audit, không thể tái tính kho từ lịch sử |

---

## Phase 1 — Race Condition Fix

### File: `product-service/src/index.js`

**Endpoint:** `POST /api/internal/deduct-stock`

| | Trước | Sau |
|---|---|---|
| Guard | Không có | `{ stock: { $gte: qty } }` — chỉ trừ khi đủ hàng |
| Atomicity | `findByIdAndUpdate($inc)` — atomic nhưng không có guard | `findOneAndUpdate(condition, $inc)` — atomic + guard |
| StockLevel | Không cập nhật | Atomic `$inc { quantity, availableQuantity }` với `$expr` guard |
| Lỗi hết hàng | Im lặng, stock xuống âm | Trả `failures[]` cho caller, log warning |

```js
// TRƯỚC — không có guard, stock có thể âm
await Product.findByIdAndUpdate(id, { $inc: { stock: -qty } });

// SAU — atomic với guard
const result = await Product.findOneAndUpdate(
  { _id: id, stock: { $gte: qty } },   // chỉ trừ khi stock >= qty
  { $inc: { stock: -qty } },
  { new: true }
);
if (!result) failures.push({ productId: id, error: 'Insufficient stock' });
```

### File: `product-service/src/services/stock.service.js`

**Function:** `createStockEntry()`

**Trường hợp OUT (xuất kho thủ công):**

| | Trước | Sau |
|---|---|---|
| Pattern | Read → Modify → Write (3 bước) | `findOneAndUpdate` (1 bước atomic) |
| Guard | Check sau khi đọc (không atomic) | `$expr: { $gte: [$subtract[quantity, reservedQuantity], qty] }` |
| Race condition | Có — 2 request cùng đọc qty=10, cùng trừ 5, kết quả = 5 thay vì 0 | Không — chỉ 1 trong 2 request qua được guard |

**Trường hợp IN (nhập kho thủ công):**

| | Trước | Sau |
|---|---|---|
| Pattern | `findOne` → `new StockLevel` hoặc `+= qty` → `save()` | `findOneAndUpdate({ upsert: true })` — atomic create-or-increment |
| `availableQuantity` | Tính bởi `pre('save')` hook — không chạy với `findOneAndUpdate` | Tăng trực tiếp bằng `$inc: { availableQuantity }` |

---

## Phase 2 — Reserved Stock

### Luồng mới hoàn chỉnh

```
Tạo đơn (pending)  →  reserve-stock   →  reservedQuantity ↑, availableQuantity ↓
     │
     ├─ Huỷ đơn    →  release-stock   →  reservedQuantity ↓, availableQuantity ↑  (trả về)
     │
     └─ Hoàn thành →  fulfill-stock   →  quantity ↓, reservedQuantity ↓           (trừ hẳn)
```

### File: `product-service/src/index.js` — 3 endpoints mới

#### `POST /api/internal/reserve-stock`
- Gọi bởi: `order-service` khi tạo đơn hàng
- Logic: `findOneAndUpdate({ availableQuantity: { $gte: qty } }, { $inc: { reservedQuantity: +qty, availableQuantity: -qty } })`
- Nếu không đủ hàng: trả `failures[]`, **không** tạo đơn
- Tạo `StockMovement` type `RESERVE` với `referenceId = orderId`

#### `POST /api/internal/release-stock`
- Gọi bởi: `order-service` khi huỷ đơn
- Logic: `findOneAndUpdate({ reservedQuantity: { $gte: qty } }, { $inc: { reservedQuantity: -qty, availableQuantity: +qty } })`
- Non-fatal nếu không tìm thấy (đơn cũ trước Phase 2)
- Tạo `StockMovement` type `RELEASE`

#### `POST /api/internal/fulfill-stock`
- Gọi bởi: `order-service` khi đơn `completed`
- Logic: `findOneAndUpdate({ quantity: { $gte: qty }, reservedQuantity: { $gte: qty } }, { $inc: { quantity: -qty, reservedQuantity: -qty } })`
- Fallback best-effort cho đơn cũ (chưa có reserve)
- Sync `Product.stock` từ aggregate
- Tạo `StockMovement` type `FULFILL`

### File: `order-service/src/services/order.service.js`

| Function | Thay đổi |
|---|---|
| `createOrder()` | Thay `deduct-stock` → `reserve-stock`. Truyền `orderId` + `orderCode` |
| `cancelOrder()` | Thêm gọi `release-stock` sau khi save |
| `updateOrderStatus()` | Thêm gọi `fulfill-stock` khi `status === 'completed'` |

---

## Phase 3 — Transaction Log & Recalculate

### File: `product-service/src/models/StockMovement.js`

**Mở rộng enum `type`:**

| Type | Ý nghĩa |
|---|---|
| `IN` | Nhập kho thủ công (admin) |
| `OUT` | Xuất kho thủ công (admin) |
| `RESERVE` | ✨ Giữ hàng cho đơn mới |
| `RELEASE` | ✨ Trả hàng khi đơn bị huỷ |
| `FULFILL` | ✨ Trừ hẳn khi đơn hoàn thành |
| `RETURN` | Hoàn trả từ khách |
| `ADJUSTMENT` | Điều chỉnh thủ công |
| `TRANSFER` | Chuyển kho |

**Mở rộng enum `referenceType`:**
- Thêm `'ORDER'` — tham chiếu đến đơn hàng

**Thêm `referenceId`:** lưu `orderId` hoặc `orderCode`

### File: `product-service/src/index.js`

#### `POST /api/internal/recalculate-stock/:productId`

Tái tính `StockLevel` từ toàn bộ lịch sử `StockMovement`. Dùng khi:
- Nghi ngờ dữ liệu bị lệch
- Sau khi fix bug hoặc phục hồi từ lỗi
- Audit định kỳ

**Thuật toán:**
```
quantity = Σ(IN, RETURN) - Σ(OUT, FULFILL)
reservedQuantity = Σ(RESERVE) - Σ(RELEASE)
availableQuantity = max(0, quantity - reservedQuantity)
```

**Response bao gồm:**
```json
{
  "success": true,
  "productId": "...",
  "newProductStock": 42,
  "warehouseReport": [
    {
      "warehouseId": "...",
      "before": { "quantity": 50, "reservedQuantity": 0, "availableQuantity": 50 },
      "after":  { "quantity": 42, "reservedQuantity": 3, "availableQuantity": 39 },
      "movementsProcessed": 15
    }
  ]
}
```

---

## Tóm tắt các file đã thay đổi

| File | Phase | Thay đổi |
|---|---|---|
| `product-service/src/index.js` | 1, 2, 3 | Fix `deduct-stock` atomic; thêm `reserve/release/fulfill/recalculate` |
| `product-service/src/services/stock.service.js` | 1 | `createStockEntry` dùng `findOneAndUpdate` atomic thay vì read-modify-write |
| `product-service/src/models/StockMovement.js` | 3 | Mở rộng enum `type` (RESERVE, RELEASE, FULFILL) và `referenceType` (ORDER) |
| `order-service/src/services/order.service.js` | 2 | `createOrder` → reserve; `cancelOrder` → release; `updateOrderStatus(completed)` → fulfill |

---

## Backward Compatibility

Tất cả thay đổi đều **non-breaking**:

- `deduct-stock` vẫn hoạt động (chỉ thêm guard, không đổi interface)
- `reserve/release/fulfill` đều non-fatal — lỗi chỉ log warning, không crash
- `fulfill-stock` có fallback cho đơn cũ chưa có reserve
- `release-stock` bỏ qua nếu không có reserved stock (đơn cũ)
- `recalculate-stock` chỉ đọc và write StockLevel, không xoá movement

---

## Kiểm tra sau khi deploy

```bash
# 1. Tạo 2 đơn hàng cùng lúc cho sản phẩm còn 1 cái
# → Chỉ 1 đơn được tạo thành công, đơn kia nhận lỗi "Insufficient stock"

# 2. Tạo đơn → huỷ → kiểm tra availableQuantity
# → availableQuantity phải trở về giá trị ban đầu

# 3. Tạo đơn → complete → kiểm tra quantity
# → quantity giảm đúng bằng số lượng đặt, reservedQuantity về 0

# 4. Recalculate sau khi test
curl -X POST http://localhost:5002/api/internal/recalculate-stock/<productId>
# → "before" và "after" phải khớp nhau nếu không có lệch
```
