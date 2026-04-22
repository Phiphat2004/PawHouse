import { useState, useEffect } from 'react'
import { AdminLayout, StatCard, RecentOrders, TopProducts, QuickActions, RevenueChart } from '../../components/admin'
import { orderApi, productApi } from '../../services/api'
import { getAccounts } from '../../services/accountManagementService'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [productStats, setProductStats] = useState(null)
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

        const [orderRes, prodRes] = await Promise.allSettled(requests)

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
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [isAdmin])

  // Pending orders count
  const pendingOrders = stats?.byStatus?.pending || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="💰"
            label="Revenue This Month"
            value={loading ? '...' : `${formatCurrency(stats?.monthRevenue || 0)}`}
            // trend={revenueTrend?.trend}
            // trendValue={revenueTrend?.trendValue}
            color="orange"
          />
          <StatCard
            icon="🛍️"
            label="Orders This Month"
            value={loading ? '...' : `${stats?.monthOrderCount || 0}`}
            // trend={orderTrend?.trend}
            // trendValue={orderTrend?.trendValue}
            color="blue"
          />
          <StatCard
            icon="⏳"
            label="Pending Orders"
            value={loading ? '...' : `${pendingOrders}`}
            color="red"
          />
          <StatCard
            icon="📦"
            label="Total Products"
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
