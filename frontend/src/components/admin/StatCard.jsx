export default function StatCard({ icon, label, value, trend, trendValue, color = 'orange' }) {
  const colors = {
    orange: 'from-orange-500 to-amber-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-rose-500'
  }

  const bgColors = {
    orange: 'bg-orange-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    red: 'bg-red-50'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend === 'up' ? '↗' : '↘'}</span>
              <span className="font-medium">{trendValue}</span>
              <span className="text-gray-500">compared to last month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-lg ${bgColors[color]} flex items-center justify-center`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}
