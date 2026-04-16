import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { authApi } from "./services/api";
import { STORAGE_KEYS } from "./utils/constants";

import {
  HomePage,
  AuthPage,
  ProfilePage,
  EditProfilePage,
  ProductsPage,
  ProductDetailPage,
  CommunityPage,
  PostDetailPage,
  CreatePostPage,
  MyPostsPage,
  CartPage,
  CheckoutPage,
  OrderPage,
  OrderDetailPage,
  CareAppointmentsPage,
  AboutPage,
  ContactPage,
  AdminDashboardPage,
  AdminProductsPage,
  AdminProductDetailPage,
  AdminCategoriesPage,
  AdminCategoryDetailPage,
  AdminPostsPage,
  AdminPostDetailPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  CreateStockEntryPage,
  StockListPage,
  StockDetailPage,
  StockMovementHistoryPage,
  AccountManagementPage,
  AdminProfilePage,
  AdminCareAppointmentsPage,
  AdminEditProfilePage,
} from "./pages";
import ChangePasswordPage from "./pages/ChangePasswordPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function AdminOnlyRoute({ children, currentUser, ready }) {
  if (!ready) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  if (!roles.includes("admin")) {
    return <Navigate to="/quan-tri" replace />;
  }

  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncCurrentUser() {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setAuthReady(true);
        }
        return;
      }

      try {
        const response = await authApi.me();
        const user = response?.user;
        if (user && isMounted) {
          const normalizedUser = {
            id: user.id,
            email: user.email,
            fullName: user.profile?.fullName || "",
            avatarUrl: user.profile?.avatarUrl || "",
            roles: user.roles || [],
            isAdmin: Array.isArray(user.roles) && user.roles.includes("admin"),
            isStaff: Array.isArray(user.roles) && user.roles.includes("staff"),
          };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
          setCurrentUser(normalizedUser);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    }

    syncCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/san-pham" element={<ProductsPage />} />
        <Route path="/san-pham/:id" element={<ProductDetailPage />} />
        <Route path="/cong-dong" element={<CommunityPage />} />
        <Route path="/cong-dong/tao-bai-viet" element={<CreatePostPage />} />
        <Route path="/cong-dong/bai-viet-cua-toi" element={<MyPostsPage />} />
        <Route path="/cong-dong/:slug" element={<PostDetailPage />} />
        <Route path="/tai-khoan" element={<ProfilePage />} />
        <Route path="/tai-khoan/chinh-sua" element={<EditProfilePage />} />
        <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />
        <Route path="/ve-chung-toi" element={<AboutPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/don-hang" element={<OrderPage />} />
        <Route path="/don-hang/:id" element={<OrderDetailPage />} />
        <Route path="/lich-cham-soc" element={<CareAppointmentsPage />} />
        <Route path="/quan-tri" element={<AdminDashboardPage />} />
        <Route path="/quan-tri/san-pham" element={<AdminProductsPage />} />
        <Route
          path="/quan-tri/san-pham/:id"
          element={<AdminProductDetailPage />}
        />
        <Route path="/quan-tri/danh-muc" element={<AdminCategoriesPage />} />
        <Route
          path="/quan-tri/danh-muc/:id"
          element={<AdminCategoryDetailPage />}
        />
        <Route path="/quan-tri/cong-dong" element={<AdminPostsPage />} />
        <Route path="/quan-tri/cong-dong/:slug" element={<AdminPostDetailPage />} />
        <Route path="/quan-tri/don-hang" element={<AdminOrdersPage />} />
        <Route path="/quan-tri/don-hang/:id" element={<AdminOrderDetailPage />} />
        <Route path="/quan-tri/ton-kho" element={<StockListPage />} />
        <Route path="/quan-tri/ton-kho/:productId" element={<StockDetailPage />} />
        <Route path="/quan-tri/lich-su-xuat-nhap-kho" element={<StockMovementHistoryPage />} />
        <Route path="/quan-tri/nhap-kho" element={<CreateStockEntryPage />} />
        <Route
          path="/quan-tri/khach-hang"
          element={
            <AdminOnlyRoute currentUser={currentUser} ready={authReady}>
              <AccountManagementPage />
            </AdminOnlyRoute>
          }
        />
        <Route path="/quan-tri/lich-cham-soc" element={<AdminCareAppointmentsPage />} />
        <Route path="/quan-tri/tai-khoan" element={<AdminProfilePage />} />
        <Route path="/quan-tri/tai-khoan/chinh-sua" element={<AdminEditProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
