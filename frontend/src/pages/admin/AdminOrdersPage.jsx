import { useState, useEffect, useCallback } from "react";
import { SearchOutlined, InboxOutlined } from "@ant-design/icons";
import { AdminLayout } from "../../components/admin";
import { orderApi } from "../../services/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/layout/Pagination";
import { toast } from "react-toastify";

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
  });
  const [stats, setStats] = useState(null);

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "packing", label: "Packing" },
    { value: "shipping", label: "Shipping" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  const statusMeta = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    },
    packing: {
      label: "Packing",
      className: "bg-purple-100 text-purple-800 border border-purple-200",
    },
    shipping: {
      label: "Shipping",
      className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
    refunded: {
      label: "Refunded",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    },
  };

  const normalizeStatus = (value) => String(value || "").toLowerCase();

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await orderApi.getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    }
    fetchStats();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (statusFilter && normalizeStatus(statusFilter) !== "all") {
        params.status = normalizeStatus(statusFilter);
      }

      const response = await orderApi.getAllOrders(params);

      setOrders(response.orders || []);
      if (response.pagination) {
        const totalPages = response.pagination.pages || 1;
        setPagination({
          totalPages,
          totalItems: response.pagination.total || 0,
        });

        // Keep current page within valid range when filters shrink the result set.
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (date) => {
    if (!date) return { date: "-", time: "" };
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
  };

  const formatPrice = (price) => {
    if (!price) return "0đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const normalized = normalizeStatus(status);

    const info = statusMeta[normalized] || {
      label: status || "Unknown",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    };

    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-medium text-sm ${info.className}`}>
        {info.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2c2c2c] mb-2">
            <InboxOutlined className="text-[#846551] text-[24px]" />
            Order Management
          </h2>
          <p className="text-gray-500">
            Showing {orders.length} of {pagination.totalItems || 0} orders
          </p>
        </div>

        {/* Order Status Overview */}
        {stats?.byStatus && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Order Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                "pending",
                "confirmed",
                "packing",
                "shipping",
                "completed",
                "cancelled",
                "refunded",
              ].map((key) => {
                const item = statusMeta[key];
                return (
                  <div
                    key={key}
                    className={`rounded-xl p-4 text-center border shadow-sm ${item.className}`}
                  >
                    <div className="text-2xl font-bold text-inherit">
                      {stats.byStatus[key] || 0}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <SearchOutlined className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by order code, customer name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none transition focus-visible:ring-2 focus-visible:ring-[#846551]/20"
              />
            </div>
            <Select
              value={normalizeStatus(statusFilter)}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-60 bg-white border-gray-200">
                <span>
                  {
                    statusOptions.find(
                      (item) => item.value === normalizeStatus(statusFilter)
                    )?.label || "All Statuses"
                  }
                </span>
              </SelectTrigger>

              <SelectContent>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-200 px-3 text-sm whitespace-nowrap text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Reset
            </Button>
          </div>

          <div className="mt-4">
            <span className="inline-flex rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
              Showing {orders.length} / {pagination.totalItems || 0} orders
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-700 font-semibold">
                      ORDER ID
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      CUSTOMER
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-right">
                      TOTAL
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      STATUS
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      ORDER DATE
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((order, index) => {
                    const customerName =
                      order.customerName ||
                      order.customer?.name ||
                      order.addressSnapshot?.fullName ||
                      "Unknown";

                    const customerEmail =
                      order.customerEmail ||
                      order.customer?.email ||
                      order.addressSnapshot?.email ||
                      "-";

                    const created = formatDate(order.createdAt);

                    return (
                      <TableRow
                        key={order._id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
                      >
                        <TableCell className="font-semibold text-[#1f3b64]">
                          {order.orderCode || order.orderId || order._id}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customerEmail}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold text-gray-900">
                          {formatPrice(order.totalAmount || order.total)}
                        </TableCell>

                        <TableCell>{getStatusBadge(order.status)}</TableCell>

                        <TableCell className="text-gray-700">
                          <div>{created.date}</div>
                          <div className="text-xs text-gray-400">{created.time}</div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/quan-tri/don-hang/${order._id}`)}
                            className="h-8 rounded-lg text-[#846551] border-[#d8c8bc] bg-[#f6f1ed] hover:bg-[#efe6df] hover:text-[#6d5443] font-medium px-3"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              page={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}