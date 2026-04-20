import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InboxOutlined, ArrowLeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { AdminLayout } from "../../components/admin";
import { orderApi } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelPopupOpen, setCancelPopupOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrderDetail(id);
      console.log("Order detail response:", response);

      if (response.order) {
        setOrder(response.order);
      } else {
        setError("Không tìm thấy đơn hàng");
      }
    } catch (err) {
      console.error("Failed to fetch order detail:", err);
      setError("Đã xảy ra lỗi khi tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const submitStatusChange = async (newStatus, note = "Cập nhật từ trang quản trị") => {
    try {
      setUpdatingStatus(true);
      await orderApi.updateOrderStatus(id, newStatus, note);
      // Notify stock history pages (other tabs/routes) to refetch immediately
      try {
        localStorage.setItem('stockMovementUpdated', JSON.stringify({ t: Date.now(), orderId: id, status: newStatus }));
      } catch (err) {
        console.warn("Failed to notify other tabs (localStorage):", err);
      }
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      // Refresh toàn bộ order để statusHistory được cập nhật
      await fetchOrderDetail();
      return true;
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái đơn hàng");
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!order) return;

    if (newStatus === "cancelled") {
      setCancelReason("");
      setCancelPopupOpen(true);
      return;
    }

    await submitStatusChange(newStatus);
  };

  const handleConfirmCancelOrder = async () => {
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.error("Vui lòng nhập lý do hủy đơn");
      return;
    }

    const ok = await submitStatusChange("cancelled", trimmedReason);
    if (ok) {
      setCancelPopupOpen(false);
      setCancelReason("");
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
        <div className="flex items-center justify-center min-h-100">
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
            <ArrowLeftOutlined className="text-[18px]" /> Quay lại danh sách đơn hàng
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
          <ArrowLeftOutlined className="text-[18px]" /> Quay lại danh sách đơn hàng
        </Button>

        <div className="flex items-center gap-2 mb-2">
          <InboxOutlined className="text-[#846551] text-[24px]" />
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
                {order.orderCode || order.orderNumber || order._id}
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
            <p className="text-gray-500 text-sm mb-4">Hành động cập nhật trạng thái đơn hàng</p>
            <div className="flex items-center gap-3">
              {order.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updatingStatus}
                    className="bg-blue-300 hover:bg-blue-500 text-white shadow-sm"
                  >
                    Xác nhận đơn
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                    variant="destructive"
                    className="shadow-sm border border-red-200"
                  >
                    Hủy đơn
                  </Button>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <Button
                    onClick={() => handleStatusChange('packing')}
                    disabled={updatingStatus}
                    className="bg-purple-200 hover:bg-purple-400 text-white shadow-sm"
                  >
                    Chuẩn bị hàng
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                    variant="destructive"
                    className="shadow-sm border border-red-200"
                  >
                    Hủy đơn
                  </Button>
                </>
              )}
              {order.status === 'packing' && (
                <>
                  <Button
                    onClick={() => handleStatusChange('shipping')}
                    disabled={updatingStatus}
                    className="bg-indigo-300 hover:bg-indigo-500 text-white shadow-sm"
                  >
                    Giao hàng
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                    variant="destructive"
                    className="shadow-sm border border-red-200"
                  >
                    Hủy đơn
                  </Button>
                </>
              )}
              {order.status === 'shipping' && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  disabled={updatingStatus}
                  className="bg-green-300 hover:bg-green-500 text-white shadow-sm"
                >
                  Đã giao hàng
                </Button>
              )}

              {['completed', 'cancelled', 'refunded'].includes(order.status) && (
                <span className="text-sm text-gray-500 italic bg-gray-50 px-4 py-2 rounded-md border border-gray-100 font-medium">
                  Đơn hàng đã kết thúc, không thể thay đổi trạng thái
                </span>
              )}
              {updatingStatus && (
                <span className="text-gray-500 text-sm animate-pulse ml-2 flex items-center font-medium">
                  <LoadingOutlined className="-ml-1 mr-2 h-4 w-4 text-gray-500" spin />
                  Đang xử lý...
                </span>
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

      {cancelPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h4 className="text-lg font-semibold text-gray-900">Lý do hủy đơn</h4>
              <p className="mt-1 text-sm text-gray-500">
                Vui lòng nhập lý do trước khi xác nhận hủy đơn hàng.
              </p>
            </div>
            <div className="px-5 py-4">
              <textarea
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (updatingStatus) return;
                  setCancelPopupOpen(false);
                  setCancelReason("");
                }}
                disabled={updatingStatus}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancelOrder}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
