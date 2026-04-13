// Lê Nhựt Hào
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { productApi, cartApi } from "../utils/services/api";
import { useAddToCart } from "../hooks/useAddToCart";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/layout/Toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAddToCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error("Failed to parse user:", e);
        }
      }
    }
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if id is a valid ObjectId or a slug
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      let response;
      
      if (isObjectId) {
        response = await productApi.getById(id);
      } else {
        // It's a slug
        response = await productApi.getBySlug(id);
      }
      
      if (response.product) {
        setProduct(response.product);
      } else {
        setError("Không tìm thấy sản phẩm");
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      setToast({
        type: "error",
        title: "Lỗi",
        message: "Sản phẩm không tồn tại",
      });
      return;
    }

    const result = await addToCart(product._id, 1);
    if (result.success) {
      setToast({
        type: "success",
        title: "Thành công!",
        message: result.message,
      });
    } else {
      setToast({
        type: "error",
        title: "Lỗi",
        message: result.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Không tìm thấy sản phẩm"}
            </h2>
            <Link
              to="/"
              className="inline-block mt-4 bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productImage = product.images?.[0]?.url || product.image || "/placeholder.png";
  const price = product.price || 0;
  const comparePrice = product.compareAtPrice;

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-[#846551]">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <img
              src={productImage}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-[#846551]">
                  {price.toLocaleString("vi-VN")}₫
                </span>
                {comparePrice && comparePrice > price && (
                  <span className="text-xl text-gray-400 line-through">
                    {comparePrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả:</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Stock */}
            {product.stock !== undefined && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Còn lại: <span className="font-semibold">{product.stock}</span> sản phẩm
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product || product.stock <= 0}
                className="flex-1 bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product?.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

