import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLoginButton } from '../components/auth'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const API_BASE = '/api/auth'

function hasAdminRole(user) {
  if (!user) return false
  if (user.isAdmin === true || user.isStaff === true) return true

  if (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('staff'))) {
    return true
  }

  return user.role === 'admin' || user.role === 'staff'
}

function getModeFromPath(pathname) {
  return pathname.startsWith('/register') ? 'register' : 'login'
}

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const modeFromRoute = useMemo(() => getModeFromPath(location.pathname), [location.pathname])
  const [mode, setMode] = useState(modeFromRoute)
  const [step, setStep] = useState('form') // 'form' | 'otp' | 'forgot' | 'reset-otp' | 'reset'

  const isRegister = mode === 'register'

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: true,
    accept: false
  })

  const [otp, setOtp] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('success') // 'success' | 'error' | 'info'
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setMode(modeFromRoute)
    setStep('form')
  }, [modeFromRoute])

  useEffect(() => {
    const storedToken = localStorage.getItem('pawhouse_token')
    const storedUser = localStorage.getItem('pawhouse_user')

    if (!storedToken || !storedUser) return

    try {
      const parsedUser = JSON.parse(storedUser)
      if (hasAdminRole(parsedUser)) {
        navigate('/quan-tri', { replace: true })
      }
    } catch {
      // Ignore invalid stored user payload
    }
  }, [navigate])

  useEffect(() => {
    setErrors({})
    setToast(null)
    setSubmitting(false)
    setStep('form')
    setOtp('')
    setResetToken('')
    setForgotEmail('')
    setNewPassword('')
    setConfirmNewPassword('')
  }, [mode])

  const goMode = (nextMode) => {
    setMode(nextMode)
    navigate(nextMode === 'register' ? '/register' : '/login')
  }

  const showToast = (message, type = 'success') => {
    setToast(message)
    setToastType(type)
  }

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const onRegister = async () => {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên'

    const email = form.email.trim()
    if (!email) nextErrors.email = 'Vui lòng nhập email'
    else if (!EMAIL_RE.test(email)) nextErrors.email = 'Email không hợp lệ'

    if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự'

    if (!form.confirmPassword) nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp'

    if (!form.accept) nextErrors.accept = 'Bạn cần đồng ý Điều khoản & Chính sách'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: email,
          password: form.password
        })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Đăng ký thất bại', 'error')
        setSubmitting(false)
        return
      }

      setOtpEmail(data.email)
      setStep('otp')
      showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Vui lòng nhập đủ 6 số OTP', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Xác thực thất bại', 'error')
        setSubmitting(false)
        return
      }

      showToast('Xác thực thành công! Đang chuyển đến đăng nhập...', 'success')
      setTimeout(() => {
        goMode('login')
      }, 1500)
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onResendOtp = async (emailOverride) => {
    const targetEmail = emailOverride || otpEmail
    if (!targetEmail) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Gửi lại OTP thất bại', 'error')
      } else {
        showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
      }
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onForgotPassword = async () => {
    const email = forgotEmail.trim()
    if (!email) {
      showToast('Vui lòng nhập email', 'error')
      return
    }
    if (!EMAIL_RE.test(email)) {
      showToast('Email không hợp lệ', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Không thể gửi yêu cầu', 'error')
        setSubmitting(false)
        return
      }

      setOtpEmail(email)
      setStep('reset-otp')
      showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onVerifyResetOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Vui lòng nhập đủ 6 số OTP', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Xác thực thất bại', 'error')
        setSubmitting(false)
        return
      }

      setResetToken(data.resetToken)
      setOtp('')
      setStep('reset')
      showToast('Xác thực thành công. Vui lòng nhập mật khẩu mới.', 'success')
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onResetPassword = async () => {
    if (!newPassword) {
      showToast('Vui lòng nhập mật khẩu mới', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu tối thiểu 6 ký tự', 'error')
      return
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Mật khẩu nhập lại không khớp', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Đổi mật khẩu thất bại', 'error')
        setSubmitting(false)
        return
      }

      showToast('Đổi mật khẩu thành công! Đang chuyển đến đăng nhập...', 'success')
      setTimeout(() => {
        setStep('form')
        setResetToken('')
        setNewPassword('')
        setConfirmNewPassword('')
        goMode('login')
      }, 1500)
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onResendResetOtp = async () => {
    if (!otpEmail) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Gửi lại OTP thất bại', 'error')
      } else {
        showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
      }
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onLogin = async () => {
    const nextErrors = {}
    const email = form.email.trim()
    if (!email) nextErrors.email = 'Vui lòng nhập email'
    else if (!EMAIL_RE.test(email)) nextErrors.email = 'Email không hợp lệ'

    if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: form.password })
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.needVerify) {
          setOtpEmail(data.email)
          setStep('otp')
          showToast('Tài khoản chưa xác thực. Vui lòng nhập OTP.', 'info')
          onResendOtp(data.email)
        } else {
          showToast(data.error || 'Đăng nhập thất bại', 'error')
        }
        setSubmitting(false)
        return
      }

      // Save token to localStorage
      localStorage.setItem('pawhouse_token', data.token)
      localStorage.setItem('pawhouse_user', JSON.stringify(data.user))

      showToast('Đăng nhập thành công!', 'success')

      // Redirect based on role
      setTimeout(() => {
        if (hasAdminRole(data.user)) {
          navigate('/quan-tri')
        } else {
          navigate('/')
        }
      }, 1000)
    } catch {
      showToast('Không thể kết nối server', 'error')
    }
    setSubmitting(false)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setToast(null)

    if (step === 'otp') {
      onVerifyOtp()
      return
    }

    if (step === 'forgot') {
      onForgotPassword()
      return
    }

    if (step === 'reset-otp') {
      onVerifyResetOtp()
      return
    }

    if (step === 'reset') {
      onResetPassword()
      return
    }

    if (isRegister) {
      onRegister()
    } else {
      onLogin()
    }
  }

  const inputBase =
    'w-full rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-300 transition'

  const toastColors = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-orange-50 to-amber-50 text-gray-900 font-['Inter',sans-serif]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-orange-200/70 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-amber-200/70 blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-44 left-1/3 h-[32rem] w-[32rem] rounded-full bg-rose-200/60 blur-3xl animate-pulse delay-500" />

        <div
          className="absolute inset-0 opacity-30 mix-blend-multiply"
          style={{
            backgroundImage: 'url(/pets-pattern.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '320px 320px',
            backgroundPosition: 'center'
          }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_60%)]" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🐾</span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              PawHouse
            </span>
          </Link>

          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Về trang chủ
          </Link>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-10 items-center">
          <div className="hidden lg:block space-y-6 animate-fade-in-up">

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Bắt đầu hành trình chăm sóc
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                {' '}
                thú cưng
              </span>
            </h1>

            <p className="text-gray-600 text-lg max-w-xl">
              Đăng nhập để quản lý đơn hàng, theo dõi ưu đãi và lưu danh sách sản phẩm yêu thích của bạn.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 max-w-xl">
              {[
                { title: 'Giao nhanh', sub: 'Nội ô 2 giờ', icon: '🚚' },
                { title: 'Chính hãng', sub: '100% đảm bảo', icon: '✅' },
                { title: 'Ưu đãi', sub: 'Voucher mỗi tuần', icon: '🎁' }
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-orange-200/60 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div className="mt-2 font-semibold">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in-up delay-300">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-orange-400/60 via-amber-400/45 to-rose-400/35 blur opacity-80" />

            <div className="relative rounded-3xl border border-black/5 bg-white/80 backdrop-blur-xl shadow-2xl shadow-orange-900/10 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {step === 'otp' ? 'Xác thực OTP' : 
                     step === 'forgot' ? 'Quên mật khẩu' :
                     step === 'reset-otp' ? 'Xác thực OTP' :
                     step === 'reset' ? 'Đặt lại mật khẩu' :
                     isRegister ? 'Tạo tài khoản' : 'Chào mừng quay lại'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {step === 'otp' ? `Nhập mã 6 số đã gửi đến ${otpEmail}` : 
                     step === 'forgot' ? 'Nhập email để nhận mã xác thực' :
                     step === 'reset-otp' ? `Nhập mã 6 số đã gửi đến ${otpEmail}` :
                     step === 'reset' ? 'Nhập mật khẩu mới cho tài khoản' :
                     'Kết nối với PawHouse'}
                  </p>
                </div>
                <Link
                  to="/"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Đóng"
                >
                  <span className="text-xl">✕</span>
                </Link>
              </div>

              {step === 'form' && !['forgot', 'reset-otp', 'reset'].includes(step) && (
                <div className="mt-4 relative flex items-center rounded-2xl bg-gray-100/80 p-1">
                  <span
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm border border-gray-200/70 transition-transform duration-300 ${
                      isRegister ? 'translate-x-full' : ''
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => goMode('login')}
                    className={`relative z-10 flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                      !isRegister ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Đăng nhập
                  </button>

                  <button
                    type="button"
                    onClick={() => goMode('register')}
                    className={`relative z-10 flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                      isRegister ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              {toast && (
                <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${toastColors[toastType]}`}>
                  {toast}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                {step === 'forgot' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Email</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                        <input
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          type="email"
                          placeholder="you@example.com"
                          autoFocus
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || !forgotEmail.trim()}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Gửi mã OTP'}
                    </button>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('form')
                          setForgotEmail('')
                          setToast(null)
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        ← Quay lại đăng nhập
                      </button>
                    </div>
                  </>
                ) : step === 'reset-otp' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Mã OTP (6 số)</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          maxLength={6}
                          autoFocus
                          className={`${inputBase} pl-11 text-center text-2xl tracking-widest font-mono`}
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || otp.length !== 6}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot')
                          setOtp('')
                          setToast(null)
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        ← Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={onResendResetOtp}
                        disabled={submitting}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-50"
                      >
                        Gửi lại OTP
                      </button>
                    </div>
                  </>
                ) : step === 'reset' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Mật khẩu mới</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                        <input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoFocus
                          className={`${inputBase} pl-11 pr-16`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Nhập lại mật khẩu mới</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                        <input
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`${inputBase} pl-11 pr-16`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          {showConfirm ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || !newPassword || !confirmNewPassword}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('form')
                          setResetToken('')
                          setNewPassword('')
                          setConfirmNewPassword('')
                          setToast(null)
                          goMode('login')
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        ← Quay lại đăng nhập
                      </button>
                    </div>
                  </>
                ) : step === 'otp' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Mã OTP (6 số)</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          maxLength={6}
                          autoFocus
                          className={`${inputBase} pl-11 text-center text-2xl tracking-widest font-mono`}
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || otp.length !== 6}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('form')
                          setOtp('')
                          setToast(null)
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        ← Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={submitting}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-50"
                      >
                        Gửi lại OTP
                      </button>
                    </div>
                  </>
                ) : isRegister ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Họ và tên</span>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                          <input
                            value={form.fullName}
                            onChange={handleChange('fullName')}
                            type="text"
                            placeholder="Nguyễn Văn A"
                            autoComplete="name"
                            className={`${inputBase} pl-11 ${errors.fullName ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                          />
                        </div>
                        {errors.fullName && <p className="mt-2 text-sm text-rose-600">{errors.fullName}</p>}
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Email</span>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                          <input
                            value={form.email}
                            onChange={handleChange('email')}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={`${inputBase} pl-11 ${errors.email ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                          />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                      </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Mật khẩu</span>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                          <input
                            value={form.password}
                            onChange={handleChange('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`${inputBase} pl-11 pr-16 ${
                              errors.password ? 'border-rose-300 focus:ring-rose-200' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPassword ? 'Ẩn' : 'Hiện'}
                          </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Nhập lại mật khẩu</span>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                          <input
                            value={form.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`${inputBase} pl-11 pr-16 ${
                              errors.confirmPassword ? 'border-rose-300 focus:ring-rose-200' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                            aria-label={showConfirm ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
                          >
                            {showConfirm ? 'Ẩn' : 'Hiện'}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword}</p>
                        )}
                      </label>
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={form.accept}
                          onChange={handleChange('accept')}
                          className="h-4 w-4 rounded border-gray-300 bg-white"
                        />
                        Tôi đồng ý Điều khoản & Chính sách
                      </label>
                      {errors.accept && <p className="mt-2 text-sm text-rose-600">{errors.accept}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Email</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                        <input
                          value={form.email}
                          onChange={handleChange('email')}
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className={`${inputBase} pl-11 ${errors.email ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                        />
                      </div>
                      {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Mật khẩu</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                        <input
                          value={form.password}
                          onChange={handleChange('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={`${inputBase} pl-11 pr-16 ${
                            errors.password ? 'border-rose-300 focus:ring-rose-200' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                      {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                    </label>

                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={form.remember}
                          onChange={handleChange('remember')}
                          className="h-4 w-4 rounded border-gray-300 bg-white"
                        />
                        Ghi nhớ đăng nhập
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot')
                          setToast(null)
                        }}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                  </>
                )}
              </form>

              {step === 'form' && (
                <>
                  <div className="relative my-5">
                    <div className="h-px bg-gray-200" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs text-gray-500 bg-white/80 backdrop-blur">
                      hoặc
                    </span>
                  </div>

                  <GoogleLoginButton
                    disabled={submitting}
                    onSuccess={(data) => {
                      const { token, user, isNewUser } = data
                      localStorage.setItem('pawhouse_token', token)
                      localStorage.setItem('pawhouse_user', JSON.stringify(user))
                      
                      // Show appropriate message based on isNewUser flag
                      const message = isNewUser 
                        ? '🎉 Tài khoản của bạn đã được tạo thành công! Chào mừng bạn đến với PawHouse!'
                        : '👋 Đăng nhập thành công! Chào mừng bạn trở lại!'
                      
                      showToast(message, 'success')
                      setTimeout(() => {
                        if (hasAdminRole(user)) { 
                          navigate('/quan-tri')
                        } else {
                          navigate('/')
                        }
                      }, 1000)
                    }}
                    onError={(error) => {
                      showToast(error || 'Thao tác thất bại', 'error')
                    }}
                  />

                  <p className="mt-5 text-sm text-center text-gray-600">
                    {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                    <button
                      type="button"
                      onClick={() => goMode(isRegister ? 'login' : 'register')}
                      className="font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                    >
                      {isRegister ? 'Đăng nhập' : 'Đăng ký'}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">© 2026 PawHouse</div>
      </div>
    </div>
  )
}
