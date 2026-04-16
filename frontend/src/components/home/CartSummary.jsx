
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  GiftOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
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
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_20px_60px_rgba(132,101,81,0.12)] sticky top-28">
      <div className="bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <ShoppingCartOutlined className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">Thanh toán nhanh</p>
            <h2 className="text-2xl font-extrabold leading-tight">Tóm tắt đơn hàng</h2>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5 rounded-2xl bg-linear-to-br from-gray-50 to-orange-50 px-4 py-4 ring-1 ring-orange-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <RocketOutlined className="text-orange-500" />
              Tạm tính
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {selectedTotal.toLocaleString("vi-VN")}₫
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <GiftOutlined className="text-orange-500" />
              Tổng số sản phẩm
            </span>
            <span className="font-semibold text-gray-900">{selectedItems.length > 0 ? selectedItems.length : count}</span>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 via-orange-50 to-white px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Tổng cộng</span>
            <span className="text-3xl font-extrabold tracking-tight text-orange-600">
              {finalTotal.toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={selectedItems.length === 0 && cart.length === 0}
          className="group w-full rounded-full bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 py-4 font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.28)] transition hover:shadow-[0_20px_40px_rgba(249,115,22,0.36)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
        >
          <span>Tiến hành thanh toán</span>
          <ArrowRightOutlined className="transition-transform group-hover:translate-x-1" />
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          Hoàn tất đơn hàng trong vài bước, không mất thời gian.
        </p>
      </div>

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
