// frontend/src/components/home/CartItem.jsx
//Lê Nhựt Hào
import { CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { useState, useEffect } from "react";

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
        let val = parseInt(localQuantity);
        if (isNaN(val) || val < 1) val = 1;
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

    return (
        <div className="flex bg-[#f9f9f9] rounded-2xl p-4 relative w-full border border-gray-100">
            {/* Trash Icon */}
            <button
                onClick={() => onRemove(itemId)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition"
                title="Xóa sản phẩm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            {/* Product Image */}
            <div className="w-[100px] h-[100px] bg-white rounded-xl overflow-hidden flex-shrink-0 mr-5 border border-gray-100 flex items-center justify-center">
                <img
                    src={item?.product_id?.images?.[0]?.url || item?.product_id?.image || "/placeholder.png"}
                    alt={item?.product_id?.name || "Product"}
                    className="w-full h-full object-contain p-1 mix-blend-multiply" 
                />
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onDecrease(itemId)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 transition inline-flex items-center"
                >
                    <MinusOutlined />
                </button>
                <span className="w-12 text-center font-medium">{item?.quantity || 1}</span>
                <button
                    onClick={() => onIncrease(itemId)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 transition inline-flex items-center"
                >
                    <PlusOutlined />
                </button>
            </div>
            {/* Product Details */}
            <div className="flex-1 flex flex-col justify-between pt-1">
                <div className="pr-8">
                    <h3 className="font-bold text-gray-900 text-[17px] leading-tight mb-1">
                        {item?.product_id?.name || "Sản phẩm"}
                    </h3>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                    <div className="font-bold text-[22px] text-gray-900">
                        {item?.product_id?.price?.toLocaleString("vi-VN") || 0}₫
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center bg-white rounded-full px-2 py-1 shadow-sm border border-gray-100">
                        <button
                            onClick={() => onDecrease(itemId)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={localQuantity}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                            className="w-10 text-center font-medium text-[15px] bg-transparent outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={() => onIncrease(itemId)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onDecrease(itemId)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 transition"
                >
                    -
                </button>
                <span className="w-12 text-center font-medium">{item?.quantity || 1}</span>
                <button
                    onClick={() => onIncrease(itemId)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 transition"
                >
                    +
                </button>
            </div>

            <div className="text-gray-700 font-medium">
                {((item?.product_id?.price || 0) * (item?.quantity || 1)).toLocaleString("vi-VN")}₫
            </div>

            <button
                onClick={() => onRemove(itemId)}
                className="text-gray-400 hover:text-red-500 text-xl transition"
                title="Xóa sản phẩm"
            >
                ×
            </button>
        </div>
    );
}
