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

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await orderApi.getAllOrders(params);
      console.log("Orders response:", response);

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
      toast.error("Không thể tải danh sách đơn hàng");
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
    const statusMap = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
      packing: { label: "Đang đóng gói", color: "bg-purple-100 text-purple-700" },
      shipping: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
      completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
      refunded: { label: "Đã hoàn tiền", color: "bg-gray-100 text-gray-700" },
    };

    const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2c2c2c] mb-2">
            <InboxOutlined className="text-[#846551] text-[24px]" />
            Quản lý đơn hàng
          </h2>
          <p className="text-gray-500">
            Hiển thị {orders.length} trong tổng số {pagination.totalItems || 0} đơn hàng
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm theo mã đơn, tên hoặc email khách hàng..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-50 bg-white border-gray-200">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="packing">Đang đóng gói</SelectItem>
                <SelectItem value="shipping">Đang giao</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có đơn hàng nào</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-gray-700 font-semibold">
                      MÃ ĐƠN HÀNG
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      KHÁCH HÀNG
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      EMAIL
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      TỔNG TIỀN
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      TRẠNG THÁI
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">
                      NGÀY ĐẶT
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">
                      THAO TÁC
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow
                      key={order._id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <TableCell className="font-medium">
                        {order.orderCode || order.orderNumber || order._id}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order.customerName ||
                          order.customer?.name ||
                          order.addressSnapshot?.fullName ||
                          "Không xác định"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order.customerEmail ||
                          order.customer?.email ||
                          order.addressSnapshot?.email ||
                          "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(order.totalAmount || order.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-gray-600">
                        {(() => { const f = formatDate(order.createdAt); return (<><div>{f.date}</div><div className="text-xs text-gray-400">{f.time}</div></>); })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/quan-tri/don-hang/${order._id}`
                            )
                          }
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
