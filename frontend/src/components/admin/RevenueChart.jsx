import { useState } from 'react'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function formatMonthLabel(dateStr) {
  // dateStr = "2026-03"
  const parts = String(dateStr || '').split('-')
  return parts.length > 1 ? `T${parseInt(parts[1], 10)}` : '-'
}

export default function RevenueChart({ dailyRevenue = [], monthlyRevenue = [], loading = false }) {
  const [period, setPeriod] = useState('week')

  // Build daily data for last 7 days
  const dailyMap = {}
  dailyRevenue.forEach((d) => {
    const key = d?.date || d?._id
    if (key) dailyMap[key] = d
  })
  const weekData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    const entry = dailyMap[key]
    weekData.push({
      day: DAY_LABELS[date.getDay()],
      value: Number(entry?.revenue) || 0,
      label: formatCurrency(entry?.revenue || 0),
      count: Number(entry?.count) || 0,
    })
  }

  // Build monthly data
  const monthData = monthlyRevenue.map((m) => ({
    day: formatMonthLabel(m?.month || m?._id),
    value: Number(m?.revenue) || 0,
    label: formatCurrency(m?.revenue || 0),
    count: Number(m?.count) || 0,
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
                  ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                period === 'month'
                  ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white'
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
                <span className="text-[11px] font-semibold text-gray-700 text-center min-h-8 leading-4">
                  {item.label}
                </span>
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className={`w-full rounded-t-lg transition-opacity ${
                      item.value > 0
                        ? 'bg-linear-to-t from-orange-500 to-amber-500'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">{item.day}</span>
                <span className="text-xs text-gray-500">{item.count} đơn</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
