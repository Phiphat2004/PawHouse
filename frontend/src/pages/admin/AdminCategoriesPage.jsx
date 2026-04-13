import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/admin";
import CategoryTable from "../../components/admin/CategoryTable";
import CategoryForm from "../../components/admin/CategoryForm";
import DeleteCategoryModal from "../../components/admin/DeleteCategoryModal";
import Toast from "../../components/layout/Toast";
import { categoryApi } from "../../services/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data.categories || data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { 
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (categoryId) => {
    try {
      await categoryApi.delete(categoryId);
      setCategories(categories.filter((c) => c._id !== categoryId));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      addToast("✅ Xóa danh mục thành công!", "success");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Lỗi khi xóa danh mục";
      addToast(`❌ ${errorMessage}`, "error");
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingCategory) {
        const updated = await categoryApi.update(editingCategory._id, formData);
        setCategories(
          categories.map((c) =>
            c._id === editingCategory._id ? updated.category || updated : c,
          ),
        );
      } else {
        const created = await categoryApi.create(formData);
        setCategories([created.category || created, ...categories]);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (err) {
      console.error("Form submit error:", err);
      throw err;
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      const category = categories.find((c) => c._id === categoryId);
      if (!category) return;

      const parentId = category.parentId?._id || category.parentId;
      const updateData = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: !currentStatus,
      };

      // Only include parentId if it exists
      if (parentId) {
        updateData.parentId = parentId;
      }

      const updated = await categoryApi.update(categoryId, updateData);

      setCategories(
        categories.map((c) =>
          c._id === categoryId ? updated.category || updated : c,
        ),
      );
      addToast("✅ Cập nhật trạng thái thành công!", "success");
    } catch (err) {
      addToast(`❌ Lỗi khi cập nhật trạng thái: ${err.message}`, "error");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && category.isActive) ||
      (filterStatus === "inactive" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-gray-600">Đang tải...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
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
              📂 Quản lý danh mục
            </h1>
            <p className="text-gray-600 mt-1">Quản lý các danh mục sản phẩm</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-lg hover:shadow-xl"
          >
            ➕ Thêm danh mục
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên, slug hoặc mô tả..."
                  className="w-full pl-12 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {/* Search Results Info */}
          {(searchTerm || filterStatus) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Tìm thấy{" "}
                <span className="font-semibold text-orange-600">
                  {filteredCategories.length}
                </span>{" "}
                kết quả
                {searchTerm && (
                  <span>
                    {" "}
                    cho từ khóa{" "}
                    <span className="font-semibold">"{searchTerm}"</span>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng danh mục</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
              <div className="text-4xl">📂</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.filter((c) => c.isActive).length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tạm ngưng</p>
                <p className="text-2xl font-bold text-gray-600">
                  {categories.filter((c) => !c.isActive).length}
                </p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy kết quả
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus
                  ? "Không có danh mục nào phù hợp với điều kiện tìm kiếm"
                  : "Chưa có danh mục nào"}
              </p>
              {(searchTerm || filterStatus) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("");
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        ) : (
          <CategoryTable
            categories={filteredCategories}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && categoryToDelete && (
          <DeleteCategoryModal
            category={categoryToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </AdminLayout>
  );
}
