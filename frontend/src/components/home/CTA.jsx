import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-5xl mb-6 block">🐾</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Bắt Đầu Chăm Sóc Thú Cưng Ngay Hôm Nay
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Khám phá hàng trăm sản phẩm chất lượng cao hoặc tham gia cộng đồng người yêu thú cưng của chúng tôi.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/san-pham"
            className="px-8 py-4 bg-white text-orange-500 font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg"
          >
            🛒 Xem Sản Phẩm
          </Link>
          <Link
            to="/cong-dong"
            className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
          >
            💬 Tham Gia Cộng Đồng
          </Link>
        </div>
      </div>
    </section>
  )
}

