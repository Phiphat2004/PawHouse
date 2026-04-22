import { useState, useEffect, useRef } from "react";

import { AdminLayout } from "../../components/admin";
import CategoryTable from "../../components/admin/CategoryTable";
import CategoryForm from "../../components/admin/CategoryForm";
import DeleteCategoryModal from "../../components/admin/DeleteCategoryModal";
import Toast from "../../components/layout/Toast";
import { categoryApi } from "../../services/api";
import { hasWriteAccessForCatalog } from "../../utils/role";

export default function AdminCategoriesPage() {
  const canManage = hasWriteAccessForCatalog();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const loadCategories = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data.categories || data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading categories:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canManage) return;
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category) => {
    if (!canManage) return;
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteClick = (category) => {
    if (!canManage) return;
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (categoryId) => {
    try {
      await categoryApi.delete(categoryId);
      setCategories(categories.filter((c) => c._id !== categoryId));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      addToast("success", "Success!", "Category deleted successfully!");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Error deleting category";
      addToast("error", "Error!", errorMessage);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory._id, formData);
        addToast("success", "Success!", "Category updated successfully!");
      } else {
        await categoryApi.create(formData);
        addToast("success", "Success!", "Category added successfully!");
      }
      setShowForm(false);
      setEditingCategory(null);
      await loadCategories(true); // Silent reload to keep scroll position & filters
    } catch (err) {
      console.error("Form submit error:", err);
      addToast("error", "Error!", err.message || "Error saving category");
      throw err;
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };





  const parentCategories = categories.filter((c) => !c.parentCategory);

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesParent =
      filterParent === "" ||
      (filterParent === "root" && !category.parentCategory) ||
      (filterParent !== "root" &&
        category.parentCategory &&
        (category.parentCategory._id || category.parentCategory).toString() === filterParent);

    return matchesSearch && matchesParent;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-gray-600">Loading...</div>
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
              Category Management
            </h1>
            <p className="text-gray-600 mt-1">Manage product categories</p>
          </div>
          {canManage ? (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <span className="text-xl">+</span>
              <span className="font-medium">Add Category</span>
            </button>
          ) : (
            <span className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500">
              View Only
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Parent Categories</p>
            <p className="text-2xl font-bold text-orange-600">
              {categories.filter((c) => !c.parentCategory).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Sub-categories</p>
            <p className="text-2xl font-bold text-blue-600">
              {categories.filter((c) => !!c.parentCategory).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, slug or description..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex justify-between items-center transition-all shadow-sm hover:border-orange-300"
              >
                <span className="truncate text-gray-700">
                  {filterParent
                    ? parentCategories.find(c => c._id === filterParent)?.name || "Selected Category"
                    : "All Parent Categories"}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCategoryOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  <div
                    onClick={() => { setFilterParent(""); setIsCategoryOpen(false); }}
                    className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 text-sm ${!filterParent ? "font-bold text-orange-600 bg-orange-50" : "text-gray-700"}`}
                  >
                    All Parent Categories
                  </div>
                  {parentCategories.map(p => (
                    <div
                      key={p._id}
                      onClick={() => { setFilterParent(p._id); setIsCategoryOpen(false); }}
                      className={`px-4 py-2.5 cursor-pointer hover:bg-orange-50 transition-colors text-sm border-b border-gray-50 last:border-0 ${filterParent === p._id ? "font-bold text-orange-600 bg-orange-50" : "text-gray-800"}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Table */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No categories match your search criteria"
                  : "No categories yet"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <CategoryTable
            categories={filteredCategories}
            canManage={canManage}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}

        {/* Form Modal */}
        {showForm && canManage && (
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && canManage && categoryToDelete && (
          <DeleteCategoryModal
            category={categoryToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}

        {/* Toast Notifications */}
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            index={index}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </AdminLayout>
  );
}
