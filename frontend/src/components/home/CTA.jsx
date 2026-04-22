import { Link } from 'react-router-dom'
import {
  HeartFilled,
  ShoppingCartOutlined,
} from '@ant-design/icons'

export default function CTA() {
  return (
    <section className="py-20 bg-linear-to-r from-orange-500 to-amber-500 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <HeartFilled className="text-5xl mb-6 text-white" />
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Start Caring for Your Pet Today
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Discover hundreds of high-quality products or join our pet-loving community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/san-pham"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-500 font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg"
          >
            <ShoppingCartOutlined /> View Products
          </Link>
          <Link
            to="/cong-dong"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
          >
            💬 Join Community
          </Link>
        </div>
      </div>
    </section>
  )
}

