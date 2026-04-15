// Lê Nhựt Hào
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { orderApi, cartApi, authApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/layout/Toast";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedItemIds } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    ward: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate("/login");
      return;
    }

    if (!selectedItemIds || selectedItemIds.length === 0) {
      alert("Không có sản phẩm để thanh toán");
      navigate("/gio-hang");
      return;
    }

    fetchCartItems();
    prefillFromProfile();
  }, [navigate]);

  const prefillFromProfile = async () => {
    try {
      const res = await authApi.me();
      const user = res.user || res;
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        city: user.address?.city || user.city || prev.city,
        district: user.address?.district || user.district || prev.district,
        ward: user.address?.ward || user.ward || prev.ward,
        address: user.address?.addressLine || user.address?.street || prev.address,
      }));
    } catch {
      // Không bắt buộc — bỏ qua nếu lỗi
    }
  };

  const fetchCartItems = async () => {
    try {
      // Cart API trả về { message, cart, items }
      const response = await cartApi.getCart();
      if (response.status === "success" && response.data) {
        const items = response.data.items || [];
        const selectedItems = items.filter((item) =>
          selectedItemIds.includes(item._id)
        );
        setCartItems(selectedItems);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      setToast({
        type: "error",
        title: "Lỗi",
        message: "Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, SĐT, địa chỉ)",
      });
      return;
    }

    if (cartItems.length === 0) {
      setToast({
        type: "error",
        title: "Lỗi",
        message: "Không tìm thấy sản phẩm để thanh toán",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          variationId: item.variation_id?._id || item.product_id?._id || item.product_id,
          productId: item.product_id?._id || item.product_id || null,
          sku: item.product_id?.sku || '',
          productName: item.product_id?.name || item.variation_id?.name || 'Sản phẩm',
          variationName: item.variation_id?.name || '',
          image: item.product_id?.images?.[0]?.url || item.variation_id?.image || '',
          unitPrice: item.variation_id?.price ?? item.product_id?.price ?? 0,
          quantity: item.quantity,
          lineTotal: (item.variation_id?.price ?? item.product_id?.price ?? 0) * item.quantity
        })),
        paymentMethod: 'cash',
        note: formData.note,
        shippingFee: shippingFee,
        addressInfo: {
          fullName: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          city: formData.city || '',
          district: formData.district || '',
          ward: formData.ward || '',
          addressLine: formData.address,
        },
        note: formData.note,
      };

      const response = await orderApi.createOrder(orderData);

      if (response.success) {
        // Xóa các sản phẩm đã đặt hàng khỏi giỏ hàng
        try {
          for (const item of cartItems) {
            const productId = item.product_id?._id || item.product_id;
            if (productId) {
              await cartApi.removeItem(productId);
            }
          }
        } catch (cartErr) {
          // Không block flow nếu xóa cart lỗi
          console.warn("Could not remove items from cart:", cartErr);
        }

        setToast({
          type: "success",
          title: "Thành công!",
          message: response.message || "Đơn hàng đã được tạo thành công",
        });

        setTimeout(() => {
          const orderId = response.data?._id;
          navigate(`/don-hang/${orderId}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      setToast({
        type: "error",
        title: "Lỗi",
        message: err.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () =>
    cartItems.reduce(
      (sum, item) => sum + (item.product_id?.price ?? 0) * item.quantity,
      0
    );

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const finalTotal = subtotal + shippingFee;

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form thông tin ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin giao hàng</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ tên & SĐT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="0901234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                />
              </div>

              {/* Tỉnh / Quận / Phường */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Hồ Chí Minh"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Quận 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    placeholder="Phường Bến Nghé"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Số nhà, tên đường..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                />
              </div>

              {/* Phương thức thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <div className="flex items-center p-3 border border-[#846551] rounded-lg bg-orange-50">
                  <span className="text-[#846551] font-medium">💵 Thanh toán khi nhận hàng (COD)</span>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Ghi chú cho người giao hàng (tuỳ chọn)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#846551] focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : "Đặt hàng"}
              </button>
            </form>
          </div>

          {/* ── Tóm tắt đơn hàng ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng của bạn</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item) => {
                  const productName = item.product_id?.name || item.variation_id?.name || "Sản phẩm";
                  const variationName = item.variation_id?.name || "";
                  const image = item.product_id?.images?.[0]?.url || item.variation_id?.image || null;
                  const price = item.variation_id?.price ?? item.product_id?.price ?? 0;
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        {image ? (
                          <img src={image} alt={productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">🐾</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{productName}</p>
                        {variationName && variationName !== productName && (
                          <p className="text-xs text-gray-500 truncate">{variationName}</p>
                        )}
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <span className="text-sm text-gray-900 font-medium flex-shrink-0">
                        {(price * item.quantity).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Phí vận chuyển:</span>
                  <span>{shippingFee.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-[#846551]">{finalTotal.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
