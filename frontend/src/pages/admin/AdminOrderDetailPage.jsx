import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
import { AdminLayout } from "../../components/admin";
import { orderApi } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrderDetail(id);
      console.log("Order detail response:", response);

      if (response.success || response.data) {
        setOrder(response.data || response);
      } else {
        setError("Không tìm thấy đơn hàng");
      }
    } catch (err) {
      console.error("Failed to fetch order detail:", err);
      setError("Đã xảy ra lỗi khi tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      await orderApi.updateOrderStatus(id, newStatus);
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      // Refresh toàn bộ order để statusHistory được cập nhật
      await fetchOrderDetail();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN");
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Đang tải chi tiết đơn hàng...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/quan-tri/don-hang")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={18} /> Quay lại danh sách đơn hàng
          </Button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 text-lg">
              {error || "Không tìm thấy đơn hàng"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/quan-tri/don-hang")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} /> Quay lại danh sách đơn hàng
        </Button>

        <div className="flex items-center gap-2 mb-2">
          <Package size={24} className="text-[#846551]" />
          <h2 className="text-2xl font-bold text-[#2c2c2c]">
            Chi tiết đơn hàng
          </h2>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">Mã đơn hàng</p>
              <p className="text-lg font-semibold text-gray-900">
                {order.orderId || order._id}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Ngày đặt</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Tổng tiền</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPrice(order.totalAmount || order.total)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Trạng thái</p>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>

          {/* Status Change */}
          <div className="border-t pt-6">
            <p className="text-gray-500 text-sm mb-2">Cập nhật trạng thái đơn hàng</p>
            <div className="flex items-center gap-4">
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus || ['cancelled', 'refunded'].includes(order.status)}
              >
                <SelectTrigger className="w-[200px] bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="packing">Đang đóng gói</SelectItem>
                  <SelectItem value="shipping">Đang giao</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
              {['cancelled', 'refunded'].includes(order.status) && (
                <span className="text-sm text-gray-400 italic">Đơn hàng đã kết thúc, không thể thay đổi trạng thái</span>
              )}
              {updatingStatus && (
                <span className="text-gray-500 text-sm">Đang cập nhật...</span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Thông tin khách hàng
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Họ tên</p>
                <p className="text-gray-900 font-medium">
                  {order.customerName ||
                    order.customer?.name ||
                    order.addressSnapshot?.fullName ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-gray-900 font-medium">
                  {order.customerEmail ||
                    order.customer?.email ||
                    order.addressSnapshot?.email ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Số điện thoại</p>
                <p className="text-gray-900 font-medium">
                  {order.customerPhone ||
                    order.shippingAddress?.phone ||
                    order.addressSnapshot?.phone ||
                    "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Địa chỉ giao hàng
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Địa chỉ</p>
                <p className="text-gray-900 font-medium">
                  {order.shippingAddress?.street ||
                    order.shipAddress?.street ||
                    order.addressSnapshot?.addressLine ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Tỉnh/Thành phố</p>
                <p className="text-gray-900 font-medium">
                  {order.shippingAddress?.city ||
                    order.shipAddress?.city ||
                    order.addressSnapshot?.city ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Quận/Huyện</p>
                <p className="text-gray-900 font-medium">
                  {order.shippingAddress?.district ||
                    order.shipAddress?.district ||
                    order.addressSnapshot?.district ||
                    "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Sản phẩm trong đơn ({order.items?.length || 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-500 font-semibold text-sm">
                    Tên sản phẩm
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-semibold text-sm">
                    SKU
                  </th>
                  <th className="text-center py-3 px-4 text-gray-500 font-semibold text-sm">
                    Số lượng
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold text-sm">
                    Đơn giá
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold text-sm">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {item.productName ||
                          item.product?.name ||
                          item.name ||
                          "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.sku || item.product?.sku || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {formatPrice(item.price || item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                        {formatPrice(
                          (item.price || item.unitPrice) * item.quantity
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 text-center text-gray-500"
                    >
                      Không có sản phẩm nào trong đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Tóm tắt đơn hàng
          </h3>
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="text-gray-900 font-medium">
                {formatPrice(order.subtotal || order.totalAmount)}
              </span>
            </div>
            {order.shippingCost && order.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(order.shippingCost)}
                </span>
              </div>
            )}
            {order.taxAmount && order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Thuế:</span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(order.taxAmount)}
                </span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-900 font-bold">Tổng cộng:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(order.totalAmount || order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {order.payment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Thông tin thanh toán
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-500 text-sm">Phương thức</p>
                <p className="text-gray-900 font-medium capitalize">
                  {order.payment.method === 'cash' ? 'Tiền mặt (COD)' : order.payment.method || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Trạng thái thanh toán</p>
                <Badge className={order.payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {order.payment.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Số tiền</p>
                <p className="text-gray-900 font-medium">{formatPrice(order.payment.amount)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch sử trạng thái</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {[...order.statusHistory].reverse().map((history, index) => {
                  const statusLabels = {
                    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', packing: 'Đang đóng gói',
                    shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy', refunded: 'Đã hoàn tiền'
                  };
                  const statusColors = {
                    pending: 'bg-yellow-400', confirmed: 'bg-blue-400', packing: 'bg-purple-400',
                    shipping: 'bg-indigo-400', completed: 'bg-green-500', cancelled: 'bg-red-400', refunded: 'bg-gray-400'
                  };
                  return (
                    <div key={index} className="flex items-start gap-4 pl-10 relative">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full mt-1.5 ${statusColors[history.to] || 'bg-gray-400'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {statusLabels[history.to] || history.to}
                          {history.from && (
                            <span className="text-gray-400 font-normal ml-2 text-xs">(từ: {statusLabels[history.from] || history.from})</span>
                          )}
                        </p>
                        {history.note && <p className="text-xs text-gray-500 mt-0.5">{history.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(history.at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
