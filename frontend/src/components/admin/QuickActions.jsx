import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function QuickActions() {
  const navigate = useNavigate()
  const isAdmin = useMemo(() => {
    try {
      const rawUser = localStorage.getItem('pawhouse_user')
      const user = rawUser ? JSON.parse(rawUser) : null
      return Array.isArray(user?.roles) && user.roles.includes('admin')
    } catch {
      return false
    }
  }, [])

  const actions = [
    { icon: '📦', label: 'Quản lý sản phẩm', color: 'from-orange-500 to-amber-500', path: '/quan-tri/san-pham' },
    { icon: '🛍️', label: 'Quản lý đơn hàng', color: 'from-blue-500 to-cyan-500', path: '/quan-tri/don-hang' },
    { icon: '📊', label: 'Quản lý tồn kho', color: 'from-purple-500 to-pink-500', path: '/quan-tri/ton-kho' }
  ]

  const visibleActions = isAdmin
    ? [
        ...actions,
        { icon: '👥', label: 'Quản lý khách hàng', color: 'from-green-500 to-emerald-500', path: '/quan-tri/khach-hang' },
      ]
    : actions

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
      <div className="grid grid-cols-2 gap-3">
        {visibleActions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-linear-to-r ${action.color} text-white hover:shadow-lg hover:-translate-y-1 transition-all`}
          >
            <span className="text-3xl">{action.icon}</span>
            <span className="font-medium text-sm">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
