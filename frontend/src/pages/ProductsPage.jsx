import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { productApi, categoryApi } from "../services/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
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
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      !filterCategory ||
      product.categoryIds?.some((id) =>
        typeof id === "string"
          ? id === filterCategory
          : id._id === filterCategory,
      );

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sản phẩm của chúng tôi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá bộ sưu tập sản phẩm chăm sóc thú cưng chất lượng cao
          </p>
        </div>

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
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tất cả danh mục</option>
                {categories
                  .filter((cat) => cat.isActive)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
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
                              className={`w-10 h-10 rounded-lg font-medium transition ${
                                currentPage === pageNum
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
  const imageUrl =
    product.images && product.images.length > 0
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.url
      : null;

  // Get price from variations or direct from product
  const productPrice = product.variations?.[0]?.price || product.price || 0;
  const comparePrice =
    product.variations?.[0]?.compareAtPrice || product.compareAtPrice || null;
  const hasDiscount = comparePrice && comparePrice > productPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
    : 0;

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <span className="text-6xl">📦</span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-600">
              {productPrice.toLocaleString("vi-VN")}₫
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {comparePrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>
        </div>

        {/* Categories */}
        {product.categoryIds && product.categoryIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.categoryIds.slice(0, 2).map((cat, idx) => (
              <span
                key={cat._id || cat || idx}
                className="inline-block px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
              >
                {cat.name}
              </span>
            ))}
            {product.categoryIds.length > 2 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{product.categoryIds.length - 2}
              </span>
            )}
          </div>
        )}

        {/* View Details Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-orange-600 font-semibold group-hover:gap-2 inline-flex items-center transition-all">
            Xem chi tiết
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
