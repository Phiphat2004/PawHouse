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
  const [cancelPopup, setCancelPopup] = useState({
    open: false,
    orderId: null,
    reason: "",
    error: "",
  });
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Please log in to view your orders");
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
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Pending", color: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
      confirmed: { text: "Confirmed", color: "bg-blue-100 text-blue-800 border border-blue-200" },
      packing: { text: "Packing", color: "bg-purple-100 text-purple-800 border border-purple-200" },
      shipping: { text: "Shipping", color: "bg-indigo-100 text-indigo-800 border border-indigo-200" },
      completed: { text: "Completed", color: "bg-green-100 text-green-800 border border-green-200" },
      cancelled: { text: "Cancelled", color: "bg-red-100 text-red-800 border border-red-200" },
      refunded: { text: "Refunded", color: "bg-gray-100 text-gray-800 border border-gray-200" },
    };
    const statusInfo = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800 border border-gray-200" };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleCancelOrder = async (orderId) => {
    setCancelPopup({
      open: true,
      orderId,
      reason: "",
      error: "",
    });
  };

  const closeCancelPopup = () => {
    if (cancelLoadingId) return;
    setCancelPopup({
      open: false,
      orderId: null,
      reason: "",
      error: "",
    });
  };

  const submitCancelOrder = async () => {
    const reason = cancelPopup.reason.trim();
    if (!reason) {
      setCancelPopup((prev) => ({
        ...prev,
        error: "Please enter a reason for cancellation",
      }));
      return;
    }

    try {
      setCancelLoadingId(cancelPopup.orderId);
      await orderApi.cancelOrder(cancelPopup.orderId, reason);
      alert("Order has been cancelled");
      closeCancelPopup();
      fetchOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.data?.message || "Unable to cancel order");
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Loading orders...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            {pagination.total > 0
              ? `${pagination.total} order(s)`
              : "You have no orders yet"}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order code or product name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
          >
            Search
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
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status === "pending"
                  ? "Pending"
                  : status === "confirmed"
                  ? "Confirmed"
                  : status === "shipping"
                  ? "Shipping"
                  : status === "completed"
                  ? "Completed"
                  : "Cancelled"}
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
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn No Orders Yet nào trong danh sách này
            </p>
            <Link
              to="/"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Continue Shopping
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
                        Order #: {order.orderCode || order._id}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Date Placed:{" "}
                      {new Date(order.createdAt || order.created_at).toLocaleString(
                        "en-US"
                      )}
                    </p>
                    <p className="text-sm text-gray-700">
                      {order.items?.length || 0} item(s)
                    </p>
                    {order.addressSnapshot && (
                      <p className="text-sm text-gray-600 mt-2">
                        Deliver to: {order.addressSnapshot.fullName} -{" "}
                        {order.addressSnapshot.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-orange-600">
                      {(order.total || order.final_price || 0).toLocaleString(
                        "en-US"
                      )}
                      ₫
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/don-hang/${order._id}`}
                        className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition text-sm font-medium"
                      >
                        View Details
                      </Link>
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                        >
                          Cancel Order
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
                  className="px-4 py-2 border border-orange-200 text-orange-700 rounded-lg bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-orange-200 text-orange-700 rounded-lg bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {cancelPopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              <p className="mt-1 text-sm text-gray-600">Please enter a reason for cancellation so we can better assist you.</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                rows={4}
                value={cancelPopup.reason}
                onChange={(e) =>
                  setCancelPopup((prev) => ({ ...prev, reason: e.target.value, error: "" }))
                }
                placeholder="Enter cancellation reason..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              {cancelPopup.error && (
                <p className="mt-2 text-sm text-red-600">{cancelPopup.error}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button
                onClick={closeCancelPopup}
                disabled={!!cancelLoadingId}
                className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-60"
              >
                Close
              </button>
              <button
                onClick={submitCancelOrder}
                disabled={!!cancelLoadingId}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelLoadingId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

