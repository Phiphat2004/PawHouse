import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Shield, BadgeCheck, Calendar, Camera, Settings } from 'lucide-react'
import { AdminLayout } from '@/components/admin'
import { authApi } from '@/utils/services/api'
import { ROUTES, STORAGE_KEYS } from '@/utils/constants'

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
  return date.toLocaleDateString('vi-VN')
}

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')

      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        setError('Phiên đăng nhập không tồn tại')
        setLoading(false)
        return
      }

      try {
        const data = await authApi.me()
        setUser(data.user)

        const roles = data.user.roles || []
        const isAdmin = roles.includes('admin')
        const isStaff = roles.includes('staff')

        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            const nextUser = {
              ...parsedUser,
              fullName: data.user.profile?.fullName || parsedUser.fullName,
              avatarUrl: data.user.profile?.avatarUrl || parsedUser.avatarUrl,
              roles,
              isAdmin,
              isStaff,
            }
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser))
          } catch {
            // ignore invalid cached user payload
          }
        }
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin tài khoản')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const roles = user?.roles || []
  const isAdmin = roles.includes('admin')
  const isStaff = roles.includes('staff')
  const profileLabel = isAdmin ? 'quản trị viên' : 'nhân viên'
  const profileTitle = isAdmin ? 'Hồ sơ quản trị viên' : 'Hồ sơ nhân viên'
  const accountTag = isAdmin ? 'Quản trị viên' : 'Nhân viên'
  const accountSectionTitle = isAdmin ? 'Thông tin quản trị' : 'Thông tin nhân viên'

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600">Tài khoản {profileLabel}</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{profileTitle}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Xem thông tin tài khoản, vai trò và trạng thái đăng nhập hiện tại.
            </p>
          </div>

          <Link
            to={ROUTES.EDIT_PROFILE}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30"
          >
            <Settings size={18} />
            Chỉnh sửa thông tin
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-orange-500 to-amber-500 text-4xl font-bold text-white shadow-lg shadow-orange-500/20">
                {user?.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {user?.profile?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                {loading ? 'Đang tải...' : user?.profile?.fullName || accountTag}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{user?.email}</p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                <BadgeCheck size={16} />
                {accountTag}
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Trạng thái</span>
                <span className="font-semibold text-emerald-600">Đang hoạt động</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Vai trò</span>
                <span className="font-semibold text-gray-900">{roles.join(', ') || 'admin'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Đăng nhập bằng</span>
                <span className="font-semibold text-gray-900">Email</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <User size={20} />
                </div>
                <p className="mt-4 text-sm text-gray-500">Họ và tên</p>
                <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : user?.profile?.fullName || 'Chưa cập nhật'}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Mail size={20} />
                </div>
                <p className="mt-4 text-sm text-gray-500">Email</p>
                <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : user?.email || 'Chưa cập nhật'}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Shield size={20} />
                </div>
                <p className="mt-4 text-sm text-gray-500">Vai trò</p>
                <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : roles.join(', ') || 'admin'}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Calendar size={20} />
                </div>
                <p className="mt-4 text-sm text-gray-500">Ngày tạo</p>
                <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : formatDate(user?.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900">{accountSectionTitle}</h3>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : user?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Giới tính</p>
                  <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : user?.profile?.gender || 'Chưa cập nhật'}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Ngày sinh</p>
                  <p className="mt-1 font-semibold text-gray-900">{loading ? '...' : formatDate(user?.profile?.dob)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {loading
                      ? '...'
                      : [
                          user?.profile?.address?.addressLine,
                          user?.profile?.address?.ward,
                          user?.profile?.address?.district,
                          user?.profile?.address?.city,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}