import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin";
import { categoryApi, productApi } from "../../services/api";
import Toast from "../../components/layout/Toast";
import CategoryForm from "../../components/admin/CategoryForm";
import { hasWriteAccessForCatalog } from "../../utils/role";
import { EditOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";

export default function AdminCategoryDetailPage() {
  const canManage = hasWriteAccessForCatalog();
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toasts, setToasts] = useState([]);

  const loadCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoryData, categoriesData, productsData] = await Promise.all([
        categoryApi.getById(id),
        categoryApi.getAll(),
        productApi.getAll(),
      ]);

      setCategory(categoryData.category || categoryData);
      setCategories(categoriesData.categories || categoriesData || []);

      // Lọc sản phẩm thuộc danh mục này
      const allProducts = productsData.products || productsData || [];
      const categoryProducts = allProducts.filter((product) =>
        product.categoryIds?.some((catId) =>
          typeof catId === "string" ? catId === id : catId._id === id,
        ),
      );
      setProducts(categoryProducts);
    } catch (err) {
      setError(err.message);
      console.error("Error loading category:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  const addToast = (type, title, message) => {
    const newToast = { id: Date.now(), type, title, message };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleDeleteClick = () => {
    if (!canManage) return;
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canManage) return;
    try {
      await categoryApi.delete(id);
      addToast("success", "Thành công!", "Đã xóa danh mục thành công");
      setTimeout(() => {
        navigate("/quan-tri/danh-muc");
      }, 1500);
    } catch (err) {
      addToast("error", "Lỗi!", "Không thể xóa danh mục: " + err.message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleEditClick = () => {
    if (!canManage) return;
    setShowEditForm(true);
  };

  const handleEditSubmit = async (formData) => {
    if (!canManage) return;
    try {
      const updated = await categoryApi.update(id, formData);
      setCategory(updated.category || updated);
      setShowEditForm(false);
      addToast("success", "Thành công!", "Đã cập nhật danh mục thành công");
    } catch (err) {
      addToast("error", "Lỗi!", "Không thể cập nhật danh mục: " + err.message);
      throw err;
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const handleToggleStatus = async () => {
    if (!canManage) return;
    try {
      const updateData = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: !category.isActive,
      };

      await categoryApi.update(id, updateData);
      setCategory({ ...category, isActive: !category.isActive });
      addToast(
        "success",
        "Thành công!",
        `Đã ${category.isActive ? "tạm ngưng" : "kích hoạt"} danh mục`,
      );
    } catch (err) {
      addToast(
        "error",
        "Lỗi!",
        "Không thể cập nhật trạng thái: " + err.message,
      );
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !category) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || "Không tìm thấy danh mục"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/quan-tri/danh-muc"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Quay lại
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category.name}
              </h1>
              <p className="text-gray-600 mt-1">Chi tiết danh mục</p>
            </div>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg font-medium border transition-all ${category.isActive
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                    : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  }`}
              >
                {category.isActive ? <><PauseCircleOutlined /> Tạm ngưng</> : <><PlayCircleOutlined /> Kích hoạt</>}
              </button>
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <EditOutlined /> Chỉnh sửa
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <DeleteOutlined /> Xóa
              </button>
            </div>
          ) : (
            <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
              Chế độ chỉ xem
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4"> Mô tả</h2>
              <div className="prose max-w-none">
                {category.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Chưa có mô tả</p>
                )}
              </div>
            </div>



            {/* Products in Category */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                   Sản phẩm ({products.length})
                </h2>
              </div>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <Link
                      key={product._id}
                      to={`/quan-tri/san-pham/${product._id}`}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={
                              typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0]?.url
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-orange-600 font-semibold">
                          {formatPrice(product.price)}
                        </div>
                        {product.stock !== undefined && (
                          <div className="text-xs text-gray-500">
                            Tồn kho: {product.stock}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-gray-500">Chưa có sản phẩm nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Trạng thái
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Trạng thái hiện tại
                  </span>
                  <div className="mt-1">
                    {category.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Tạm ngưng
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Slug</span>
                  <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                    {category.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">ID</span>
                  <p className="mt-1 font-mono text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded border break-all">
                    {category._id}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ngày tạo</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(category.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Cập nhật lần cuối
                  </span>
                  <p className="mt-1 text-gray-900">
                    {new Date(category.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thống kê
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Số lượng sản phẩm</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {products.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Sản phẩm đang bán</span>
                  <span className="font-bold text-green-600 text-lg">
                    {products.filter((p) => p.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Sản phẩm tạm ngưng</span>
                  <span className="font-bold text-gray-600 text-lg">
                    {products.filter((p) => !p.isActive).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && canManage && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fade-in border-2 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Xác nhận xóa danh mục
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bạn có chắc chắn muốn xóa danh mục{" "}
                <strong className="text-gray-900">{category.name}</strong>?
                <br />
                <span className="text-sm text-red-600">
                  Hành động này không thể hoàn tác.
                </span>
                {products.length > 0 && (
                  <>
                    <br />
                    <span className="text-sm text-amber-600 font-medium">
                      Lưu ý: Danh mục có {products.length} sản phẩm.
                    </span>
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Form Modal */}
      {showEditForm && canManage && (
        <CategoryForm
          category={category}
          categories={categories.filter((c) => c._id !== category._id)}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
        />
      )}

      {/* Toast Notifications */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </AdminLayout>
  );
}
