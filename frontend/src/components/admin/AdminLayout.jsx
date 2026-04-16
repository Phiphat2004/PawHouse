import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { STORAGE_KEYS, ROUTES } from "../../utils/constants";
import { authApi } from "../../services/api";
import StaffLayout from "./StaffLayout";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [stockMenuOpen, setStockMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        const response = await authApi.me();
        const userData = response?.user;
        if (!userData) {
          navigate(ROUTES.LOGIN);
          return;
        }

        const normalizedUser = {
          id: userData.id,
          email: userData.email,
          profile: userData.profile,
          roles: userData.roles || [],
          isAdmin: Array.isArray(userData.roles) && userData.roles.includes("admin"),
          isStaff: Array.isArray(userData.roles) && userData.roles.includes("staff"),
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));

        if (isMounted) {
          setUser(normalizedUser);
          if (!normalizedUser.isAdmin && !normalizedUser.isStaff) {
            navigate(ROUTES.HOME);
          }
        }
      } catch {
        navigate(ROUTES.LOGIN);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Auto-expand stock menu if on stock pages
  useEffect(() => {
    if (location.pathname.includes('/ton-kho') || location.pathname.includes('/nhap-kho')) {
      setStockMenuOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore error
      }
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setDropdownOpen(false);
    navigate(ROUTES.LOGIN);
  };

  const menuItems = [
    { icon: "📊", label: "Tổng quan", path: "/quan-tri", exact: true },
    { icon: "📦", label: "Sản phẩm", path: "/quan-tri/san-pham" },
    { icon: "🛍️", label: "Đơn hàng", path: "/quan-tri/don-hang" },
    { icon: "🗓️", label: "Lịch chăm sóc", path: "/quan-tri/lich-cham-soc" },
    { icon: "📂", label: "Danh mục", path: "/quan-tri/danh-muc" },
  ];

  const adminOnlyMenuItems = [
    { icon: "👥", label: "Tài Khoản", path: "/quan-tri/khach-hang" },
  ];

  const visibleMenuItems = user?.isAdmin
    ? [...menuItems, ...adminOnlyMenuItems]
    : menuItems;

  const menuItemsAfterStock = [
    { icon: "🌐", label: "Cộng đồng", path: "/quan-tri/cong-dong" },
  ];

  const stockSubMenu = [
    { label: "Danh sách tồn kho", path: "/quan-tri/ton-kho" },
    { label: "Nhập kho", path: "/quan-tri/nhap-kho" },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  if (!user) return null;

  if (user.isStaff && !user.isAdmin) {
    return <StaffLayout>{children}</StaffLayout>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500">
                PawHouse
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex items-center justify-center w-full">
              <span className="text-2xl">🐾</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="p-4 pb-24 space-y-2 h-[calc(100vh-80px)] overflow-y-auto">
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item)
                  ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-orange-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
          
          {/* Tồn kho Menu with Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setStockMenuOpen(!stockMenuOpen)}
              className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname.includes('/ton-kho') || location.pathname.includes('/nhap-kho')
                  ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-orange-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                {sidebarOpen && <span className="font-medium">Tồn kho</span>}
              </div>
              {sidebarOpen && (
                <svg
                  className={`w-4 h-4 transition-transform ${
                    stockMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
            
            {/* Submenu */}
            {sidebarOpen && stockMenuOpen && (
              <div className="ml-4 space-y-1 border-l-2 border-orange-200 pl-2">
                {stockSubMenu.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                      location.pathname === subItem.path
                        ? "bg-orange-100 text-orange-700 font-medium"
                        : "text-gray-600 hover:bg-orange-50"
                    }`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Menu items after stock */}
          {menuItemsAfterStock.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item)
                  ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-orange-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản trị viên
              </h1>
              <p className="text-sm text-gray-500">
                Xin chào, {user?.profile?.fullName || user?.email}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span className="text-xl">🔔</span>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-orange-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {user?.profile?.fullName?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-35 truncate">
                    {user?.profile?.fullName || user?.email}
                  </span>
                  <span
                    className={`hidden md:inline-block transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <Link
                      to={ROUTES.ADMIN_PROFILE}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 hover:bg-orange-50"
                    >
                      👤 Tài khoản
                    </Link>

                    {user?.isAdmin && (
                      <Link
                        to={ROUTES.ADMIN}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-orange-50"
                      >
                        ⚙️ Quản trị
                      </Link>
                    )}

                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
