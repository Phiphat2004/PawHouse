// Lê Nhựt Hào
import { useState } from "react";
import { cartApi } from "../utils/services/api";
import { STORAGE_KEYS } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { updateCartCount, optimisticAddToCart } from "./useCart";

export function useAddToCart() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addToCart = async (product_id, quantity = 1) => {
    // Check if user is logged in
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      const shouldLogin = confirm("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Bạn có muốn đăng nhập không?");
      if (shouldLogin) {
        navigate("/login");
      }
      return { success: false, message: "Cần đăng nhập" };
    }

    try {
      setLoading(true);
      
      // Optimistic update - cập nhật UI ngay lập tức
      optimisticAddToCart(quantity);
      
      const response = await cartApi.addToCart({ product_id, quantity });
      
      // Cart service returns { message, cart } or success
      if (response.message && response.cart) {
        // Force refresh to get accurate data
        await updateCartCount(true);
        return { 
          success: true, 
          message: response.message || "Đã thêm vào giỏ hàng thành công!",
          data: response.cart 
        };
      } else if (response.status === "success") {
        // Force refresh to get accurate data
        await updateCartCount(true);
        return { 
          success: true, 
          message: response.message || "Đã thêm vào giỏ hàng thành công!",
          data: response.data 
        };
      } else {
        return { 
          success: false, 
          message: response.message || "Không thể thêm vào giỏ hàng" 
        };
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      const errorMessage = error.message || "Không thể thêm vào giỏ hàng";
      
      // Handle specific error cases
      if (error.status === 401) {
        const shouldLogin = confirm("Phiên đăng nhập đã hết hạn. Bạn có muốn đăng nhập lại không?");
        if (shouldLogin) {
          navigate("/login");
        }
        return { success: false, message: "Phiên đăng nhập đã hết hạn" };
      }
      
      if (error.status === 403) {
        return { success: false, message: "Bạn không có quyền thực hiện thao tác này" };
      }

      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { addToCart, loading };
}

