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
    if (!form.fullName.trim()) nextErrors.fullName = 'Please enter your full name'

    const email = form.email.trim()
    if (!email) nextErrors.email = 'Please enter your email'
    else if (!EMAIL_RE.test(email)) nextErrors.email = 'Invalid email address'

    if (!form.password) nextErrors.password = 'Please enter a password'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters'

    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match'

    if (!form.accept) nextErrors.accept = 'You must agree to the Terms & Policy'

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
        showToast(data.error || 'Registration failed', 'error')
        setSubmitting(false)
        return
      }

      setOtpEmail(data.email)
      setStep('otp')
      showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
    } catch {
      showToast('Unable to connect to server', 'error')
    }
    setSubmitting(false)
  }

  const onVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter the full 6-digit OTP', 'error')
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
        showToast(data.error || 'Verification failed', 'error')
        setSubmitting(false)
        return
      }

      showToast('Verification successful! Redirecting to login...', 'success')
      setTimeout(() => {
        goMode('login')
      }, 1500)
    } catch {
      showToast('Unable to connect to server', 'error')
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
      showToast('Please enter your email', 'error')
      return
    }
    if (!EMAIL_RE.test(email)) {
      showToast('Invalid email address', 'error')
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
        showToast(data.error || 'Unable to send request', 'error')
        setSubmitting(false)
        return
      }

      setOtpEmail(email)
      setStep('reset-otp')
      showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
    } catch {
      showToast('Unable to connect to server', 'error')
    }
    setSubmitting(false)
  }

  const onVerifyResetOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter the full 6-digit OTP', 'error')
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
        showToast(data.error || 'Verification failed', 'error')
        setSubmitting(false)
        return
      }

      setResetToken(data.resetToken)
      setOtp('')
      setStep('reset')
      showToast('Verification successful. Please enter your new password.', 'success')
    } catch {
      showToast('Unable to connect to server', 'error')
    }
    setSubmitting(false)
  }

  const onResetPassword = async () => {
    if (!newPassword) {
      showToast('Please enter a new password', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error')
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
        showToast(data.error || 'Password change failed', 'error')
        setSubmitting(false)
        return
      }

      showToast('Password changed successfully! Redirecting to login...', 'success')
      setTimeout(() => {
        setStep('form')
        setResetToken('')
        setNewPassword('')
        setConfirmNewPassword('')
        goMode('login')
      }, 1500)
    } catch {
      showToast('Unable to connect to server', 'error')
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
        showToast(data.error || 'Failed to resend OTP', 'error')
      } else {
        showToast(data.message + (data.devOtp ? ` [DEV OTP: ${data.devOtp}]` : ''), 'info')
      }
    } catch {
      showToast('Unable to connect to server', 'error')
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
          showToast('Account not verified. Please enter your OTP.', 'info')
          onResendOtp(data.email)
        } else {
          showToast(data.error || 'Login failed', 'error')
        }
        setSubmitting(false)
        return
      }

      // Save token to localStorage
      localStorage.setItem('pawhouse_token', data.token)
      localStorage.setItem('pawhouse_user', JSON.stringify(data.user))

      showToast('Login successful!', 'success')

      // Redirect based on role
      setTimeout(() => {
        if (hasAdminRole(data.user)) {
          navigate('/quan-tri')
        } else {
          navigate('/')
        }
      }, 1000)
    } catch {
      showToast('Unable to connect to server', 'error')
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
            ← Back to Home
          </Link>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-10 items-center">
          <div className="hidden lg:block space-y-6 animate-fade-in-up">

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Start your pet care
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                {' '}
                journey
              </span>
            </h1>

            <p className="text-gray-600 text-lg max-w-xl">
              Log in to manage your orders, track deals, and save your favorite products.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 max-w-xl">
              {[
                { title: 'Fast Delivery', sub: '2 hours in-city', icon: '🚚' },
                { title: 'Authentic', sub: '100% guaranteed', icon: '✅' },
                { title: 'Deals', sub: 'Weekly vouchers', icon: '🎁' }
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
                    {step === 'otp' ? 'Verify OTP' : 
                     step === 'forgot' ? 'Forgot Password' :
                     step === 'reset-otp' ? 'Verify OTP' :
                     step === 'reset' ? 'Reset Password' :
                     isRegister ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {step === 'otp' ? `Enter the 6-digit code sent to ${otpEmail}` : 
                     step === 'forgot' ? 'Enter your email to receive a verification code' :
                     step === 'reset-otp' ? `Enter the 6-digit code sent to ${otpEmail}` :
                     step === 'reset' ? 'Enter a new password for your account' :
                     'Connect with PawHouse'}
                  </p>
                </div>
                <Link
                  to="/"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
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
                    Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => goMode('register')}
                    className={`relative z-10 flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                      isRegister ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Register
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
                      {submitting ? 'Processing...' : 'Send OTP Code'}
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
                        ← Back to Login
                      </button>
                    </div>
                  </>
                ) : step === 'reset-otp' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">OTP Code (6 digits)</span>
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
                      {submitting ? 'Processing...' : 'Confirm'}
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
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={onResendResetOtp}
                        disabled={submitting}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </>
                ) : step === 'reset' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">New Password</span>
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
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">Confirm New Password</span>
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
                          {showConfirm ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || !newPassword || !confirmNewPassword}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : 'Change Password'}
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
                        ← Back to Login
                      </button>
                    </div>
                  </>
                ) : step === 'otp' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-800">OTP Code (6 digits)</span>
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
                      {submitting ? 'Processing...' : 'Confirm'}
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
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={submitting}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </>
                ) : isRegister ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Full Name</span>
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
                        <span className="text-sm font-semibold text-gray-800">Password</span>
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
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-gray-800">Confirm Password</span>
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
                            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {showConfirm ? 'Hide' : 'Show'}
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
                        I agree to the Terms & Policy
                      </label>
                      {errors.accept && <p className="mt-2 text-sm text-rose-600">{errors.accept}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : 'Register'}
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
                      <span className="text-sm font-semibold text-gray-800">Password</span>
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
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
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
                        Remember me
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot')
                          setToast(null)
                        }}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : 'Log In'}
                    </button>
                  </>
                )}
              </form>

              {step === 'form' && (
                <>
                  <div className="relative my-5">
                    <div className="h-px bg-gray-200" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs text-gray-500 bg-white/80 backdrop-blur">
                      or
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
                        ? '🎉 Your account has been created successfully! Welcome to PawHouse!'
                        : '👋 Login successful! Welcome back!'
                      
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
                      showToast(error || 'Operation failed', 'error')
                    }}
                  />

                  <p className="mt-5 text-sm text-center text-gray-600">
                    {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => goMode(isRegister ? 'login' : 'register')}
                      className="font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                    >
                      {isRegister ? 'Log In' : 'Register'}
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
