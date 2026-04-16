import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Footer } from '../components/layout'
import { Hero, Categories, FeaturedProducts, Testimonials, CTA } from '../components/home'
import { ROUTES, STORAGE_KEYS } from '../utils/constants'
import { authApi } from '../services/api'

function isAdminUser(user) {
  if (!user) return false
  if (user.isAdmin === true || user.isStaff === true) return true
  return Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('staff'))
}

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const syncAndRedirect = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) return

      try {
        const response = await authApi.me()
        const user = response?.user
        if (!user || !isMounted) return

        const normalizedUser = {
          id: user.id,
          email: user.email,
          fullName: user.profile?.fullName || '',
          avatarUrl: user.profile?.avatarUrl || '',
          roles: user.roles || [],
          isAdmin: Array.isArray(user.roles) && user.roles.includes('admin'),
          isStaff: Array.isArray(user.roles) && user.roles.includes('staff'),
        }
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser))

        if (isAdminUser(normalizedUser)) {
          navigate(ROUTES.ADMIN, { replace: true })
        }
      } catch {
        // Ignore sync errors and stay on home page
      }
    }

    syncAndRedirect()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <div className="font-['Inter',sans-serif]">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
