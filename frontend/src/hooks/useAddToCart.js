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
      const shouldLogin = confirm("You need to log in to add products to your cart. Would you like to log in?");
      if (shouldLogin) {
        navigate("/login");
      }
      return { success: false, message: "Login required" };
    }

    try {
      setLoading(true);
      
      // Optimistic update - update UI immediately
      optimisticAddToCart(quantity);
      
      const response = await cartApi.addToCart({ product_id, quantity });
      
      // Cart service returns { message, cart } or success
      if (response.message && response.cart) {
        // Force refresh to get accurate data
        await updateCartCount(true);
        return { 
          success: true, 
          message: response.message || "Added to cart successfully!",
          data: response.cart 
        };
      } else if (response.status === "success") {
        // Force refresh to get accurate data
        await updateCartCount(true);
        return { 
          success: true, 
          message: response.message || "Added to cart successfully!",
          data: response.data 
        };
      } else {
        return { 
          success: false, 
          message: response.message || "Unable to add to cart" 
        };
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      const errorMessage = error.message || "Unable to add to cart";
      
      // Handle specific error cases
      if (error.status === 401) {
        const shouldLogin = confirm("Your session has expired. Would you like to log in again?");
        if (shouldLogin) {
          navigate("/login");
        }
        return { success: false, message: "Session expired" };
      }
      
      if (error.status === 403) {
        return { success: false, message: "You do not have permission to perform this action" };
      }

      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { addToCart, loading };
}

