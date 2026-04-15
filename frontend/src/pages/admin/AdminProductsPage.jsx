import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/admin";
import ProductTable from "../../components/admin/ProductTable";
import ProductForm from "../../components/admin/ProductForm";
import { productApi } from "../../services/api";
import Toast from "../../components/layout/Toast";
import { hasWriteAccessForCatalog } from "../../utils/role";

export default function AdminProductsPage() {
  const canManage = hasWriteAccessForCatalog();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toasts, setToasts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const addToast = (type, title, message) => {
    const newToast = { id: Date.now(), type, title, message };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productApi.getAll(),
        productApi.getCategories(),
      ]);

      console.log("=== API Response ===");
      console.log("Raw productsData:", productsData);
      console.log(
        "First product:",
        productsData.products?.[0] || productsData?.[0],
      );
      console.log(
        "First product images:",
        productsData.products?.[0]?.images || productsData?.[0]?.images,
      );

      setProducts(productsData.products || productsData || []);
      setCategories(categoriesData.categories || categoriesData || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canManage) return;
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    if (!canManage) return;
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteClick = (product) => {
    if (!canManage) return;
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productApi.delete(productToDelete._id);
      setProducts(products.filter((p) => p._id !== productToDelete._id));
      addToast("success", "Thành công!", "Đã xóa sản phẩm thành công");
    } catch (err) {
      addToast("error", "Lỗi!", "Không thể xóa sản phẩm: " + err.message);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingProduct) {
        console.log("Updating product:", editingProduct._id, formData);
        const updated = await productApi.update(editingProduct._id, formData);
        setProducts(
          products.map((p) =>
            p._id === editingProduct._id ? updated.product || updated : p,
          ),
        );
        addToast("success", "Thành công!", "Đã cập nhật sản phẩm thành công");
      } else {
        console.log("Creating product:", formData);
        const created = await productApi.create(formData);
        setProducts([created.product || created, ...products]);
        addToast("success", "Thành công!", "Đã thêm sản phẩm mới thành công");
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Form submit error:", err);
      addToast("error", "Lỗi!", err.message || "Không thể lưu sản phẩm");
      throw err;
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    if (!canManage) return;
    try {
      // Find the product to get all its data
      const product = products.find((p) => p._id === productId);
      if (!product) {
        alert("Không tìm thấy sản phẩm");
        return;
      }

      // Send complete product data with only isActive changed
      await productApi.update(productId, {
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        categoryIds: product.categoryIds?.map((cat) =>
          typeof cat === "string" ? cat : cat._id,
        ),
        images: product.images || [],
        isActive: !currentStatus,
      });

      setProducts(
        products.map((p) =>
          p._id === productId ? { ...p, isActive: !currentStatus } : p,
        ),
      );
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái: " + err.message);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      !searchTerm ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      !filterCategory ||
      product.categoryIds?.some((id) =>
        typeof id === "string"
          ? id === filterCategory
          : id._id === filterCategory,
      );

    const matchStatus =
      filterStatus === "" ||
      (filterStatus === "active" && product.isActive) ||
      (filterStatus === "inactive" && !product.isActive);

    return matchSearch && matchCategory && matchStatus;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý sản phẩm
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý danh sách sản phẩm của cửa hàng
            </p>
          </div>
          {canManage ? (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <span className="text-xl">+</span>
              <span className="font-medium">Thêm sản phẩm</span>
            </button>
          ) : (
            <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
              Chế độ chỉ xem
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên sản phẩm, thương hiệu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <ProductTable
          products={paginatedProducts}
          categories={categories}
          canManage={canManage}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* Product Form Modal */}
        {showForm && canManage && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && canManage && productToDelete && (
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
                  Xác nhận xóa sản phẩm
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Bạn có chắc chắn muốn xóa sản phẩm{" "}
                  <strong className="text-gray-900">
                    {productToDelete.name}
                  </strong>
                  ?
                  <br />
                  <span className="text-sm text-red-600">
                    Hành động này không thể hoàn tác.
                  </span>
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
      </div>
    </AdminLayout>
  );
}
