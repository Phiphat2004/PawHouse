import { useState } from 'react'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatShortCurrency(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`
  return `${amount}`
}

function formatMonthLabel(dateStr) {
  // dateStr = "2026-03"
  const parts = dateStr.split('-')
  return `T${parseInt(parts[1], 10)}`
}

export default function RevenueChart({ dailyRevenue = [], monthlyRevenue = [], loading = false }) {
  const [period, setPeriod] = useState('week')

  // Build daily data for last 7 days
  const dailyMap = {}
  dailyRevenue.forEach(d => { dailyMap[d._id] = d })
  const weekData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    const entry = dailyMap[key]
    weekData.push({
      day: DAY_LABELS[date.getDay()],
      value: entry?.revenue || 0,
      label: formatShortCurrency(entry?.revenue || 0),
      count: entry?.count || 0
    })
  }

  // Build monthly data
  const monthData = monthlyRevenue.map(m => ({
    day: formatMonthLabel(m._id),
    value: m.revenue,
    label: formatShortCurrency(m.revenue),
    count: m.count
  }))

  const currentData = period === 'week' ? weekData : monthData
  const maxValue = Math.max(...currentData.map(d => d.value), 1)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Doanh thu</h2>
        </div>
        <div className="p-12 text-center text-gray-400">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Doanh thu</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                period === 'week'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                period === 'month'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tháng
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chưa có dữ liệu doanh thu
          </div>
        ) : (
          <div className="flex items-end justify-between gap-4 h-64">
            {currentData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-48 group">
                  <div
                    className={`w-full rounded-t-lg hover:opacity-80 transition-opacity relative ${
                      item.value > 0
                        ? 'bg-gradient-to-t from-orange-500 to-amber-500'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.label} ({item.count} đơn)
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
