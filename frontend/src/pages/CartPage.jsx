import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import CartItem from "../components/home/CartItem";
import CartSummary from "../components/home/CartSummary";
import Toast from "../components/layout/Toast";
import { cartApi } from "../utils/services/api";
import { STORAGE_KEYS } from "../utils/constants";
import { updateCartCount, getCachedCart, subscribeToCartData } from "../hooks/useCart";

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showErrorToast = (message) => {
    const msg = message || "Unable to update quantity";
    const isStockError = msg.toLowerCase().includes("only") || msg.toLowerCase().includes("stock");

    setToast({
      type: "error",
      title: isStockError ? "Insufficient stock" : "An error occurred",
      message: msg,
    });
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      alert("Please log in to view your cart");
      navigate("/login");
      return;
    }
    fetchCart();

    // Subscribe to cart data changes
    const unsubscribe = subscribeToCartData((cartData) => {
      if (cartData && cartData.items) {
        setCartItems(cartData.items);
        setSelectedItems(cartData.items.map((item) => item._id));
      }
    });

    return unsubscribe;
  }, [navigate]);

  // Fetch cart data
  const fetchCart = async (skipLoading = false) => {
    try {
      // Try to use cached data first
      const cached = getCachedCart();
      if (cached && !skipLoading) {
        if (cached.items && cached.items.length > 0) {
          setCartItems(cached.items);
          setSelectedItems(cached.items.map((item) => item._id));
        }
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);

      // Fetch fresh data
      const cartData = await updateCartCount(true);

      if (cartData && cartData.items && cartData.items.length > 0) {
        // items is array of CartItem objects with: _id, product_id, quantity, added_at
        setCartItems(cartData.items);
        // Auto-select all items by their _id
        setSelectedItems(cartData.items.map((item) => item._id));
      } else {
        // Cart is empty
        setCartItems([]);
        setSelectedItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      // If cart doesn't exist, it's not an error
      if (err.status !== 404) {
        setError("Unable to load cart. Please try again.");
      }
      setCartItems([]);
      setSelectedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle increase quantity
  const handleIncrease = async (itemId) => {
    try {
      const item = cartItems.find((i) => i._id === itemId);
      if (!item) return;

      const stock = Number(item.product_id?.stock);
      const newQuantity = item.quantity + 1;
      if (!Number.isNaN(stock) && stock >= 0 && newQuantity > stock) {
        setToast({
          type: "error",
          title: "Insufficient stock",
          message: `Only ${stock} items left in stock`,
        });
        return;
      }

      await cartApi.updateQuantity(itemId, newQuantity);
      await fetchCart(); // Refresh cart
      updateCartCount(); // Update cart count in header
    } catch (err) {
      console.error("Failed to update quantity:", err);
      showErrorToast(err.message || err.data?.message || "Unable to update quantity");
    }
  };

  // Handle decrease quantity
  const handleDecrease = async (itemId) => {
    try {
      const item = cartItems.find((i) => i._id === itemId);
      if (!item) return;

      const newQuantity = Math.max(1, item.quantity - 1);
      await cartApi.updateQuantity(itemId, newQuantity);
      await fetchCart(); // Refresh cart
      updateCartCount(); // Update cart count in header
    } catch (err) {
      console.error("Failed to update quantity:", err);
      showErrorToast(err.message || err.data?.message || "Unable to update quantity");
    }
  };

  // Handle specific quantity change
  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const item = cartItems.find((i) => i._id === itemId);
      // Wait for it
      if (!item) return;
      if (newQuantity === item.quantity) return;

      const validQuantity = Math.max(1, newQuantity);
      const stock = Number(item.product_id?.stock);
      if (!Number.isNaN(stock) && stock >= 0 && validQuantity > stock) {
        setToast({
          type: "error",
          title: "Insufficient stock",
          message: `Only ${stock} items left in stock`,
        });
        return;
      }

      await cartApi.updateQuantity(itemId, validQuantity);
      await fetchCart(); // Refresh cart
      updateCartCount(); // Update cart count in header
    } catch (err) {
      console.error("Failed to update quantity:", err);
      showErrorToast(err.message || err.data?.message || "Unable to update quantity");
    }
  };

  // Handle remove item
  const handleRemove = async (itemId) => {
    try {
      const item = cartItems.find((i) => i._id === itemId);
      if (!item) return;

      if (!confirm("Are you sure you want to remove this product from your cart?")) {
        return;
      }

      await cartApi.removeItem(item.product_id._id || item.product_id);
      await fetchCart(); // Refresh cart
      updateCartCount(); // Update cart count in header
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert(err.data?.message || "Unable to remove product");
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    try {
      if (!confirm("Are you sure you want to remove all products from your cart?")) {
        return;
      }

      await cartApi.clearCart();
      setCartItems([]);
      setSelectedItems([]);
      updateCartCount(); // Update cart count in header
    } catch (err) {
      console.error("Failed to clear cart:", err);
      alert(err.data?.message || "Unable to clear cart");
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item._id));
    }
  };

  // Calculate totals
  const calculateTotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    const itemsToSum =
      selectedItems.length > 0
        ? cartItems.filter((item) => selectedItems.includes(item._id))
        : cartItems;
    return itemsToSum.reduce(
      (sum, item) =>
        sum + (item.product_id?.price || 0) * item.quantity,
      0
    );
  };

  const total = calculateTotal();
  // totalQuantity: sum of quantities for selected items (if any) or whole cart
  const totalQuantity = selectedItems.length > 0
    ? cartItems.filter(item => selectedItems.includes(item._id)).reduce((s, i) => s + (i.quantity || 0), 0)
    : cartItems.reduce((s, i) => s + (i.quantity || 0), 0);

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {cartItems.length > 0
              ? `${totalQuantity} item(s) in your cart`
              : "Your cart is empty"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-6">
              You have no products in your cart yet
            </p>
            <button
              onClick={() => navigate("/san-pham")}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              {/* Header with select all */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      cartItems.length > 0 &&
                      selectedItems.length === cartItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-gray-700 font-medium">
                    Select All ({cartItems.length})
                  </span>
                </label>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove All
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => toggleItemSelection(item._id)}
                      className="mt-2 w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <CartItem
                        item={item}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onRemove={handleRemove}
                        onQuantityChange={handleQuantityChange}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <CartSummary
                total={total}
                count={totalQuantity}
                cart={cartItems}
                selectedItems={selectedItems}
              />
              {toast && (
                <Toast
                  type={toast.type}
                  title={toast.title}
                  message={toast.message}
                  onClose={() => setToast(null)}
                />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );

}