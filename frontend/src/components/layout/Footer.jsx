import { Link } from 'react-router-dom'
import {
  EnvironmentOutlined,
  FacebookFilled,
  InstagramFilled,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  YoutubeFilled,
} from '@ant-design/icons'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <ShopOutlined className="text-3xl text-orange-500" />
              <span className="text-2xl font-bold">PawHouse</span>
            </div>
            <p className="text-gray-400 mb-4">A trusted platform providing high-quality pet products.</p>
            <div className="flex gap-4">
              {[FacebookFilled, InstagramFilled, YoutubeFilled].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="Social media"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                >
                  <Icon className="text-base" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Home</Link></li>
              <li><Link to="/san-pham" className="hover:text-orange-500 transition-colors">Products</Link></li>
              <li><Link to="/cong-dong" className="hover:text-orange-500 transition-colors">Community</Link></li>
              <li><Link to="/ve-chung-toi" className="hover:text-orange-500 transition-colors">About us</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Contact</Link></li>
              <li><Link to="/lich-cham-soc" className="hover:text-orange-500 transition-colors">Care appointments</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/don-hang" className="hover:text-orange-500 transition-colors">Track orders</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Return policy</Link></li>
              <li><Link to="/lien-he" className="hover:text-orange-500 transition-colors">Support contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <EnvironmentOutlined className="mt-0.5" />
                <span>FPT University Can Tho Campus </span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneOutlined /> 039 2020136
              </li>
              <li className="flex items-center gap-2">
                <MailOutlined /> support@pawhouse.vn
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2026 PawHouse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

