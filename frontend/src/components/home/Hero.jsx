import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-600 font-medium text-sm">
              <span>🐾</span>
              Chuyên cung cấp sản phẩm cho thú cưng
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Chăm Sóc
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                {' '}
                Thú Cưng{' '}
              </span>
              Của Bạn
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
              Đa dạng sản phẩm chất lượng cao dành cho chó, mèo và các bạn thú cưng khác. Giao hàng toàn quốc, đổi trả trong 7 ngày.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/san-pham"
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Mua Ngay
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/lich-cham-soc"
                className="px-8 py-4 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 text-center"
              >
                Đặt lịch chăm sóc
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-500">Sản phẩm</div>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500">Chính hãng</div>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">7 ngày</div>
                <div className="text-sm text-gray-500">Đổi trả</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop"
                alt="Chó cưng đáng yêu"
                className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚚</span>
                <div>
                  <div className="font-semibold text-gray-900">Giao toàn quốc</div>
                  <div className="text-sm text-gray-500">Đóng gói cẩn thận</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <div className="font-semibold text-gray-900">Chính hãng</div>
                  <div className="text-sm text-gray-500">Cam kết chất lượng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
