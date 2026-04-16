import { useState, useEffect } from 'react'
import { AdminLayout, StatCard, RecentOrders, TopProducts, QuickActions, RevenueChart } from '../../components/admin'
import { orderApi, productApi } from '../../services/api'
import { getAccounts } from '../../services/accountManagementService'

function formatCurrency(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`
  return `${amount}`
}

function calcTrend(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? { trend: 'up', trendValue: '+100%' } : null
  }
  const pct = ((current - previous) / previous * 100).toFixed(1)
  return {
    trend: pct >= 0 ? 'up' : 'down',
    trendValue: `${pct >= 0 ? '+' : ''}${pct}%`
  }
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [productStats, setProductStats] = useState(null)
  const [customerCount, setCustomerCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('pawhouse_user')
      const user = rawUser ? JSON.parse(rawUser) : null
      setIsAdmin(Array.isArray(user?.roles) && user.roles.includes('admin'))
    } catch {
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const requests = [
          orderApi.getDashboardStats(),
          productApi.getAll(),
        ]

        if (isAdmin) {
          requests.push(getAccounts({ limit: 1 }))
        }

        const [orderRes, prodRes, accountRes] = await Promise.allSettled(requests)

        if (orderRes.status === 'fulfilled') {
          setStats(orderRes.value)
        }
        if (prodRes.status === 'fulfilled') {
          const data = prodRes.value
          setProductStats({
            total: data.pagination?.total || data.products?.length || 0,
            active: data.products?.filter(p => p.isActive).length || 0
          })
        }
        if (accountRes && accountRes.status === 'fulfilled') {
          setCustomerCount(accountRes.value.pagination?.totalItems || accountRes.value.accounts?.length || 0)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [isAdmin])

  // Revenue trend
  const revenueTrend = stats ? calcTrend(stats.monthRevenue, stats.lastMonthRevenue) : null
  // Order trend
  const orderTrend = stats ? calcTrend(stats.monthOrderCount, stats.lastMonthOrderCount) : null

  // Pending orders count
  const pendingOrders = stats?.byStatus?.pending || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="💰"
            label="Doanh thu tháng này"
            value={loading ? '...' : `${formatCurrency(stats?.monthRevenue || 0)}`}
            // trend={revenueTrend?.trend}
            // trendValue={revenueTrend?.trendValue}
            color="orange"
          />
          <StatCard
            icon="🛍️"
            label="Đơn hàng tháng này"
            value={loading ? '...' : `${stats?.monthOrderCount || 0}`}
            // trend={orderTrend?.trend}
            // trendValue={orderTrend?.trendValue}
            color="blue"
          />
          <StatCard
            icon="⏳"
            label="Đơn chờ xử lý"
            value={loading ? '...' : `${pendingOrders}`}
            color="red"
          />
          <StatCard
            icon="📦"
            label="Tổng sản phẩm"
            value={loading ? '...' : `${productStats?.total || 0}`}
            color="purple"
          />
        </div>



        {/* Revenue Chart & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart
              dailyRevenue={stats?.dailyRevenue || []}
              monthlyRevenue={stats?.monthlyRevenue || []}
              loading={loading}
            />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrders orders={stats?.recentOrders || []} loading={loading} />

        {/* Top Products */}
        <TopProducts products={stats?.topProducts || []} loading={loading} />
      </div>
    </AdminLayout>
  )
}
