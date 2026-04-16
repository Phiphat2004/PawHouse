import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { stockApi } from '../../services/api';
import { UpdateStockModal, DeleteStockRecordModal } from '../../components/admin';

export default function StockDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const loadStockDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockApi.getProductStock(productId);
      setStockData(response.stock);
      setError('');
    } catch (error) {
      console.error('Error loading stock detail:', error);
      setError('Không thể tải thông tin tồn kho');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadMovements = useCallback(async (page = 1) => {
    try {
      setMovementsLoading(true);
      const response = await stockApi.getMovements({
        productId,
        page,
        limit: pagination.limit
      });
      setMovements(response.movements || []);
      setPagination((prev) => response.pagination || prev);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setMovementsLoading(false);
    }
  }, [pagination.limit, productId]);

  useEffect(() => {
    loadStockDetail();
    loadMovements(1);
  }, [loadMovements, loadStockDetail]);

  const handlePageChange = (newPage) => {
    loadMovements(newPage);
  };

  const handleUpdateSuccess = () => {
    // Reload data after successful update
    loadStockDetail();
    loadMovements(pagination.page);
  };

  const handleDeleteClick = (movement) => {
    setSelectedMovement(movement);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Reload data after successful delete
    loadStockDetail();
    loadMovements(pagination.page);
  };

  const getMovementTypeLabel = (type) => {
    const types = {
      'IN': 'Nhập kho',
      'OUT': 'Đang giao hàng',
      'ADJUSTMENT': 'Điều chỉnh',
      'TRANSFER': 'Chuyển kho',
      'RETURN': 'Trả hàng',
      'RESERVE': 'Chờ xác nhận',
      'RELEASE': 'Đã hủy',
      'FULFILL': 'Đã giao hàng'
    };
    return types[type] || type;
  };

  const getMovementTypeColor = (type) => {
    const colors = {
      'IN': 'bg-green-100 text-green-800',
      'OUT': 'bg-red-100 text-red-800',
      'ADJUSTMENT': 'bg-yellow-100 text-yellow-800',
      'TRANSFER': 'bg-blue-100 text-blue-800',
      'RETURN': 'bg-purple-100 text-purple-800',
      'RESERVE': 'bg-orange-100 text-orange-800',
      'RELEASE': 'bg-teal-100 text-teal-800',
      'FULFILL': 'bg-emerald-100 text-emerald-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getMovementReason = (movement) => {
    if (movement?.statusLabel) return movement.statusLabel;
    const map = {
      RESERVE: 'Chờ xác nhận',
      OUT: 'Đang giao hàng',
      FULFILL: 'Đã giao hàng',
      RELEASE: 'Đã hủy',
      IN: 'Nhập kho',
      RETURN: 'Hoàn trả',
      ADJUSTMENT: 'Điều chỉnh',
      TRANSFER: 'Chuyển kho'
    };
    return map[movement?.type] || movement?.reason || '-';
  };

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

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Không tìm thấy thông tin tồn kho'}
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/quan-tri/ton-kho')}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/quan-tri/ton-kho"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chi tiết tồn kho</h1>
                <p className="mt-2 text-gray-600">Thông tin chi tiết về tồn kho sản phẩm</p>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Cập nhật tồn kho
              </button>
            </div>
          </div>
        </div>

        {/* Stock Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng tồn kho</p>
                <p className="text-3xl font-bold text-gray-900">{stockData.total || 0}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Khả dụng</p>
                <p className="text-3xl font-bold text-green-600">{stockData.available || 0}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Đã đặt trước</p>
                <p className="text-3xl font-bold text-yellow-600">{stockData.reserved || 0}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stock by Warehouse */}
        {stockData.byWarehouse && stockData.byWarehouse.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tồn kho theo kho hàng</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kho hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khả dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đã đặt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockData.byWarehouse.map((warehouse, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="font-medium text-gray-900">
                          {warehouse.warehouseId?.name || 'Chưa có kho'}
                        </div>
                        {warehouse.warehouseId?.code && (
                          <div className="text-xs text-gray-500">({warehouse.warehouseId.code})</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {warehouse.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {warehouse.available}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {warehouse.reserved}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Movements History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử xuất nhập kho</h2>
          
          {movementsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có lịch sử xuất nhập kho
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày giờ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại giao dịch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kho hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lý do
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movements.map((movement) => (
                      <tr key={movement._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(movement.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                            {getMovementTypeLabel(movement.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.warehouseId?.name || 'Chưa có kho'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {getMovementReason(movement)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(movement)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-lg transition-all inline-flex items-center gap-1"
                            title="Xóa bản ghi"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Xóa</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong tổng số <span className="font-medium">{pagination.total}</span> giao dịch
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Update Stock Modal */}
        <UpdateStockModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          productId={productId}
          onSuccess={handleUpdateSuccess}
        />

        {/* Delete Stock Record Modal */}
        <DeleteStockRecordModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedMovement(null);
          }}
          movement={selectedMovement}
          onSuccess={handleDeleteSuccess}
        />
      </div>
    </div>
  );
}
