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

  const discount = 0; // if you have discount logic put it here
  const deliveryFee = 0; // if you have delivery fee
  const finalTotal = selectedTotal - discount + deliveryFee;

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
        total: finalTotal,
        selectedItemIds: selectedItems.length > 0 ? selectedItems : cart.map(i => i._id),
      },
    });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-[20px] shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-gray-900">
        Tóm tắt đơn hàng
      </h2>

      <div className="space-y-4 mb-6">
        {/* Subtotal */}

        <div className="flex justify-between items-center text-gray-500">
          <span className="text-[15px]">Tạm tính</span>
          <span className="font-bold text-gray-900 text-[16px]">
            {selectedTotal.toLocaleString("vi-VN")}₫
          </span>
        </div>
        <div className="flex justify-between items-center text-gray-500 mb-2">
          <span className="text-[15px]">Tổng số sản phẩm</span>
          <span className="font-medium text-gray-900 text-[15px]">
            {selectedItems.length > 0 ? selectedItems.length : count}
          </span>
        </div>

        {/* Discount */}
        {/* {discount > 0 ? (
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-[15px]">Giảm giá (-20%)</span>
            <span className="font-bold text-red-500 text-[16px]">
              -{discount.toLocaleString("vi-VN")}₫
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-[15px]">Giảm giá (0%)</span>
            <span className="font-bold text-red-500 text-[16px]">
              -0₫
            </span>
          </div>
        )} */}

        {/* Delivery Fee
        <div className="flex justify-between items-center text-gray-500">
          <span className="text-[15px]">Phí giao hàng</span>
          <span className="font-bold text-gray-900 text-[16px]">
            {deliveryFee === 0 ? "Miễn phí" : `${deliveryFee.toLocaleString("vi-VN")}₫`}
          </span>
        </div> */}
      </div>

      <div className="pt-4 border-t border-gray-100 mb-6 flex justify-between items-center">
        <span className="text-gray-900 font-bold text-lg">Tổng cộng</span>
        <span className="text-gray-900 font-bold text-2xl">{finalTotal.toLocaleString("vi-VN")}₫</span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={selectedItems.length === 0 && cart.length === 0}
        className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Tiến hành thanh toán
        <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
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
