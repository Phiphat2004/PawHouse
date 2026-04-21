import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { STORAGE_KEYS, ROUTES } from "../../utils/constants";
import { authApi } from "../../services/api";

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export default function StaffLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(() => getStoredUser());
  const [authReady, setAuthReady] = useState(false);
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
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (location.pathname.includes('/ton-kho') || location.pathname.includes('/nhap-kho')) {
      setStockMenuOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

  const stockMenuActive =
    location.pathname.includes("/ton-kho") ||
    location.pathname.includes("/nhap-kho");

  const getMenuItemClass = (active) => {
    return [
      "flex items-center rounded-lg transition-all duration-200",
      sidebarOpen
        ? "w-full gap-3 px-4 py-3 justify-start"
        : "w-12 h-12 mx-auto justify-center p-0",
      active
        ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
        : "text-gray-700 hover:bg-orange-50",
    ].join(" ");
  };

  if (!authReady && !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={`fixed top-0 left-0 h-screen bg-white shadow-lg transition-all duration-300 z-40 border-r ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="shrink-0 border-b p-4">
            <div
              className={`flex items-center ${
                sidebarOpen ? "justify-between" : "justify-center flex-col gap-3"
              }`}
            >
              {sidebarOpen ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">🐾</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500 truncate">
                      PawHouse
                    </span>
                  </div>

                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 shrink-0 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ◀
                  </button>
                </>
              ) : (
                <>
                  <span className="text-2xl">🐾</span>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 shrink-0 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ▶
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Scrollable menu */}

        <nav className="p-4 pb-24 space-y-2 h-[calc(100vh-80px)] overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={getMenuItemClass(isActive(item))}
              title={!sidebarOpen ? item.label : ""}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}

          <div className="space-y-1">
            <button
              onClick={() => {
                if (sidebarOpen) {
                  setStockMenuOpen(!stockMenuOpen);
                } else {
                  navigate("/quan-tri/ton-kho");
                }
              }}
              className={[
                "flex items-center rounded-lg transition-all duration-200",
                sidebarOpen
                  ? "w-full justify-between px-4 py-3"
                  : "w-12 h-12 mx-auto justify-center p-0",
                stockMenuActive
                  ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-orange-50",
              ].join(" ")}
              title={!sidebarOpen ? "Tồn kho" : ""}
            >
              <div
                className={`flex items-center ${
                  sidebarOpen ? "gap-3" : "justify-center"
                }`}
              >
                <span className="text-xl shrink-0">📦</span>
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

          {menuItemsAfterStock.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={getMenuItemClass(isActive(item))}
              title={!sidebarOpen ? item.label : ""}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="shrink-0 border-t bg-white p-4">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              sidebarOpen
                ? "w-full gap-3 px-4 py-3 justify-start"
                : "w-12 h-12 mx-auto justify-center p-0"
            }`}
            title={!sidebarOpen ? "Đăng xuất" : ""}
          >
            <span className="text-xl shrink-0">🚪</span>
            {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
              <p className="text-sm text-gray-500">
                Xin chào, {user?.profile?.fullName || user?.email}
              </p>
            </div>

            <div className="flex items-center gap-4">

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
                      👤 Hồ sơ
                    </Link>

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

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
