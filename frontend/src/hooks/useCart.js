// Hook to manage cart state globally
import { useState, useEffect } from 'react';
import { cartApi } from '../utils/services/api';
import { STORAGE_KEYS } from '../utils/constants';

let cartItemCount = 0;
let cachedCartData = null;
let listeners = [];
let dataListeners = [];

// Subscribe to cart changes
export const subscribeToCart = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

// Subscribe to cart data changes
export const subscribeToCartData = (listener) => {
  dataListeners.push(listener);
  return () => {
    dataListeners = dataListeners.filter(l => l !== listener);
  };
};

// Notify all listeners
const notifyListeners = () => {
  listeners.forEach(listener => listener(cartItemCount));
};

const notifyDataListeners = () => {
  dataListeners.forEach(listener => listener(cachedCartData));
};

// Update cart count and cache data
export const updateCartCount = async (forceRefresh = false) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) {
    cartItemCount = 0;
    cachedCartData = null;
    notifyListeners();
    notifyDataListeners();
    return null;
  }

  // Return cached data if available and not forcing refresh
  if (cachedCartData && !forceRefresh) {
    return cachedCartData;
  }

  try {
    const response = await cartApi.getCart();
    const cart = response.cart;
    
    // Cache the cart data
    cachedCartData = cart;
    
    if (cart && cart.items) {
      // Count total items (sum of all quantities)
      cartItemCount = cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
    } else {
      cartItemCount = 0;
    }
    
    notifyListeners();
    notifyDataListeners();
    return cart;
  } catch (error) {
    console.error('Failed to fetch cart count:', error);
    cartItemCount = 0;
    cachedCartData = null;
    notifyListeners();
    notifyDataListeners();
    return null;
  }
};

// Get cached cart data
export const getCachedCart = () => cachedCartData;

// Optimistic update for adding to cart
export const optimisticAddToCart = (quantity = 1) => {
  cartItemCount += quantity;
  notifyListeners();
};

// Custom hook to use cart count
export const useCart = () => {
  const [count, setCount] = useState(cartItemCount);

  useEffect(() => {
    // Initial fetch
    updateCartCount();

    // Subscribe to changes
    const unsubscribe = subscribeToCart(setCount);

    return unsubscribe;
  }, []);

  return { count, updateCart: updateCartCount };
};
