import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin';
import api from '../../services/api';

export default function CreateStockEntryPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    reason: ''
  });
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastEntry, setLastEntry] = useState(null);

  // Fetch warehouses and products on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    await Promise.all([fetchWarehouses(), fetchProducts()]);
    setLoadingData(false);
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/stock/warehouses');
      const list = response?.warehouses || response?.data?.warehouses || [];
      setWarehouses(list);
      // Tự động chọn kho đầu tiên (Kho Xuân Ngân)
      if (list.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: list[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      console.log('Products response:', response);
      setProducts(response?.products || response?.data?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/stock/entry', {
        productId: formData.productId,
        warehouseId: formData.warehouseId,
        quantity: parseInt(formData.quantity),
        reason: formData.reason
      });

      // Lấy thông tin chi tiết sản phẩm và kho đã chọn
      const selectedProduct = products.find(p => p._id === formData.productId);
      const selectedWarehouse = warehouses.find(w => w._id === formData.warehouseId);
      
      setLastEntry({
        product: selectedProduct,
        warehouse: selectedWarehouse,
        quantity: formData.quantity,
        reason: formData.reason,
        timestamp: new Date()
      });

      setSuccess('✅ Tạo phiếu nhập kho thành công!');
      console.log('Stock entry created:', response);
      
      // Reset form sau 2 giây và scroll lên top
      setTimeout(() => {
        setFormData({
          productId: '',
          warehouseId: warehouses[0]?._id || '',
          quantity: '',
          reason: ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2000);
      
    } catch (error) {
      console.error('Error creating stock entry:', error);
      setError(error.response?.data?.error || 'Không thể tạo phiếu nhập kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">📦 Tạo Phiếu Nhập Kho</h1>
              <p className="text-gray-600 mt-2">Quản lý tồn kho và nhập hàng mới</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-md px-6 py-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Success with Entry Details */}
        {success && lastEntry && (
          <div className="bg-white border-l-4 border-orange-500 rounded-xl shadow-2xl p-8 mb-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-full shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Phiếu Nhập Kho</h3>
                  <p className="text-sm text-gray-500">Mã phiếu: #{Date.now().toString().slice(-8)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                  ✓ Đã hoàn tất
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  {lastEntry.timestamp.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Thông tin sản phẩm */}
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Sản phẩm</h4>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">{lastEntry.product?.name}</p>
                {lastEntry.product?.sku && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="bg-white px-2 py-1 rounded border border-blue-200 font-mono">
                      {lastEntry.product.sku}
                    </span>
                  </div>
                )}
              </div>

              {/* Thông tin kho */}
              <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Kho nhập</h4>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">{lastEntry.warehouse?.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-white px-2 py-1 rounded border border-purple-200 font-mono">
                    {lastEntry.warehouse?.code}
                  </span>
                  {lastEntry.warehouse?.address?.city && (
                    <span className="text-gray-500">• {lastEntry.warehouse.address.city}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Số lượng và lý do */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Số lượng nhập
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-green-600">+{lastEntry.quantity}</p>
                  <span className="text-sm text-gray-500">đơn vị</span>
                </div>
              </div>

              {lastEntry.reason && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Lý do nhập
                  </p>
                  <p className="text-gray-800 italic leading-relaxed">"{lastEntry.reason}"</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSuccess('');
                  setLastEntry(null);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tạo phiếu mới
              </button>
              <Link
                to={`/san-pham/${lastEntry.product?._id}`}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem chi tiết sản phẩm
              </Link>
              <Link
                to="/quan-tri/lich-su-xuat-nhap-kho"
                className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white px-6 py-3 rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Xem lịch sử
              </Link>
            </div>
          </div>
        )}

        {!loadingData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 font-medium mb-1">Tổng sản phẩm</div>
                    <div className="text-3xl font-black text-orange-700">{products.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-full shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium mb-1">Trạng thái</div>
                    <div className="text-lg font-bold text-green-700">
                      {products.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sẵn sàng
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Chưa có sản phẩm
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-full shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning if no products */}
            {products.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-yellow-800 mb-3">⚠️ Cần chuẩn bị dữ liệu</h3>
                <div>
                  <p className="text-yellow-700 mb-2">• Chưa có sản phẩm nào.</p>
                  <Link to="/quan-tri/san-pham" className="text-blue-600 hover:underline">
                    → Tạo sản phẩm mới
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
              <div className="space-y-6">
                {/* Select Product */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-bold mb-3 text-lg">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Sản Phẩm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-xl py-4 px-5 pr-10 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-gray-50 hover:bg-white text-base appearance-none cursor-pointer"
                      required
                      disabled={products.length === 0}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {products.length === 0 ? '⚠️ Không có sản phẩm' : `${products.length} sản phẩm khả dụng`}
                    </p>
                  </div>
                </div>

                {/* Kho - Hiển thị cố định (Kho CanTho) */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-bold mb-3 text-lg">
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Kho
                  </label>
                  <div className="w-full border-2 border-amber-300 rounded-xl py-4 px-5 bg-amber-50 flex items-center gap-3">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <span className="text-amber-800 font-bold text-base">{warehouses[0]?.name || 'Kho Xuân Ngân'}</span>
                      {warehouses[0]?.code && (
                        <span className="ml-2 text-sm text-amber-600">({warehouses[0].code})</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Kho mặc định — không thể thay đổi</p>
                </div>

                {/* Quantity */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-bold mb-3 text-lg">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Số Lượng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      className="w-full border-2 border-gray-300 rounded-xl py-4 px-5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-gray-50 hover:bg-white text-base"
                      placeholder="Nhập số lượng (VD: 100)"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Nhập số lượng tối thiểu là 1</p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-bold mb-3 text-lg">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Lý Do
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-300 rounded-xl py-4 px-5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-gray-50 hover:bg-white resize-none text-base"
                    placeholder="VD: Nhập hàng từ nhà cung cấp ABC..."
                    rows="4"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Ghi rõ nguồn gốc hoặc lý do nhập kho (không bắt buộc)</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || products.length === 0}
                    className={`w-full text-white font-bold py-5 px-8 rounded-xl transition-all text-lg flex items-center justify-center gap-3 ${
                      loading || products.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tạo Phiếu Nhập Kho
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Help Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-orange-800 text-lg">Hướng dẫn</h3>
                </div>
                <ul className="text-sm text-orange-700 space-y-2 ml-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Chọn sản phẩm cần nhập</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Kho mặc định: Kho Xuân Ngân</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Nhập số lượng (≥ 1)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Ghi rõ lý do để dễ tra cứu</span>
                  </li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="font-bold text-amber-800 text-lg">Lưu ý</h3>
                </div>
                <ul className="text-sm text-amber-700 space-y-2 ml-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Kiểm tra thông tin trước khi submit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Số lượng sẽ được cộng vào tồn kho</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Lịch sử được lưu trong hệ thống</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
