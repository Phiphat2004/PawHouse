// Lê Nhựt Hào
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Vui lòng đăng nhập để xem chi tiết đơn hàng");
      navigate("/login");
      return;
    }
    fetchOrderDetail();
  }, [navigate, id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrderDetail(id);

      if (response.success) {
        setOrder(response.data);
        // Fetch product images from product-service (order-service can't join across services)
        const items = response.data?.items || [];
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
  };

  const handleCancelOrder = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      await orderApi.cancelOrder(id);
      alert("Đơn hàng đã được hủy");
      fetchOrderDetail();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.data?.message || "Không thể hủy đơn hàng");
    }
  };

  const handleExportBill = async () => {
    try {
      const response = await fetch(`/api/orders/${id}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `order_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Không thể xuất hóa đơn");
      }
    } catch (err) {
      console.error("Failed to export bill:", err);
      alert("Không thể xuất hóa đơn");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { text: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
      packing: { text: "Đang đóng gói", color: "bg-purple-100 text-purple-800" },
      shipping: { text: "Đang giao hàng", color: "bg-indigo-100 text-indigo-800" },
      completed: { text: "Hoàn thành", color: "bg-green-100 text-green-800" },
      cancelled: { text: "Đã hủy", color: "bg-red-100 text-red-800" },
      refunded: { text: "Đã hoàn tiền", color: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800" };
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
              className="inline-block mt-4 bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition"
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
            className="text-[#846551] hover:text-[#6d5041] font-medium"
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
              <button
                onClick={handleExportBill}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Xuất hóa đơn
              </button>
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
                  const product = variation?.product_id;
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
                  <span className="text-[#846551]">
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
      <Footer />
    </div>
  );
}

