import { Link } from 'react-router-dom'
import {
  CarOutlined,
  CheckCircleFilled,
  HeartFilled,
  RightOutlined,
} from '@ant-design/icons'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-600 font-medium text-sm">
              <HeartFilled />
              Specialized in pet products
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Care for
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">
                {' '}
                Your Pet{' '}
              </span>
              
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
              A wide range of high-quality products for dogs, cats, and other pets. Nationwide shipping with 7-day returns.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/san-pham"
                className="group px-8 py-4 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Shop Now
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform"><RightOutlined /></span>
              </Link>
              <Link
                to="/lich-cham-soc"
                className="px-8 py-4 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 text-center"
              >
                Book care appointment
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500">Authentic</div>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">7 days</div>
                <div className="text-sm text-gray-500">Returns</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop"
                alt="Lovely pet dog"
                className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-3">
                <CarOutlined className="text-3xl text-orange-500" />
                <div>
                  <div className="font-semibold text-gray-900">Nationwide delivery</div>
                  <div className="text-sm text-gray-500">Careful packaging</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-3">
                <CheckCircleFilled className="text-3xl text-emerald-500" />
                <div>
                  <div className="font-semibold text-gray-900">Authentic</div>
                  <div className="text-sm text-gray-500">Quality guaranteed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
