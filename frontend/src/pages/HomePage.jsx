import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Footer } from '../components/layout'
import { Hero, Features, Categories, FeaturedProducts, Testimonials, CTA } from '../components/home'
import { ROUTES, STORAGE_KEYS } from '../utils/constants'

function isAdminUser(user) {
  if (!user) return false
  if (user.isAdmin === true) return true
  return Array.isArray(user.roles) && user.roles.includes('admin')
}

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

    if (!token || !storedUser) return

    try {
      const user = JSON.parse(storedUser)
      if (isAdminUser(user)) {
        navigate(ROUTES.ADMIN, { replace: true })
      }
    } catch {
      // Ignore invalid stored user payload
    }
  }, [navigate])

  return (
    <div className="font-['Inter',sans-serif]">
      <Header />
      <main>
        <Hero />
        <Features />
        <Categories />
        <FeaturedProducts />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
