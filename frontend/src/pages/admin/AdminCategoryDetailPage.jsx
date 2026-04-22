import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin";
import { categoryApi, productApi } from "../../services/api";
import Toast from "../../components/layout/Toast";
import CategoryForm from "../../components/admin/CategoryForm";
import { hasWriteAccessForCatalog } from "../../utils/role";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

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

      // Find all sub-categories (recursively)
      const catsList = categoriesData.categories || categoriesData || [];
      const categoryTree = {};
      catsList.forEach(c => {
        const pId = c.parentCategory?._id || c.parentCategory;
        if (pId) {
          if (!categoryTree[pId]) categoryTree[pId] = [];
          categoryTree[pId].push(c._id);
        }
      });

      const getDescendants = (catId) => {
        let ids = [catId];
        const children = categoryTree[catId] || [];
        for (const child of children) {
          ids = ids.concat(getDescendants(child));
        }
        return ids;
      };

      const validIds = getDescendants(id);

      // Filter products belonging to this category (including sub-categories)
      const allProducts = productsData.products || productsData || [];
      const categoryProducts = allProducts.filter((product) =>
        product.categoryIds?.some((catId) => {
          const pid = typeof catId === "string" ? catId : catId._id;
          return validIds.includes(pid);
        })
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
      addToast("success", "Success!", "Category deleted successfully");
      setTimeout(() => {
        navigate("/quan-tri/danh-muc");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Cannot delete category";
      addToast("error", "", errorMessage);
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
      addToast("success", "Success!", "Category updated successfully");
    } catch (err) {
      addToast("error", "Error!", "Cannot update category: " + err.message);
      throw err;
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
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
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !category) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || "Category not found"}
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
              ← Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category.name}
              </h1>
              <p className="text-gray-600 mt-1">Category details</p>
            </div>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <EditOutlined /> Edit
              </button>
                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <DeleteOutlined /> Delete
                  </button>
                </div>
          ) : (
            <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
              View-only mode
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                {category.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No description yet</p>
                )}
              </div>
            </div>

            {/* Display parent category or sub-categories depending on position */}
            {category.parentCategory && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Parent category</h2>
                {(() => {
                  const parentId = category.parentCategory._id || category.parentCategory;
                  const parentName =
                    category.parentCategory.name ||
                    categories.find((c) => c._id === parentId || c._id?.toString() === parentId?.toString())?.name ||
                    "Parent category";
                  return (
                    <Link
                      to={`/quan-tri/danh-muc/${parentId}`}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-medium text-gray-900 inline-flex w-fit"
                    >
                      <span className="text-orange-400">📂</span>
                      {parentName}
                    </Link>
                  );
                })()}
              </div>
            )}


            {/* Subcategories - only show when parent category has children */}
            {(() => {
              const subs = categories.filter(
                (c) =>
                  c.parentCategory &&
                  (c.parentCategory._id || c.parentCategory).toString() === id
              );
              return subs.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Sub-categories ({subs.length})
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => (
                      <Link
                        key={sub._id}
                        to={`/quan-tri/danh-muc/${sub._id}`}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-medium text-gray-900"
                      >
                        <span className="text-orange-400">📁</span>
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}


            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Products ({products.length})
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
                            Stock: {product.stock}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-gray-500">No products yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">




            {/* Status Card */}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Status
              </h2>
              <div className="space-y-4">
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
                Information
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">ID</span>
                  <p className="mt-1 font-mono text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded border break-all">
                    {category._id}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created Date</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(category.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Last Updated
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
                Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Product quantity</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {products.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Active products</span>
                  <span className="font-bold text-green-600 text-lg">
                    {products.filter((p) => p.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Inactive products</span>
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
                Confirm category deletion
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete category{" "}
                <strong className="text-gray-900">{category.name}</strong>?
                <br />
                <span className="text-sm text-red-600">
                  This action cannot be undone.
                </span>
                {products.length > 0 && (
                  <>
                    <br />
                    <span className="text-sm text-amber-600 font-medium">
                      Note: Category has {products.length} products.
                    </span>
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Delete
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
