import { useState, useEffect } from 'react';
import { stockApi, productApi } from '../../services/api';

/**
 * UpdateStockModal - Modal for updating product stock in warehouses
 * 
 * Features:
 * - Fetches product details from productApi.getById (name, SKU, images)
 * - Fetches stock levels from stockApi.getStockLevels (per-warehouse breakdown)
 * - Calculates total/available stock from stock levels (accurate real-time data)
 * - Fetches all warehouses from stockApi.getWarehouses (for first-time stock entry)
 * - If product exists in warehouses: shows those warehouses with current stock
 * - If product not in any warehouse: shows all warehouses for initial stock entry
 * - Allows adding stock (IN) or removing stock (OUT)
 * - OUT is disabled when product not in any warehouse
 * - Validates OUT quantity doesn't exceed available stock
 * - Backend fully supports both IN and OUT operations with proper validation
 */
export default function UpdateStockModal({ isOpen, onClose, productId, onSuccess }) {
  const [formData, setFormData] = useState({
    warehouseId: '',
    type: 'IN', // IN or OUT
    quantity: '',
    reason: ''
  });
  const [product, setProduct] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [selectedWarehouseStock, setSelectedWarehouseStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      fetchData();
      // Reset form when modal opens
      setFormData({
        warehouseId: '',
        type: 'IN',
        quantity: '',
        reason: ''
      });
      setSelectedWarehouseStock(null);
      setError('');
    }
  }, [isOpen, productId]);

  const fetchData = async () => {
    try {
      // Fetch all data in parallel
      const [productResponse, stockLevelsResponse, warehousesResponse] = await Promise.all([
        productApi.getById(productId),
        stockApi.getStockLevels({ productId }),
        stockApi.getWarehouses()
      ]);
      
      const stockLevels = stockLevelsResponse?.stockLevels || [];
      setStockLevels(stockLevels);
      setAllWarehouses(warehousesResponse?.warehouses || []);

      // Auto-select first available warehouse
      const validStocks = stockLevels.filter(sl => sl.warehouseId && sl.warehouseId._id);
      if (validStocks.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: validStocks[0].warehouseId._id }));
        setSelectedWarehouseStock(validStocks[0]);
      } else if (warehousesResponse?.warehouses?.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: warehousesResponse.warehouses[0]._id }));
      }
      
      // Calculate totals from stock levels
      const total = stockLevels.reduce((sum, level) => sum + (level.quantity || 0), 0);
      const available = stockLevels.reduce((sum, level) => sum + (level.availableQuantity || 0), 0);
      
      setProduct({
        total,
        available,
        productInfo: productResponse?.product
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải thông tin tồn kho');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // When warehouse changes, update selected warehouse stock info
    if (name === 'warehouseId') {
      const stockLevel = stockLevels.find(s => s.warehouseId?._id === value);
      setSelectedWarehouseStock(stockLevel || null);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ (phải lớn hơn 0)');
      return;
    }
    
    // Validate OUT quantity doesn't exceed available stock
    if (formData.type === 'OUT') {
      const availableStock = selectedWarehouseStock?.availableQuantity || 0;
      if (Number(formData.quantity) > availableStock) {
        setError(`Số lượng xuất không được vượt quá số khả dụng (${availableStock})`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      // Send positive quantity, backend will handle IN/OUT based on type
      await stockApi.createEntry({
        productId,
        warehouseId: formData.warehouseId,
        quantity: Number(formData.quantity),
        type: formData.type,
        reason: formData.reason || (formData.type === 'IN' ? 'Nhập thêm hàng' : 'Xuất hàng')
      });

      // Success
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      setError(error.message || 'Có lỗi xảy ra khi cập nhật tồn kho');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get product info from state
  const productInfo = product?.productInfo || stockLevels[0]?.productId;
  const totalStock = product?.total || 0;
  const availableStock = product?.available || 0;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Cập nhật tồn kho</h2>
              <p className="text-orange-100 text-sm">Nhập thêm hoặc xuất hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-lg transition-all flex items-center justify-center text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Info */}
            {productInfo && (
              <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {productInfo.images?.[0] && (
                    <img 
                      src={productInfo.images[0]?.url || productInfo.images[0]} 
                      alt={productInfo.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{productInfo.name}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      <span className="font-medium">SKU:</span> {productInfo.sku}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-100">
                        <span className="text-gray-600">Tổng tồn:</span>
                        <span className="font-bold text-orange-600 text-base">{totalStock}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-green-100">
                        <span className="text-gray-600">Khả dụng:</span>
                        <span className="font-bold text-green-600 text-base">{availableStock}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Warehouse - Hiển thị cố định */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="text-lg">🏢</span>
                <span>Kho hàng</span>
              </label>
              <div className="w-full border-2 border-amber-300 rounded-xl py-3 px-4 bg-amber-50 flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <span className="text-amber-800 font-bold text-base">
                    {stockLevels[0]?.warehouseId?.name || allWarehouses[0]?.name || 'Chưa có kho'}
                  </span>
                  {(stockLevels[0]?.warehouseId?.code || allWarehouses[0]?.code) && (
                    <span className="ml-2 text-sm text-amber-600">
                      ({stockLevels[0]?.warehouseId?.code || allWarehouses[0]?.code})
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{stockLevels[0]?.warehouseId?.name || allWarehouses[0]?.name ? 'Kho mặc định — không thể thay đổi' : 'Chưa có kho'}</p>
              {selectedWarehouseStock && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span className="text-sm font-medium text-gray-700">Tồn kho hiện tại</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">{selectedWarehouseStock.quantity}</span>
                    </div>
                    <div className="h-px bg-blue-200"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="text-sm font-medium text-gray-700">Số lượng khả dụng</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">{selectedWarehouseStock.availableQuantity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Type: IN or OUT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="text-lg">🔄</span>
                <span>Loại thao tác</span>
                <span className="text-red-500">*</span>
              </label>
              {(() => {
                const validStockLevels = stockLevels.filter(sl => sl.warehouseId && sl.warehouseId._id);
                const canOut = validStockLevels.length > 0;
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex flex-col items-center gap-2 px-4 py-4 border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                        formData.type === 'IN' 
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-100' 
                          : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value="IN"
                          checked={formData.type === 'IN'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-3xl">⬆️</span>
                        <span className={`font-bold ${formData.type === 'IN' ? 'text-green-700' : 'text-gray-700'}`}>
                          Nhập thêm
                        </span>
                        {formData.type === 'IN' && (
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                      <label className={`relative flex flex-col items-center gap-2 px-4 py-4 border-2 rounded-xl transition-all shadow-sm ${
                        !canOut 
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                          : formData.type === 'OUT' 
                            ? 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 cursor-pointer shadow-red-100' 
                            : 'border-gray-300 bg-white hover:border-red-300 hover:shadow-md cursor-pointer'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value="OUT"
                          checked={formData.type === 'OUT'}
                          onChange={handleChange}
                          disabled={!canOut}
                          className="sr-only"
                        />
                        <span className="text-3xl">⬇️</span>
                        <span className={`font-bold ${
                          !canOut ? 'text-gray-400' : formData.type === 'OUT' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Xuất giảm
                        </span>
                        {formData.type === 'OUT' && canOut && (
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                    {!canOut && (
                      <div className="mt-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">
                          Chỉ có thể xuất kho khi sản phẩm đã có trong kho
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="text-lg">🔢</span>
                <span>Số lượng {formData.type === 'IN' ? 'nhập thêm' : 'xuất'}</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max={formData.type === 'OUT' ? selectedWarehouseStock?.availableQuantity : undefined}
                  required
                  placeholder="Nhập số lượng..."
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:border-gray-400 text-gray-900 font-medium"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <div className={`mt-2 p-3 rounded-xl flex items-center gap-2 ${
                formData.type === 'IN' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <span className="text-lg">{formData.type === 'IN' ? '💡' : '🚨'}</span>
                <p className="text-sm font-medium text-gray-700">
                  {formData.type === 'IN' 
                    ? 'Nhập số lượng muốn thêm vào kho' 
                    : `Xuất tối đa: ${selectedWarehouseStock?.availableQuantity || 0} sản phẩm`
                  }
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="text-lg">📝</span>
                <span>Lý do</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                placeholder="Nhập lý do điều chỉnh (tùy chọn)..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all shadow-sm hover:border-gray-400 text-gray-900"
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || !formData.quantity || formData.quantity <= 0}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {formData.type === 'IN' ? (
                      <>
                        <span className="text-lg">⬆️</span>
                        <span>Cập nhật</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">⬇️</span>
                        <span>Cập nhật</span>
                      </>
                    )}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
