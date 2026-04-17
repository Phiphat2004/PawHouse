import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { productApi, categoryApi } from "../services/api";
import { useAddToCart } from "../hooks/useAddToCart";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNode = (id, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleSelectCategory = (id) => {
    setFilterCategory(id);
    setIsDropdownOpen(false);
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll(),
      ]);

      // Filter only active products for users
      const activeProducts = (
        productsData.products ||
        productsData ||
        []
      ).filter((p) => p.isActive);
      setProducts(activeProducts);
      setCategories(categoriesData.categories || categoriesData || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
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

    return matchSearch && matchCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <section className="bg-linear-to-r from-orange-500 to-amber-500 text-white pt-28 pb-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            🛍️ Sản phẩm PawHouse
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Khám phá bộ sưu tập sản phẩm chăm sóc thú cưng chất lượng cao
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm sản phẩm
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên sản phẩm, thương hiệu..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex justify-between items-center transition-all shadow-sm hover:border-orange-300"
                >
                  <span className="truncate font-medium text-gray-700">
                    {filterCategory 
                      ? categories.find(c => c._id === filterCategory)?.name || "Đã chọn"
                      : "Tất cả danh mục"}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto animate-fade-in-down">
                    <div 
                      onClick={() => handleSelectCategory("")}
                      className={`px-4 py-3.5 cursor-pointer hover:bg-orange-50 transition-colors border-b border-gray-100 ${!filterCategory ? "font-bold text-orange-600 bg-orange-50/50" : "text-gray-700"}`}
                    >
                      Tất cả danh mục
                    </div>
                    
                    {categories.filter(c => !c.parentCategory && c.isActive).map(root => {
                      const children = categories.filter(c => (c.parentCategory === root._id || c.parentCategory?._id === root._id) && c.isActive);
                      const isExpanded = expandedNodes[root._id];
                      
                      return (
                        <div key={root._id} className="border-b border-gray-50 last:border-0">
                          <div className={`flex items-center justify-between px-2 hover:bg-gray-50 transition-colors ${filterCategory === root._id ? "bg-orange-50/30" : ""}`}>
                            <div 
                              onClick={() => handleSelectCategory(root._id)}
                              className={`flex-grow cursor-pointer px-2 py-3 ${filterCategory === root._id ? "font-bold text-orange-600" : "font-semibold text-gray-800"}`}
                            >
                              {root.name}
                            </div>
                            
                            {children.length > 0 && (
                              <button 
                                onClick={(e) => toggleNode(root._id, e)}
                                className={`p-2 mr-1 rounded-full transition-colors ${isExpanded ? "text-orange-500 bg-orange-100/50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}
                              >
                                <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                            )}
                          </div>
                          
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="bg-gray-50/50 py-1 border-l-2 border-orange-200 ml-4 mb-2 mr-2 rounded-r-lg">
                              {children.map(child => (
                                <div
                                  key={child._id}
                                  onClick={() => handleSelectCategory(child._id)}
                                  className={`px-4 py-2.5 cursor-pointer hover:bg-orange-100 hover:text-orange-700 transition-colors ${filterCategory === child._id ? "font-bold text-orange-600 bg-orange-100/50" : "text-gray-600"}`}
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
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-600">
                  Thử thay đổi bộ lọc hoặc tìm kiếm khác
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-gray-600">
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-900">
                    {startIndex + 1} -{" "}
                    {Math.min(endIndex, filteredProducts.length)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredProducts.length}
                  </span>{" "}
                  sản phẩm
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {currentProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      ← Trước
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-2">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium transition ${currentPage === pageNum
                                ? "bg-orange-500 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="w-10 h-10 flex items-center justify-center text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart, loading: cartLoading } = useAddToCart();

  const imageUrl =
    product.images && product.images.length > 0
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.url
      : null;

  const productPrice = product.variations?.[0]?.price || product.price || 0;
  const comparePrice =
    product.variations?.[0]?.compareAtPrice || product.compareAtPrice || null;
  const hasDiscount = comparePrice && comparePrice > productPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await addToCart(product._id, 1);
    if (result.success) {
      toast.success(result.message || "Đã thêm vào giỏ hàng!");
    } else if (result.message !== "Cần đăng nhập") {
      toast.error(result.message || "Có lỗi xảy ra");
    }
  };

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <span className="text-6xl">📦</span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-[#ff4d2e] text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Floating Add to Cart Button (Bottom Right of Image) */}
        <button
          onClick={handleAddToCart}
          disabled={cartLoading}
          className="absolute bottom-3 right-3 w-10 h-10 bg-[#ff4d2e] text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#e64529] z-10"
          title="Thêm vào giỏ hàng"
        >
          <ShoppingCartOutlined className="text-lg" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] text-[#ff4d2e] font-bold uppercase tracking-widest mb-1.5">
            {product.brand}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug group-hover:text-[#ff4d2e] transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-gray-500 line-clamp-2 mb-3 leading-tight h-8">
          {product.description || "Khám phá các sản phẩm chất lượng từ PawHouse."}
        </p>

        {/* Price & Category Section */}
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#ff4d2e]">
              {productPrice.toLocaleString("vi-VN")}₫
            </span>
            {hasDiscount && (
              <span className="text-[12px] text-gray-400 line-through">
                {comparePrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          {product.categoryIds && product.categoryIds.length > 0 && (
            <span className="px-2.5 py-0.5 bg-[#fff5f2] text-[#ff4d2e] text-[10px] font-medium rounded-full">
              {product.categoryIds[0].name || product.categoryIds[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
