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
      alert("Please log in to proceed to checkout");
      navigate("/login");
      return;
    }

    if (!selectedItemIds || selectedItemIds.length === 0) {
      alert("No products selected for checkout");
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
        name: user.profile?.fullName || user.fullName || user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        city: user.profile?.address?.city || user.address?.city || user.city || prev.city,
        district: user.profile?.address?.district || user.address?.district || user.district || prev.district,
        ward: user.profile?.address?.ward || user.address?.ward || user.ward || prev.ward,
        address: user.profile?.address?.addressLine || user.address?.addressLine || user.address?.street || prev.address,
      }));
    } catch {
      // Not required — skip on error
    }
  };

  const fetchCartItems = async () => {
    try {
      // Cart API returns { message, cart, items }
      const response = await cartApi.getCart();
      const items = response.items || response.cart?.items || [];
      const selectedItems = items.filter((item) =>
        selectedItemIds.includes(item._id)
      );
      setCartItems(selectedItems);
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
        title: "Error",
        message: "Please fill in all required fields (full name, phone, address)",
      });
      return;
    }

    if (cartItems.length === 0) {
      setToast({
        type: "error",
        title: "Error",
        message: "No products found for checkout",
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
          productName: item.product_id?.name || item.variation_id?.name || 'Product',
          variationName: item.variation_id?.name || '',
          image: item.product_id?.images?.[0]?.url || item.variation_id?.image || '',
          unitPrice: item.variation_id?.price ?? item.product_id?.price ?? 0,
          quantity: item.quantity,
          lineTotal: (item.variation_id?.price ?? item.product_id?.price ?? 0) * item.quantity
        })),
        paymentMethod: 'cash',
        note: formData.note,
        shippingFee: shippingFee,
        addressSnapshot: {
          fullName: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          city: formData.city || '',
          district: formData.district || '',
          ward: formData.ward || '',
          addressLine: formData.address,
        },
      };

      const response = await orderApi.createOrder(orderData);
      const orderId = response.order?._id || response.data?._id;

      if (response.order || response.message || response.success) {
        // Remove ordered products from cart
        try {
          for (const item of cartItems) {
            const productId = item.product_id?._id || item.product_id;
            if (productId) {
              await cartApi.removeItem(productId);
            }
          }
        } catch (cartErr) {
          // Don't block flow if removing from cart fails
          console.warn("Could not remove items from cart:", cartErr);
        }

        setToast({
          type: "success",
          title: "Success!",
          message: response.message || "Order placed successfully",
        });

        setTimeout(() => {
          if (orderId) {
            navigate(`/don-hang/${orderId}`);
          } else {
            navigate('/don-hang');
          }
        }, 1500);
        // Notify other tabs/pages that stock movements may have changed (reserve created)
        try {
          const payload = { t: Date.now(), orderId };
          // include reserved movements from API response if provided
          if (response.reservedMovements) payload.movements = response.reservedMovements;
          localStorage.setItem('stockMovementUpdated', JSON.stringify(payload));
        } catch { }
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      setToast({
        type: "error",
        title: "Error",
        message: err.message || "Unable to create order. Please try again.",
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
  const shippingFee = 0;
  const finalTotal = subtotal + shippingFee;

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="0901234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Province / District / Ward */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province/City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ho Chi Minh City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="District 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward/Commune</label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    placeholder="Ben Nghe Ward"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Detailed Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="House number, street name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="flex items-center p-3 border border-orange-500 rounded-lg bg-orange-50">
                  <span className="text-orange-600 font-medium">💵 Cash on Delivery (COD)</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Notes for the delivery driver (optional)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : "Place Order"}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Order</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item) => {
                  const productName = item.product_id?.name || item.variation_id?.name || "Product";
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
                  <span>Subtotal:</span>
                  <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Shipping Fee:</span>
                  <span>{shippingFee === 0 ? "Free" : `${shippingFee.toLocaleString("vi-VN")}₫`}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-orange-600">{finalTotal.toLocaleString("vi-VN")}₫</span>
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
