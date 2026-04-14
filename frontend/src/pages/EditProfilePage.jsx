import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Header, Footer } from '../components/layout'
import { AdminLayout } from '../components/admin'
import { STORAGE_KEYS, ROUTES } from '../utils/constants'
import { authApi } from '../utils/services/api'

function isAdminUser(user) {
  if (!user) return false
  if (user.isAdmin === true) return true
  return Array.isArray(user.roles) && user.roles.includes('admin')
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dob: '',
    addressLine: '',
    ward: '',
    district: '',
    city: '',
    marketingEmail: true,
    pushNotification: true,
    avatarUrl: ''
  })

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

      if (!token) {
        navigate(ROUTES.LOGIN)
        return
      }

      if (storedUser) {
        try {
          setIsAdmin(isAdminUser(JSON.parse(storedUser)))
        } catch {
          setIsAdmin(false)
        }
      }

      try {
        const data = await authApi.me()
        const user = data.user
        const adminFlag = isAdminUser(user)
        setIsAdmin(adminFlag)

        setForm({
          fullName: user.profile?.fullName || '',
          phone: user.phone || '',
          gender: user.profile?.gender || '',
          dob: user.profile?.dob ? user.profile.dob.split('T')[0] : '',
          addressLine: user.profile?.address?.addressLine || '',
          ward: user.profile?.address?.ward || '',
          district: user.profile?.address?.district || '',
          city: user.profile?.address?.city || '',
          marketingEmail: user.settings?.marketingEmail ?? true,
          pushNotification: user.settings?.pushNotification ?? true,
          avatarUrl: user.profile?.avatarUrl || ''
        })

        setAvatarPreview(user.profile?.avatarUrl || '')
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
          navigate(ROUTES.LOGIN)
          return
        }
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File ảnh không được vượt quá 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value
    setForm((prev) => ({ ...prev, avatarUrl: url }))

    if (url && url.trim()) {
      setAvatarPreview(url)
      setAvatarFile(null)
    } else {
      setAvatarPreview('')
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    setForm((prev) => ({ ...prev, avatarUrl: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) {
      navigate(ROUTES.LOGIN)
      return
    }

    try {
      let responseData

      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        formData.append('fullName', form.fullName)
        if (form.phone) formData.append('phone', form.phone)
        if (form.gender) formData.append('gender', form.gender)
        if (form.dob) formData.append('dob', form.dob)
        formData.append(
          'address',
          JSON.stringify({
            addressLine: form.addressLine,
            ward: form.ward,
            district: form.district,
            city: form.city
          })
        )
        formData.append(
          'settings',
          JSON.stringify({
            marketingEmail: form.marketingEmail,
            pushNotification: form.pushNotification
          })
        )

        responseData = await authApi.updateProfile(formData)
      } else {
        responseData = await authApi.updateProfile({
          fullName: form.fullName,
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          dob: form.dob || undefined,
          avatarUrl: form.avatarUrl || undefined,
          address: {
            addressLine: form.addressLine,
            ward: form.ward,
            district: form.district,
            city: form.city
          },
          settings: {
            marketingEmail: form.marketingEmail,
            pushNotification: form.pushNotification
          }
        })
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
      if (storedUser) {
        const user = JSON.parse(storedUser)
        user.fullName = responseData.user.profile.fullName
        user.avatarUrl = responseData.user.profile.avatarUrl
        user.isAdmin = isAdmin
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      }

      setSuccess('Cập nhật thông tin thành công!')

      setTimeout(() => {
        navigate(isAdmin ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE, { replace: true })
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className="min-h-screen bg-gray-50">
      {!isAdmin && <Header />}

      <main className={isAdmin ? 'p-6' : 'pt-24 pb-16'}>
        <div className={isAdmin ? '' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className="flex items-center gap-4 mb-8">
            <Link
              to={isAdmin ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Quay lại
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chỉnh sửa thông tin</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🖼️</span> Ảnh đại diện
              </h3>

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        👤
                      </div>
                    )}
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                      title="Xóa ảnh"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tải ảnh từ máy tính (tối đa 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hoặc dán link ảnh
                  </label>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={form.avatarUrl}
                    onChange={handleAvatarUrlChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Thông tin cá nhân
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="0xxx xxx xxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📍</span> Địa chỉ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    name="addressLine"
                    value={form.addressLine}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                    <input
                      type="text"
                      name="ward"
                      value={form.ward}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Phường/Xã"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                    <input
                      type="text"
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Quận/Huyện"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Tỉnh/Thành phố"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚙️</span> Cài đặt thông báo
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    name="marketingEmail"
                    checked={form.marketingEmail}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Email marketing</p>
                    <p className="text-sm text-gray-500">Nhận thông tin sản phẩm mới qua email</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    name="pushNotification"
                    checked={form.pushNotification}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Push notification</p>
                    <p className="text-sm text-gray-500">Nhận thông báo đẩy từ ứng dụng</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                to={isAdmin ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE}
                className="flex-1 px-6 py-3 text-center font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 font-semibold text-white bg-linear-to-r from-orange-500 to-amber-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {!isAdmin && <Footer />}
    </div>
  )

  return isAdmin ? <AdminLayout>{content}</AdminLayout> : content
}