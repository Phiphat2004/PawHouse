import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Header, Footer } from '../components/layout'
import { STORAGE_KEYS, ROUTES } from '../utils/constants'
import { authApi } from '../utils/services/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        navigate(ROUTES.LOGIN)
        return
      }

      try {
        const data = await authApi.me()
        setUser(data.user)
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US')
  }

  const getGenderLabel = (gender) => {
    const labels = { male: 'Male', female: 'Female', other: 'Other' }
    return labels[gender] || 'Not set'
  }

  const getFullAddress = (address) => {
    if (!address || Object.keys(address).length === 0) return 'Not set'
    const parts = [address.addressLine, address.ward, address.district, address.city].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Not set'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Information</h1>
            <div className="flex gap-3">
              <Link
                to="/doi-mat-khau"
                className="px-5 py-2.5 font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all"
              >
                🔒 Change Password
              </Link>
              <Link
                to={ROUTES.EDIT_PROFILE}
                className="px-5 py-2.5 font-semibold text-white bg-linear-to-r from-orange-500 to-amber-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                ✏️ Edit Profile
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Avatar & Basic Info */}
            <div className="bg-linear-to-r from-orange-500 to-amber-500 px-6 py-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {user?.profile?.avatarUrl ? (
                    <img
                      src={user.profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <div className="text-center sm:text-left text-white">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {user?.profile?.fullName || 'Name not set'}
                  </h2>
                  <p className="text-orange-100">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    {user?.roles?.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm capitalize"
                      >
                        {role === 'admin' ? 'Administrator' : 'Customer'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Personal Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <ProfileField label="Full Name" value={user?.profile?.fullName} />
                <ProfileField label="Email" value={user?.email} />
                <ProfileField label="Phone Number" value={user?.phone} />
                <ProfileField label="Gender" value={getGenderLabel(user?.profile?.gender)} />
                <ProfileField label="Date of Birth" value={formatDate(user?.profile?.dob)} />
                <ProfileField label="Member Since" value={formatDate(user?.createdAt)} />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
                <span>📍</span> Address
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700">{getFullAddress(user?.profile?.address)}</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
                <span>⚙️</span> Notification Settings
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Marketing Email</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.settings?.marketingEmail
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user?.settings?.marketingEmail ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Push Notifications</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.settings?.pushNotification
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user?.settings?.pushNotification ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value || 'Not set'}</p>
    </div>
  )
}
