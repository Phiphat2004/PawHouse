import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🐾</span>
              <span className="text-2xl font-bold">PawHouse</span>
            </div>
            <p className="text-gray-400 mb-4">Nền tảng cung cấp sản phẩm thú cưng uy tín, chất lượng cao.</p>
            <div className="flex gap-4">
              {['📘', '📸', '🎵'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liên Kết</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Trang chủ</Link></li>
              <li><Link to="/san-pham" className="hover:text-orange-500 transition-colors">Sản phẩm</Link></li>
              <li><Link to="/cong-dong" className="hover:text-orange-500 transition-colors">Cộng đồng</Link></li>
              <li><Link to="/ve-chung-toi" className="hover:text-orange-500 transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/don-hang" className="hover:text-orange-500 transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liên Hệ</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <span>Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> 0909 123 456
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> support@pawhouse.vn
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2026 PawHouse. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}

