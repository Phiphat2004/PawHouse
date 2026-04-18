import React, { useState, useEffect, useRef } from "react";
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

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const dropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNode = (id, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectCategory = (id) => {
    setFilterCategory(id);
    setIsCategoryOpen(false);
  };

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

    const matchCategory = !filterCategory || (() => {
      const childCatIds = categories
        .filter(c => c.parentCategory === filterCategory || c.parentCategory?._id === filterCategory)
        .map(c => c._id);
      const validIds = [filterCategory, ...childCatIds];

      return product.categoryIds?.some((id) => {
        const pid = typeof id === "string" ? id : id._id;
        return validIds.includes(pid);
      });
    })();

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tổng sản phẩm</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tạm ngưng</p>
            <p className="text-2xl font-bold text-gray-600">
              {products.filter((p) => !p.isActive).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên sản phẩm, thương hiệu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex justify-between items-center transition-all shadow-sm hover:border-orange-300"
                >
                  <span className="truncate text-gray-700">
                    {filterCategory
                      ? categories.find(c => c._id === filterCategory)?.name || "Đã chọn"
                      : "Tất cả danh mục"}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isCategoryOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto animate-fade-in-down">
                    <div
                      onClick={() => handleSelectCategory("")}
                      className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 ${!filterCategory ? "font-bold text-orange-600 bg-orange-50" : "text-gray-700"}`}
                    >
                      Tất cả danh mục
                    </div>

                    {categories.filter(c => !c.parentCategory && c.isActive !== false).map(root => {
                      const children = categories.filter(c => c.parentCategory === root._id || c.parentCategory?._id === root._id);
                      const isExpanded = expandedNodes[root._id];

                      return (
                        <div key={root._id} className="border-b border-gray-50 last:border-0">
                          <div className={`flex items-center justify-between px-2 hover:bg-gray-50 transition-colors ${filterCategory === root._id ? "bg-orange-50" : ""}`}>
                            <div
                              onClick={() => handleSelectCategory(root._id)}
                              className={`flex-grow cursor-pointer px-2 py-2 text-sm ${filterCategory === root._id ? "font-bold text-orange-600" : "font-medium text-gray-800"}`}
                            >
                              {root.name}
                            </div>

                            {children.length > 0 && (
                              <button
                                onClick={(e) => toggleNode(root._id, e)}
                                className={`p-1 mr-1 rounded bg-transparent transition-colors ${isExpanded ? "text-orange-500 bg-orange-100/50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}
                              >
                                <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                            )}
                          </div>

                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="bg-gray-50 py-1 border-l-2 border-orange-200 ml-3 mb-1 mr-1 rounded-r">
                              {children.map(child => (
                                <div
                                  key={child._id}
                                  onClick={() => handleSelectCategory(child._id)}
                                  className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-orange-100 hover:text-orange-700 transition-colors ${filterCategory === child._id ? "font-bold text-orange-600 bg-orange-100/50" : "text-gray-600"}`}
                                >
                                  {child.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex justify-between items-center transition-all shadow-sm hover:border-orange-300"
                >
                  <span className="truncate text-gray-700">
                    {filterStatus === "active" ? "Đang hoạt động" : filterStatus === "inactive" ? "Tạm ngưng" : "Tất cả trạng thái"}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isStatusOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isStatusOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl animate-fade-in-down">
                    <div
                      onClick={() => { setFilterStatus(""); setIsStatusOpen(false); }}
                      className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 text-sm ${filterStatus === "" ? "font-bold text-orange-600 bg-orange-50" : "text-gray-700"}`}
                    >
                      Tất cả trạng thái
                    </div>
                    <div
                      onClick={() => { setFilterStatus("active"); setIsStatusOpen(false); }}
                      className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 text-sm ${filterStatus === "active" ? "font-bold text-orange-600 bg-orange-50" : "text-gray-700"}`}
                    >
                      Đang hoạt động
                    </div>
                    <div
                      onClick={() => { setFilterStatus("inactive"); setIsStatusOpen(false); }}
                      className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors text-sm ${filterStatus === "inactive" ? "font-bold text-orange-600 bg-orange-50" : "text-gray-700"}`}
                    >
                      Tạm ngưng
                    </div>
                  </div>
                )}
              </div>
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
