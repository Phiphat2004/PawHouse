// frontend/src/components/home/CartItem.jsx
//Lê Nhựt Hào

export default function CartItem({item, onIncrease, onDecrease, onRemove }) {
    const itemId = item?._id || item?.id;
    
    return (
        <div className="grid grid-cols-5 items-center py-4 border-b">
            <div className="col-span-2 flex items-center gap-4">
                <img
                    src={item?.product_id?.images?.[0]?.url || item?.product_id?.image || "/placeholder.png"}
                    alt={item?.product_id?.name || "Product"}
                    className="w-20 h-20 object-cover rounded-md border"
                />
                <div>
                    <p className="font-medium text-gray-800">{item?.product_id?.name || "Sản phẩm"}</p>
                    <p className="text-sm text-gray-500">
                        {item?.product_id?.price?.toLocaleString("vi-VN") || 0}₫ / Sản phẩm
                    </p>
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
