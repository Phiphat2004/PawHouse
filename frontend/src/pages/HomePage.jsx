import { Header, Footer } from '../components/layout'
import { Hero, Features, Categories, FeaturedProducts, Testimonials, CTA } from '../components/home'

export default function HomePage() {
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
