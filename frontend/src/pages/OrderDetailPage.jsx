// Lê Nhựt Hào
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { orderApi, productApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [cancelPopupOpen, setCancelPopupOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrderDetail(id);

      if (response.order) {
        setOrder(response.order);
        // Fetch product images from product-service (order-service can't join across services)
        const items = response.order?.items || [];
        const idsToFetch = [...new Set(
          items
            .filter(item => !item.image)
            .map(item => item.productId || item.variationId)
            .filter(Boolean)
            .map(id => id.toString())
        )];
        if (idsToFetch.length > 0) {
          const results = await Promise.allSettled(
            idsToFetch.map(pid => productApi.getById(pid))
          );
          const imgMap = {};
          results.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
              const p = res.value?.product;
              if (p?.images?.[0]?.url) {
                imgMap[idsToFetch[idx]] = p.images[0].url;
              }
            }
          });
          setProductImages(imgMap);
        }
      } else {
        setError("Không tìm thấy đơn hàng");
      }
    } catch (err) {
      console.error("Failed to fetch order detail:", err);
      setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Vui lòng đăng nhập để xem chi tiết đơn hàng");
      navigate("/login");
      return;
    }
    fetchOrderDetail();
  }, [navigate, fetchOrderDetail]);

  const handleCancelOrder = async () => {
    setCancelReason("");
    setCancelReasonError("");
    setCancelPopupOpen(true);
  };

  const submitCancelOrder = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelReasonError("Vui lòng nhập lý do hủy đơn");
      return;
    }

    try {
      setCancelLoading(true);
      await orderApi.cancelOrder(id, reason);
      alert("Đơn hàng đã được hủy");
      setCancelPopupOpen(false);
      fetchOrderDetail();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
      confirmed: { text: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border border-blue-200" },
      packing: { text: "Đang đóng gói", color: "bg-purple-100 text-purple-800 border border-purple-200" },
      shipping: { text: "Đang giao hàng", color: "bg-indigo-100 text-indigo-800 border border-indigo-200" },
      completed: { text: "Hoàn thành", color: "bg-green-100 text-green-800 border border-green-200" },
      cancelled: { text: "Đã hủy", color: "bg-red-100 text-red-800 border border-red-200" },
      refunded: { text: "Đã hoàn tiền", color: "bg-gray-100 text-gray-800 border border-gray-200" },
    };
    const statusInfo = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800 border border-gray-200" };
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Không tìm thấy đơn hàng"}
            </h2>
            <Link
              to="/don-hang"
              className="inline-block mt-4 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-6">
          <Link
            to="/don-hang"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Mã đơn hàng: {order.orderCode || order._id}
              </h1>
              <p className="text-gray-600">
                Ngày đặt:{" "}
                {new Date(order.createdAt || order.created_at).toLocaleString(
                  "vi-VN"
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(order.status)}
              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Sản phẩm đã đặt
            </h2>

            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  const variation = item.variationId || item.variation_id;
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-4 border rounded-lg"
                    >
                      <img
                        src={
                          item.image ||
                          productImages[(item.productId || item.variationId)?.toString()] ||
                          "/placeholder.png"
                        }
                        alt={item.productName || "Sản phẩm"}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.productName || variation?.name || "Sản phẩm"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Đơn giá:{" "}
                          {(item.unitPrice || item.price || 0).toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {(item.lineTotal ||
                            (item.unitPrice || item.price || 0) *
                              item.quantity).toLocaleString("vi-VN")}
                          ₫
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">Không có sản phẩm</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin đơn hàng
              </h2>

              {/* Shipping Address */}
              {order.addressSnapshot && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Địa chỉ giao hàng
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.addressSnapshot.fullName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.addressSnapshot.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.addressSnapshot.addressLine}
                    {order.addressSnapshot.ward && `, ${order.addressSnapshot.ward}`}
                    {order.addressSnapshot.district && `, ${order.addressSnapshot.district}`}
                    {order.addressSnapshot.city && `, ${order.addressSnapshot.city}`}
                  </p>
                </div>
              )}

              {/* Payment Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Phương thức thanh toán
                </h3>
                <p className="text-sm text-gray-600">
                  Thanh toán khi nhận hàng (COD)
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Trạng thái thanh toán:{' '}
                  <span
                    className={
                      order.payment?.status === 'paid'
                        ? 'text-green-600 font-medium'
                        : order.payment?.status === 'failed'
                        ? 'text-red-600 font-medium'
                        : 'text-yellow-600 font-medium'
                    }
                  >
                    {order.payment?.status === 'paid'
                      ? 'Đã thanh toán'
                      : order.payment?.status === 'failed'
                      ? 'Thất bại'
                      : 'Chưa thanh toán'}
                  </span>
                </p>
                {order.payment?.paidAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Thanh toán lúc: {new Date(order.payment.paidAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>

              {/* Order Note */}
              {order.note && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
                  <p className="text-sm text-gray-600">{order.note}</p>
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{(order.subtotal || 0).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {(order.shippingFee || 0).toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-orange-600">
                    {(order.total || order.final_price || 0).toLocaleString(
                      "vi-VN"
                    )}
                    ₫
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {cancelPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Hủy đơn hàng</h3>
              <p className="mt-1 text-sm text-gray-600">Vui lòng nhập lý do hủy đơn để cửa hàng hỗ trợ bạn tốt hơn.</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                rows={4}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelReasonError("");
                }}
                placeholder="Nhập lý do hủy..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              {cancelReasonError && (
                <p className="mt-2 text-sm text-red-600">{cancelReasonError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button
                onClick={() => {
                  if (cancelLoading) return;
                  setCancelPopupOpen(false);
                }}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-60"
              >
                Đóng
              </button>
              <button
                onClick={submitCancelOrder}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

