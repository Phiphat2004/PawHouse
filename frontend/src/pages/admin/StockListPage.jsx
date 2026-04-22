import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { stockApi } from '../../services/api';
import { AdminLayout, UpdateStockModal } from '../../components/admin';

export default function StockListPage() {
  const [stockLevels, setStockLevels] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [filters, setFilters] = useState({
    warehouseId: '',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Keep stock list synchronized with order status updates from other admin/user tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'stockMovementUpdated') {
        fetchStockLevels();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [filters.warehouseId]);

  // Poll to reduce delay in case no storage event is fired on this tab
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStockLevels();
    }, 5000);
    return () => clearInterval(interval);
  }, [filters.warehouseId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStockLevels(), fetchWarehouses()]);
    setLoading(false);
  };

  const fetchStockLevels = async () => {
    try {
      const params = {};
      if (filters.warehouseId) {
        params.warehouseId = filters.warehouseId;
      }

      const response = await stockApi.getStockLevels(params);
      setStockLevels(response?.stockLevels || []);
      setError('');
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      setError('Failed to load stock list: ' + error.message);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await stockApi.getWarehouses();
      setWarehouses(response?.warehouses || response?.data?.warehouses || []);
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
    fetchStockLevels();
  };

  const handleResetFilter = () => {
    setFilters({
      warehouseId: '',
      search: ''
    });
    setTimeout(() => {
      fetchStockLevels();
    }, 100);
  };

  const handleOpenUpdateModal = (productId) => {
    setSelectedProductId(productId);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchStockLevels();
    toast.success('✅ Stock updated successfully!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  // Filter stock levels by search term
  const filteredStockLevels = stockLevels.filter(item => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    const productName = item.productId?.name?.toLowerCase() || '';
    const sku = item.productId?.sku?.toLowerCase() || '';
    return productName.includes(searchLower) || sku.includes(searchLower);
  });

  // Group stock levels by product (aggregate same products from different warehouses)
  const groupedStockLevels = filteredStockLevels.reduce((acc, item) => {
    const productId = item.productId?._id;
    if (!productId) return acc;

    if (!acc[productId]) {
      // First occurrence of this product
      acc[productId] = {
        _id: item._id,
        productId: item.productId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        warehouses: [],
        lastRestockedAt: item.lastRestockedAt
      };
    }

    // Aggregate quantities
    acc[productId].quantity += item.quantity || 0;
    acc[productId].reservedQuantity += item.reservedQuantity || 0;
    acc[productId].availableQuantity += item.availableQuantity || 0;
    
    // Collect warehouse info
    if (item.warehouseId) {
      acc[productId].warehouses.push({
        _id: item.warehouseId._id,
        name: item.warehouseId.name,
        code: item.warehouseId.code,
        quantity: item.quantity || 0,
        availableQuantity: item.availableQuantity || 0
      });
    }

    // Keep the latest restock date
    if (item.lastRestockedAt && (!acc[productId].lastRestockedAt || new Date(item.lastRestockedAt) > new Date(acc[productId].lastRestockedAt))) {
      acc[productId].lastRestockedAt = item.lastRestockedAt;
    }

    return acc;
  }, {});

  // Convert grouped object to array using backend stock fields as source of truth.
  const aggregatedStockLevels = Object.values(groupedStockLevels);

  // Calculate total stock
  const totalStock = aggregatedStockLevels.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Count unique products
  const uniqueProducts = aggregatedStockLevels.length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Stock List</h1>
                <p className="mt-2 text-gray-600">Manage and track product inventory</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/quan-tri/lich-su-xuat-nhap-kho"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-orange-600 rounded-xl shadow-lg text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 transition-all transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                History
              </Link>
              <Link
                to="/quan-tri/nhap-kho"
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Import Stock
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-md px-6 py-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse
              </label>
              <select
                name="warehouseId"
                value={filters.warehouseId}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-gray-50 hover:bg-white"
              >
                <option value="">All warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search product
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Product name or SKU..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-gray-50 hover:bg-white"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={handleApplyFilter}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilter}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold border border-gray-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Total Products</p>
                <p className="text-3xl font-black text-orange-700">{uniqueProducts}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Stock</p>
                <p className="text-3xl font-black text-green-700">{totalStock}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Update
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aggregatedStockLevels.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                      No stock data
                    </td>
                  </tr>
                ) : (
                  aggregatedStockLevels.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-3 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {item.productId?.images?.[0]?.url ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={item.productId.images[0].url}
                                alt={item.productId?.name || 'Product'}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[160px] lg:max-w-[220px]">
                              {item.productId?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.productId?.sku || 'N/A'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 min-w-[140px]">
                          {item.warehouses.length === 1 ? (
                            // Single warehouse
                            <div>
                              <div className="font-medium">{item.warehouses[0].name}</div>
                              <div className="text-gray-500 text-xs">{item.warehouses[0].code}</div>
                            </div>
                          ) : (
                            // Multiple warehouses - show count and tooltip
                            <div className="group relative">
                              <div className="font-medium text-blue-600 cursor-help flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {item.warehouses.length} warehouses
                              </div>
                              {/* Tooltip */}
                              <div className="absolute hidden group-hover:block z-10 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-0 top-8">
                                <div className="font-semibold mb-2">Stock distribution:</div>
                                {item.warehouses.map((wh, idx) => (
                                  <div key={idx} className="flex justify-between py-1 border-b border-gray-700 last:border-0">
                                    <span>{wh.name} ({wh.code})</span>
                                    <span className="font-medium">{wh.quantity} units</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reservedQuantity || 0}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.availableQuantity || 0}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.lastRestockedAt
                          ? new Date(item.lastRestockedAt).toLocaleDateString('vi-VN')
                          : 'Not imported'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenUpdateModal(item.productId?._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-sm text-xs font-medium"
                            title="Update stock"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update
                          </button>
                          <Link
                            to={`/quan-tri/ton-kho/${item.productId?._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm text-xs font-medium"
                            title="View details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Stock Modal */}
        <UpdateStockModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          productId={selectedProductId}
          onSuccess={handleUpdateSuccess}
        />
      </div>
    </AdminLayout>
  );
}
