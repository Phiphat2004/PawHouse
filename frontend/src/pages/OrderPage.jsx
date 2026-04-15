// Lê Nhựt Hào
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { orderApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";

export default function OrderPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Vui lòng đăng nhập để xem đơn hàng");
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [navigate, statusFilter, searchQuery, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getMyOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });

      setOrders(response.orders || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      await orderApi.cancelOrder(orderId);
      alert("Đơn hàng đã được hủy");
      fetchOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.data?.message || "Không thể hủy đơn hàng");
    }
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Đang tải đơn hàng...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
          <p className="text-gray-600">
            {pagination.total > 0
              ? `${pagination.total} đơn hàng`
              : "Bạn chưa có đơn hàng nào"}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#846551] focus:border-transparent bg-white text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchInput && (
              <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#846551] text-white rounded-lg hover:bg-[#6d5041] transition text-sm font-medium"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "shipping", "completed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? "bg-[#846551] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status === "all"
                  ? "Tất cả"
                  : status === "pending"
                  ? "Chờ xử lý"
                  : status === "confirmed"
                  ? "Đã xác nhận"
                  : status === "shipping"
                  ? "Đang giao"
                  : status === "completed"
                  ? "Hoàn thành"
                  : "Đã hủy"}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chưa có đơn hàng
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn chưa có đơn hàng nào trong danh sách này
            </p>
            <Link
              to="/"
              className="inline-block bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mã đơn: {order.orderCode || order._id}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Ngày đặt:{" "}
                      {new Date(order.createdAt || order.created_at).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                    <p className="text-sm text-gray-700">
                      {order.items?.length || 0} sản phẩm
                    </p>
                    {order.addressSnapshot && (
                      <p className="text-sm text-gray-600 mt-2">
                        Giao đến: {order.addressSnapshot.fullName} -{" "}
                        {order.addressSnapshot.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-[#846551]">
                      {(order.total || order.final_price || 0).toLocaleString(
                        "vi-VN"
                      )}
                      ₫
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/don-hang/${order._id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        Xem chi tiết
                      </Link>
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-gray-600">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

