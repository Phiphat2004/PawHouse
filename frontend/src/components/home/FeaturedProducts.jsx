
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RightOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { productApi } from "../../services/api";
import { useAddToCart } from "../../hooks/useAddToCart";
import Toast from "../layout/Toast";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { addToCart, loading: cartLoading } = useAddToCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll();
      const productsList = response.products || response || [];
      // Get first 6 active products
      const featuredProducts = productsList
        .filter((p) => p.isActive !== false)
        .slice(0, 6);
      setProducts(featuredProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      // Fallback to empty array
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    // Get first active variation from current product data
    let variation = null;

    if (product.variations && product.variations.length > 0) {
      variation =
        product.variations.find((v) => v.status === "active" && !v.isDeleted) ||
        product.variations[0];
    }

    // If no variation found, reload from API (backend will auto-create default variation if needed)
    if (!variation) {
      try {
        const productDetail = await productApi.getById(product._id);
        if (
          productDetail.product?.variations &&
          productDetail.product.variations.length > 0
        ) {
          variation =
            productDetail.product.variations.find(
              (v) => v.status === "active" && !v.isDeleted,
            ) || productDetail.product.variations[0];
          // Update product in state with new variations
          setProducts((prev) =>
            prev.map((p) =>
              p._id === product._id
                ? { ...p, variations: productDetail.product.variations }
                : p,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load product details:", error);
        setToast({
          type: "error",
          title: "Lỗi",
          message: "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.",
        });
        return;
      }
    }

    if (!variation) {
      setToast({
        type: "error",
        title: "Lỗi",
        message: "Sản phẩm này chưa có biến thể. Vui lòng liên hệ admin.",
      });
      return;
    }

    // Add to cart
    const result = await addToCart(variation._id, 1);
    if (result.success) {
      setToast({
        type: "success",
        title: "Thành công!",
        message: result.message,
      });
      // Reload products to update variations
      loadProducts();
    } else {
      setToast({
        type: "error",
        title: "Lỗi",
        message: result.message,
      });
    }
  };

  return (
    <section className="py-20 bg-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Sản Phẩm Nổi Bật
            </h2>
            <p className="text-gray-600">Được khách hàng yêu thích nhất</p>
          </div>
          <Link
            to="/san-pham"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-500 hover:text-white transition-all"
          >
            Xem tất cả <RightOutlined />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product, index) => {
              const productImage =
                product.images?.[0]?.url || product.image || "/placeholder.png";
              const productPrice =
                product.variations?.[0]?.price || product.price || 0;
              const comparePrice =
                product.variations?.[0]?.compareAtPrice ||
                product.compareAtPrice ||
                product.originalPrice;
              const categoryName =
                product.categoryIds?.[0]?.name ||
                product.category ||
                "Sản phẩm";
              const hasDiscount = comparePrice && comparePrice > productPrice;

              return (
                <div
                  key={product._id || product.id || index}
                  className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <Link to={`/san-pham/${product.slug || product._id}`}>
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                      />
                    </Link>
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 px-3 py-1 bg-linear-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold rounded-full">
                        Giảm{" "}
                        {Math.round(
                          ((comparePrice - productPrice) / comparePrice) * 100,
                        )}
                        %
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={cartLoading}
                        className="p-3 bg-white rounded-full hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                        title="Thêm vào giỏ hàng"
                      >
                        <ShoppingCartOutlined />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-orange-500 font-medium">
                      {categoryName}
                    </span>
                    <Link to={`/san-pham/${product.slug || product._id}`}>
                      <h3 className="font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-[#846551] transition cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-500">
                        {typeof productPrice === "number"
                          ? productPrice.toLocaleString("vi-VN")
                          : productPrice}
                        đ
                      </span>
                      {comparePrice && comparePrice > productPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {typeof comparePrice === "number"
                            ? comparePrice.toLocaleString("vi-VN")
                            : comparePrice}
                          đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
