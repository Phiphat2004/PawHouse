import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stockApi, productApi } from '../../services/api';

/**
 * StockMovementHistoryPage - Comprehensive history of all stock movements
 * 
 * Features:
 * - Display all stock movements with pagination
 * - Filter by product, warehouse, type, date range
 * - Show movement details: type, quantity, reason, created by, timestamp
 * - Visual indicators for IN/OUT movements
 * - Real-time data with professional UI
 */
export default function StockMovementHistoryPage() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    productId: '',
    warehouseId: '',
    type: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for new movements every 5 seconds to reflect recent reservations/fulfillments
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMovements();
    }, 5000);
    return () => clearInterval(interval);
  }, [filters, pagination.page, pagination.limit]);

  // Listen to cross-tab storage events so other tabs (checkout) can notify us to refresh immediately
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'stockMovementUpdated') {
        // Always re-fetch authoritative data from API (order-synced)
        fetchMovements();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchMovements();
  }, [pagination.page, pagination.limit]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMovements(),
      fetchProducts(),
      fetchWarehouses()
    ]);
    setLoading(false);
  };

  const fetchMovements = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (filters.productId) params.productId = filters.productId;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      if (filters.type) params.type = filters.type;

      const response = await stockApi.getMovements(params);

      setMovements(response?.movements || []);
      
      if (response?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages
        }));
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching movements:', error);
      setError('Không thể tải lịch sử xuất nhập kho');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await stockApi.getWarehouses();
      setWarehouses(response?.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchMovements();
  };

  const handleResetFilter = () => {
    setFilters({
      productId: '',
      warehouseId: '',
      type: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => {
      fetchMovements();
    }, 100);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteMovement = async (movementId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này? Lưu ý: Chỉ xóa lịch sử tồn kho, không ảnh hưởng đến tồn kho hiện tại.')) {
      return;
    }

    try {
      await stockApi.deleteMovement(movementId);
      fetchMovements();
    } catch (error) {
      console.error('Error deleting movement:', error);
      alert('Không thể xóa bản ghi: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const getMovementTypeStyle = (type) => {
    switch (type) {
      case 'IN':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '⬆️', label: 'Nhập kho' };
      case 'OUT':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '⬇️', label: 'Xuất kho' };
      case 'ADJUSTMENT':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄', label: 'Chuyển kho' };
      case 'TRANSFER':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄', label: 'Chuyển kho' };
      case 'RETURN':
        return { bg: 'bg-purple-100', text: 'text-purple-800', icon: '↩️', label: 'Hoàn trả kho' };
      case 'RESERVE':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🔒', label: 'Tạm giữ đơn' };
      case 'RELEASE':
        return { bg: 'bg-teal-100', text: 'text-teal-800', icon: '🔓', label: 'Đã hủy' };
      case 'FULFILL':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✅', label: 'Đã giao hàng' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📦', label: type };
    }
  };

  const getShortReason = (movement) => {
    if (movement?.statusLabel) return movement.statusLabel;

    const map = {
      RESERVE: 'Chờ xác nhận',
      OUT: movement?.referenceType === 'ORDER' ? 'Đang giao hàng' : 'Xuất kho',
      FULFILL: 'Đã giao hàng',
      RELEASE: 'Đã hủy',
      IN: 'Nhập kho',
      RETURN: 'Hoàn trả',
      ADJUSTMENT: 'Chuyển kho',
      TRANSFER: 'Chuyển kho',
    };
    return map[movement?.type] || movement?.reason || '-';
  };

  // Filter movements by search term (client-side for current page)
  const filteredMovements = movements.filter(movement => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    const productName = movement.productId?.name?.toLowerCase() || '';
    const sku = movement.productId?.sku?.toLowerCase() || '';
    const warehouse = movement.warehouseId?.name?.toLowerCase() || '';
    return productName.includes(searchLower) || 
           sku.includes(searchLower) || 
           warehouse.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/quan-tri"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 shadow-lg flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 whitespace-nowrap">Lịch sử xuất nhập kho</h1>
                <p className="mt-1 text-sm lg:text-base text-gray-600 whitespace-nowrap">Theo dõi tất cả các thay đổi xuất nhập kho</p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                to="/quan-tri/ton-kho"
                className="inline-flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 border-2 border-orange-600 rounded-xl shadow-lg text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 transition-all whitespace-nowrap"
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Tồn kho
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="whitespace-nowrap">Bộ lọc</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                Sản phẩm
              </label>
              <select
                name="productId"
                value={filters.productId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                Kho hàng
              </label>
              <select
                name="warehouseId"
                value={filters.warehouseId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="">Tất cả kho</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                Trạng thái
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="IN">⬆️ Nhập kho</option>
                <option value="OUT">⬇️ Xuất kho</option>
                <option value="RESERVE">🔒 Tạm giữ đơn</option>
                
                <option value="FULFILL">✅ Đã giao hàng</option>              
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                Tìm kiếm
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Tên, SKU, kho..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleApplyFilter}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Áp dụng
              </span>
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Đặt lại
              </span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 whitespace-nowrap">Tổng bản ghi</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">⬆️</span>
                </div>
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 whitespace-nowrap">Nhập kho</p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">
                  {movements.filter(m => m.type === 'IN').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">⬇️</span>
                </div>
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 whitespace-nowrap">Xuất kho</p>
                <p className="text-xl lg:text-2xl font-bold text-red-600">
                  {movements.filter(m => m.type === 'OUT').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 whitespace-nowrap">Trang</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {pagination.page}/{pagination.pages}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Loại
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Sản phẩm
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Kho
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Số lượng
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Người tạo
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Thời gian
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-500 font-medium">Không có lịch sử tồn kho</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((movement) => {
                    const typeStyle = getMovementTypeStyle(movement.type);
                    return (
                      <tr key={movement._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs lg:text-sm font-semibold ${typeStyle.bg} ${typeStyle.text} whitespace-nowrap`}>
                            <span className="text-sm lg:text-base">{typeStyle.icon}</span>
                            <span className="hidden lg:inline">{typeStyle.label}</span>
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10">
                              {movement.productId?.images?.[0]?.url ? (
                                <img
                                  className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg object-cover border-2 border-gray-200"
                                  src={movement.productId.images[0].url}
                                  alt={movement.productId?.name || 'Product'}
                                />
                              ) : (
                                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <span className="text-base lg:text-lg">📦</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-2 lg:ml-3 min-w-0">
                              <div className="text-xs lg:text-sm font-medium text-gray-900 truncate max-w-[150px] lg:max-w-xs">
                                {movement.productId?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 whitespace-nowrap">
                                SKU: {movement.productId?.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs lg:text-sm font-medium text-gray-900">
                            {movement.warehouseId?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movement.warehouseId?.code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const isAdd = ['IN', 'RELEASE', 'RETURN'].includes(movement.type);
                            const isSub = ['OUT', 'RESERVE', 'FULFILL'].includes(movement.type);
                            return (
                              <span className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-lg text-xs lg:text-sm font-bold ${
                                isAdd ? 'bg-green-100 text-green-800' :
                                isSub ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {isAdd ? '+' : isSub ? '-' : ''}{movement.quantity}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-xs lg:text-sm text-gray-900 max-w-[150px] lg:max-w-xs truncate" title={getShortReason(movement)}>
                            {getShortReason(movement)}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs lg:text-sm text-gray-900 truncate max-w-[120px]" title={movement.createdBy?.email}>
                            {movement.createdBy?.email || 'System'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs lg:text-sm text-gray-900">
                            {new Date(movement.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(movement.createdAt).toLocaleTimeString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteMovement(movement._id)}
                            className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs lg:text-sm"
                            title="Xóa bản ghi"
                          >
                            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden lg:inline">Xóa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
              <div className="flex-1 flex justify-center sm:justify-start">
                <p className="text-sm text-gray-700 whitespace-nowrap">
                  Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số{' '}
                  <span className="font-medium">{pagination.total}</span> kết quả
                </p>
              </div>
              <div className="flex-shrink-0">
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Trang trước</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium whitespace-nowrap ${
                            pagination.page === i
                              ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } transition-colors`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Trang sau</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
