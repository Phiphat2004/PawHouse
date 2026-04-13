//Lê Nhựt Hào
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../layout/Toast";

export default function CartSummary({ total, count, cart = [], selectedItems = [] }) {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  //  Calculate selected total
  const selectedTotal = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    const itemsToSum =
      selectedItems.length > 0
        ? cart.filter((item) => selectedItems.includes(item._id))
        : cart;
    return itemsToSum.reduce(
      (sum, item) => sum + (item.product_id?.price || 0) * item.quantity,
      0
    );
  }, [cart, selectedItems]);

  //  NAVIGATE to checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0 && cart.length === 0) {
      setToast({
        type: "error",
        title: "Giỏ hàng trống",
        message: "Vui lòng chọn ít nhất một sản phẩm để thanh toán",
      });
      return;
    }

    navigate("/checkout", {
      state: {
        total: selectedTotal,
        selectedItemIds: selectedItems.length > 0 ? selectedItems : cart.map(i => i._id),
      },
    });
  };

  return (
    <div className="p-6 bg-[#fdfaf6] border border-gray-200 rounded shadow-sm">
      <h2 className="text-lg font-light mb-4 text-gray-700 tracking-wide uppercase">
        Tóm tắt đơn hàng
      </h2>

      {/* Subtotal */}
      <div className="flex justify-between text-sm py-2 border-b border-gray-200">
        <span className="text-gray-600">
          {selectedItems.length > 0
            ? `${selectedItems.length} sản phẩm đã chọn`
            : `${count} sản phẩm`}
        </span>
        <span className="text-gray-700">
          {selectedTotal.toLocaleString("vi-VN")}đ
        </span>
      </div>

      {/* Final total */}
      <div className="flex justify-between font-medium py-3 mt-2 bg-[#f3eee7] px-2 rounded">
        <span>Tổng cộng</span>
        <span>{selectedTotal.toLocaleString("vi-VN")}đ</span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={selectedItems.length === 0 && cart.length === 0}
        className="mt-6 w-full bg-black text-white py-3 text-sm uppercase tracking-wider hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Thanh toán
      </button>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
