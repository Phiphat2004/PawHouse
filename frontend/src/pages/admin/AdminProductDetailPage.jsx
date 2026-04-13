import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin";
import { productApi } from "../../utils/services/api";
import Toast from "../../components/layout/Toast";
import ProductForm from "../../components/admin/ProductForm";

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const [productData, categoriesData] = await Promise.all([
        productApi.getById(id),
        productApi.getCategories(),
      ]);
      setProduct(productData.product);
      setCategories(categoriesData.categories || categoriesData || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToast = (type, title, message) => {
    const newToast = { id: Date.now(), type, title, message };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productApi.delete(id);
      addToast("success", "Thành công!", "Xóa sản phẩm thành công");
      setTimeout(() => {
        navigate("/quan-tri/san-pham");
      }, 1500);
    } catch (err) {
      addToast("error", "Lỗi!", "Không thể xóa sản phẩm: " + err.message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      const updated = await productApi.update(id, formData);
      setProduct(updated.product || updated);
      setShowEditForm(false);
      addToast("success", "Thành công!", "Đã cập nhật sản phẩm thành công");
    } catch (err) {
      addToast("error", "Lỗi!", "Không thể cập nhật sản phẩm: " + err.message);
      throw err;
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const handleToggleStatus = async () => {
    try {
      await productApi.update(id, {
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        sku: product.sku,
        categoryIds: product.categoryIds?.map((cat) =>
          typeof cat === "string" ? cat : cat._id,
        ),
        images: product.images || [],
        isActive: !product.isActive,
      });
      setProduct({ ...product, isActive: !product.isActive });
      addToast(
        "success",
        "Thành công!",
        `Đã ${product.isActive ? "tạm ngưng" : "kích hoạt"} sản phẩm`,
      );
    } catch (err) {
      addToast(
        "error",
        "Lỗi!",
        "Không thể cập nhật trạng thái: " + err.message,
      );
    }
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

  if (error || !product) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || "Không tìm thấy sản phẩm"}
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
              to="/quan-tri/san-pham"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Quay lại
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
              <p className="text-gray-600 mt-1">Chi tiết sản phẩm</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleToggleStatus}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                product.isActive
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {product.isActive ? "Tạm ngưng" : "Kích hoạt"}
            </button>
            <button
              onClick={handleEditClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Hình ảnh sản phẩm
              </h2>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={typeof img === "string" ? img : img.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả</h2>
              <div className="prose max-w-none">
                {product.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Chưa có mô tả</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Danh mục</h2>
              {product.categoryIds && product.categoryIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.categoryIds.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/quan-tri/danh-muc`}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">Chưa có danh mục</p>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Price & Stock Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Giá & Kho hàng
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">SKU</span>
                  <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                    {product.sku || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Giá bán</span>
                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.price || 0)}
                  </p>
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <p className="mt-1 text-sm text-gray-500 line-through">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.compareAtPrice)}
                      </p>
                    )}
                </div>
                <div>
                  <span className="text-sm text-gray-600">Tồn kho</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${
                        product.stock === 0
                          ? "bg-red-100 text-red-800"
                          : product.stock < 10
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.stock || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.stock === 0
                        ? "Hết hàng"
                        : product.stock < 10
                          ? "Sắp hết"
                          : "Còn hàng"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
                    {product.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        ⊗ Tạm ngưng
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Slug</span>
                  <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                    {product.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin cơ bản
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">ID</span>
                  <p className="mt-1 font-mono text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded border break-all">
                    {product._id}
                  </p>
                </div>
                {product.brand && (
                  <div>
                    <span className="text-sm text-gray-600">Thương hiệu</span>
                    <p className="mt-1 text-gray-900 font-medium">
                      {product.brand}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Ngày tạo</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(product.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Cập nhật lần cuối
                  </span>
                  <p className="mt-1 text-gray-900">
                    {new Date(product.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                {product.createdBy && (
                  <div>
                    <span className="text-sm text-gray-600">Người tạo</span>
                    <p className="mt-1 text-gray-900">
                      {product.createdBy.firstName} {product.createdBy.lastName}
                      <br />
                      <span className="text-sm text-gray-500">
                        {product.createdBy.email}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thống kê</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Số lượng hình ảnh</span>
                  <span className="font-bold text-gray-900">
                    {product.images?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Số danh mục</span>
                  <span className="font-bold text-gray-900">
                    {product.categoryIds?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Độ dài mô tả</span>
                  <span className="font-bold text-gray-900">
                    {product.description?.length || 0} ký tự
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fade-in">
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
                Xác nhận xóa sản phẩm
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm{" "}
                <strong>{product.name}</strong>? Hành động này không thể hoàn
                tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Form Modal */}
      {showEditForm && (
        <ProductForm
          product={product}
          categories={categories}
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
