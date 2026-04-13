import { Link } from 'react-router-dom'

const statusConfig = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  packing: { label: 'Đang đóng gói', color: 'bg-indigo-100 text-indigo-700' },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Hoàn tiền', color: 'bg-gray-100 text-gray-700' }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} ngày trước`
}

export default function RecentOrders({ orders = [], loading = false }) {

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        <div className="p-12 text-center text-gray-400">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
          <Link to="/quan-tri/don-hang" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
            Xem tất cả →
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center text-gray-400">Chưa có đơn hàng nào</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => {
                const st = statusConfig[order.status] || statusConfig.pending
                return (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{order.orderCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{order.addressSnapshot?.fullName || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{order.items?.length || 0} sản phẩm</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timeAgo(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/quan-tri/don-hang/${order._id}`}
                        className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
