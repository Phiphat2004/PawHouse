import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Header, Footer } from '../components/layout'
import { AdminLayout, StaffLayout } from '../components/admin'
import { STORAGE_KEYS, ROUTES } from '../utils/constants'
import { authApi } from '../utils/services/api'

function hasRole(user, role) {
  if (!user) return false
  if (role === 'admin' && user.isAdmin === true) return true
  if (role === 'staff' && user.isStaff === true) return true
  return Array.isArray(user.roles) && user.roles.includes(role)
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
          const parsedUser = JSON.parse(storedUser)
          setIsAdmin(hasRole(parsedUser, 'admin'))
          setIsStaff(hasRole(parsedUser, 'staff'))
        } catch {
          setIsAdmin(false)
          setIsStaff(false)
        }
      }

      try {
        const data = await authApi.me()
        const user = data.user
        const adminFlag = hasRole(user, 'admin')
        const staffFlag = hasRole(user, 'staff')
        setIsAdmin(adminFlag)
        setIsStaff(staffFlag)

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
      setError('Only image files are accepted')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must not exceed 5MB')
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
          const cachedUser = JSON.parse(storedUser)
          cachedUser.fullName = responseData.user.profile.fullName
          cachedUser.avatarUrl = responseData.user.profile.avatarUrl
          cachedUser.isAdmin = isAdmin
          cachedUser.isStaff = isStaff
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(cachedUser))
      }

      setSuccess('Profile updated successfully!')

      setTimeout(() => {
        navigate(isAdmin || isStaff ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE, { replace: true })
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await authApi.deleteMe()
      // Clear all local auth data
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      // Redirect to home page
      navigate(ROUTES.HOME, { replace: true })
    } catch (err) {
      setDeleting(false)
      setShowDeleteDialog(false)
      setError(err.message || 'Xóa tài khoản thất bại. Vui lòng thử lại.')
    }
  }

  const content = (
    <div className="min-h-screen bg-gray-50">
      {!(isAdmin || isStaff) && <Header />}

      <main className={isAdmin || isStaff ? 'p-6' : 'pt-24 pb-16'}>
        <div className={isAdmin || isStaff ? '' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className="flex items-center gap-4 mb-8">
            <Link
              to={isAdmin || isStaff ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Go Back
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isAdmin ? 'Edit Admin Profile' : isStaff ? 'Edit Staff Profile' : 'Edit Profile'}
            </h1>
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
                <span>🖼️</span> Profile Picture
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
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload photo from your device (max 5MB)
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
                    Or paste an image link
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
                <span>📋</span> Personal Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
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
                <span>📍</span> Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
                  <input
                    type="text"
                    name="addressLine"
                    value={form.addressLine}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="House number, street name..."
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward/Commune</label>
                    <input
                      type="text"
                      name="ward"
                      value={form.ward}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ward/Commune"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <input
                      type="text"
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="District"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province/City</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="Province/City"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚙️</span> Notification Settings
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
                    <p className="text-sm text-gray-500">Receive new product information via email</p>
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
                    <p className="text-sm text-gray-500">Receive push notifications from the app</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Delete Account — customers only, matches notification row style */}
            {!(isAdmin || isStaff) && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 flex items-center justify-center text-red-400 flex-shrink-0 text-base">
                  🗑️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">Delete account</p>
                  <p className="text-sm text-gray-500">Permanently deactivate your account and log out immediately</p>
                </div>
                <button
                  type="button"
                  id="btn-delete-account"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Link
                to={isAdmin ? ROUTES.ADMIN_PROFILE : ROUTES.PROFILE}
                className="flex-1 px-6 py-3 text-center font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 font-semibold text-white bg-linear-to-r from-orange-500 to-amber-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {!(isAdmin || isStaff) && <Footer />}
    </div>
  )

  /* ── Confirm Delete Dialog ─────────────────────────────── */
  const deleteDialog = showDeleteDialog && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteDialog(false) }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900">Delete account?</h2>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete your account? This action cannot be undone and you will be logged out immediately.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="btn-cancel-delete"
            type="button"
            disabled={deleting}
            onClick={() => setShowDeleteDialog(false)}
            className="flex-1 px-4 py-3 font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            disabled={deleting}
            onClick={handleDeleteAccount}
            className="flex-1 px-4 py-3 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )

  if (isAdmin) return <AdminLayout>{content}{deleteDialog}</AdminLayout>
  if (isStaff) return <StaffLayout>{content}{deleteDialog}</StaffLayout>
  return <>{content}{deleteDialog}</>
}