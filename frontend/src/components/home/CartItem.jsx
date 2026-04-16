// frontend/src/components/home/CartItem.jsx
//Lê Nhựt Hào
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { useEffect, useState } from "react";

export default function CartItem({ item, onIncrease, onDecrease, onRemove, onQuantityChange }) {
    const itemId = item?._id || item?.id;
    const [localQuantity, setLocalQuantity] = useState(item?.quantity || 1);

    useEffect(() => {
        setLocalQuantity(item?.quantity || 1);
    }, [item?.quantity]);

    const handleInputChange = (e) => {
        setLocalQuantity(e.target.value);
    };

    const handleInputBlur = () => {
        let val = parseInt(localQuantity, 10);
        if (Number.isNaN(val) || val < 1) val = 1;
        setLocalQuantity(val);
        if (val !== item?.quantity && onQuantityChange) {
            onQuantityChange(itemId, val);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    };

    const unitPrice = item?.product_id?.price || 0;
    const lineTotal = unitPrice * (item?.quantity || 1);

    return (
        <div className="flex items-center gap-4 bg-[#f9f9f9] rounded-2xl p-4 border border-gray-100">
            <div className="w-22 h-22 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                <img
                    src={item?.product_id?.images?.[0]?.url || item?.product_id?.image || "/placeholder.png"}
                    alt={item?.product_id?.name || "Product"}
                    className="w-full h-full object-contain p-1 mix-blend-multiply"
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                    {item?.product_id?.name || "Sản phẩm"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Đơn giá: {unitPrice.toLocaleString("vi-VN")}₫
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center bg-white rounded-full px-2 py-1 shadow-xs border border-gray-200">
                        <button
                            onClick={() => onDecrease(itemId)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition"
                        >
                            <MinusOutlined />
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={localQuantity}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                            className="w-12 text-center font-medium text-base bg-transparent outline-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={() => onIncrease(itemId)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition"
                        >
                            <PlusOutlined />
                        </button>
                    </div>

                    <p className="font-bold text-2xl text-gray-900">
                        {lineTotal.toLocaleString("vi-VN")}₫
                    </p>
                </div>
            </div>

            <button
                onClick={() => onRemove(itemId)}
                className="self-start text-red-500 hover:text-red-700 transition p-1"
                title="Xóa sản phẩm"
            >
                <DeleteOutlined className="text-lg" />
            </button>
        </div>
    );
}
