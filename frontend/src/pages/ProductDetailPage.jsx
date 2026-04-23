
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
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
        setSelectedImageIdx(0);
      } else {
        setError("Product not found");
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Unable to load product information");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      setToast({
        type: "error",
        title: "Error",
        message: "Product does not exist",
      });
      return;
    }

    const result = await addToCart(product._id, quantity);
    if (result.success) {
      setToast({
        type: "success",
        title: "Success!",
        message: result.message,
      });
    } else {
      setToast({
        type: "error",
        title: "Error",
        message: result.message,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Check stock before proceeding
    if (product?.stock && quantity > product.stock) {
      setToast({
        type: "error",
        title: "Insufficient stock",
        message: `Only ${product.stock} items left in stock.`,
      });
      return;
    }

    // Pass the item directly to checkout state
    navigate("/checkout", { 
      state: { 
        buyNowItem: {
          product_id: product,
          quantity: quantity
        } 
      } 
    });
  };

  const handleQuantityChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (product?.stock && val > product.stock) {
      val = product.stock;
      setToast({
        type: "error",
        title: "Insufficient stock",
        message: `Only ${product.stock} items left in stock.`,
      });
    }
    setQuantity(val);
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Loading product...</p>
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
              {error || "Product not found"}
            </h2>
            <Link
              to="/"
              className="inline-block mt-4 bg-[#846551] text-white px-6 py-3 rounded-lg hover:bg-[#6d5041] transition"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = product.images?.length > 0 ? product.images : (product.image ? [product.image] : ["/placeholder.png"]);
  const currentImageObj = allImages[selectedImageIdx] || allImages[0];
  const mainImageUrl = typeof currentImageObj === 'string' ? currentImageObj : (currentImageObj?.url || "/placeholder.png");

  const price = product.price || 0;
  const comparePrice = product.compareAtPrice;

  return (
    <div className="font-['Inter',sans-serif] bg-gray-100 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-[#ff4d2e] transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/san-pham" className="text-gray-500 hover:text-[#ff4d2e] transition-colors">
            Products
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product Image Section */}
            <div className="p-6 lg:p-8 bg-gray-50/50 flex flex-col items-center justify-center">
              <div className="w-full max-w-[400px]">
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl bg-white group mb-4">
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {product.compareAtPrice > product.price && (
                    <div className="absolute top-4 right-4 bg-[#ff4d2e] text-white font-bold px-3 py-1 rounded-full shadow-lg text-xs">
                      Save {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {allImages.map((img, idx) => {
                      const imgUrl = typeof img === 'string' ? img : img.url;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIdx(idx)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageIdx === idx
                            ? "border-[#ff4d2e] shadow-md scale-105"
                            : "border-transparent opacity-70 hover:opacity-100 bg-white shadow-sm"
                            }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="p-8 lg:p-12 lg:border-l border-gray-100 flex flex-col">
              {product.brand && (
                <p className="text-[#ff4d2e] font-bold text-xs uppercase tracking-[0.2em] mb-4">
                  Brand: {product.brand}
                </p>
              )}

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#ff4d2e]">
                  {price.toLocaleString("vi-VN")}₫
                </span>
                {comparePrice && comparePrice > price && (
                  <span className="text-2xl text-gray-400 line-through decoration-2">
                    {comparePrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-10 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Product Description</h3>
                <div className="h-[1px] bg-gray-100 w-24"></div>
                <p className="text-gray-600 leading-relaxed text-lg italic">
                  "{product.description || "A high-quality product from PawHouse — the best choice for your pet."}"
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-auto space-y-6">
                <div className="flex items-center gap-4 text-sm">

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${product.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-600" : "bg-red-600"
                      }`}></span>
                    {product.stock > 0 ? `Only ${product.stock} left in stock` : "Out of Stock"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 mt-6">
                  {product?.stock > 0 && (
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-2 rounded-xl w-max">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-16 h-10 text-center bg-transparent border-none font-semibold text-gray-900 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none p-0"
                      />
                      <button
                        onClick={() => {
                          if (quantity < product.stock) setQuantity(quantity + 1);
                        }}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={!product || product.stock <= 0}
                      className="flex-1 bg-white border-2 border-[#ff4d2e] text-[#ff4d2e] px-8 py-4 rounded-xl hover:bg-orange-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
                    >
                      {product?.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={!product || product.stock <= 0}
                      className="flex-1 bg-[#ff4d2e] text-white !text-white px-8 py-4 rounded-xl hover:bg-[#e64529] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-lg shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

