import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
  DownOutlined,
  FileTextOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { STORAGE_KEYS, ROUTES } from "../../utils/constants";
import { authApi } from "../../services/api";
import { useCart } from "../../hooks/useCart";

export default function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { count: cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response = await authApi.me();
        if (response?.user) {
          const updatedUser = {
            id: response.user.id,
            email: response.user.email,
            fullName: response.user.profile?.fullName || '',
            avatarUrl: response.user.profile?.avatarUrl || '',
            roles: response.user.roles || [],
            isAdmin: Array.isArray(response.user.roles) && response.user.roles.includes('admin'),
            isStaff: Array.isArray(response.user.roles) && response.user.roles.includes('staff'),
          };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          setUser(updatedUser);
          return;
        }
        setUser(null);
      } catch (err) {
        console.error('Failed to sync current user:', err);
        setUser(null);
      }
    };
    
    loadUser();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadUser();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      try {
        // Use relative path to let Vite proxy handle the routing
        // This avoids hardcoding ports and ensures correct routing to auth-service
        await fetch(`/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore error
      }
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              🐾
            </span>
            <span className="text-xl lg:text-2xl font-bold text-orange-500">
              PawHouse
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/san-pham"
              className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Sản phẩm
            </Link>
            <Link
              to="/cong-dong"
              className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Cộng đồng
            </Link>
            <Link
              to="/ve-chung-toi"
              className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Về chúng tôi
            </Link>
            <Link
              to="/lien-he"
              className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Liên hệ
            </Link>
            {user && (
              <Link
                to="/lich-cham-soc"
                className="font-medium text-gray-700 hover:text-orange-500 transition-colors"
              >
                Lịch chăm sóc
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Link
                  to="/gio-hang"
                  className="relative p-2 rounded-full hover:bg-orange-50 transition"
                  title="Giỏ hàng"
                >
                  <ShoppingCartOutlined className="text-2xl text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-orange-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-orange-600 font-semibold">
                          {user.fullName?.charAt(0)?.toUpperCase() ||
                            user.email?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 max-w-30 truncate">
                      {user.fullName || user.email}
                    </span>
                    <span
                      className={`transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      <DownOutlined className="text-xs text-gray-500" />
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
                      <Link
                        to={ROUTES.PROFILE}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50"
                      >
                        <UserOutlined /> Tài khoản
                      </Link>

                      <Link
                        to="/don-hang"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50"
                      >
                        <InboxOutlined /> Đơn hàng của tôi
                      </Link>

                      <Link
                        to="/lich-cham-soc"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50"
                      >
                        <CalendarOutlined /> Lịch chăm sóc
                      </Link>

                      {(user.isAdmin || user.isStaff) && (
                        <Link
                          to="/cong-dong/bai-viet-cua-toi"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50"
                        >
                          <FileTextOutlined /> Bài viết của tôi
                        </Link>
                      )}

                      {(user.isAdmin || user.isStaff) && (
                        <Link
                          to={ROUTES.ADMIN}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50"
                        >
                          <SettingOutlined /> Quản trị
                        </Link>
                      )}

                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogoutOutlined /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full font-semibold text-gray-700 hover:bg-orange-50"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-full font-semibold text-white bg-linear-to-r from-orange-500 to-amber-500"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
