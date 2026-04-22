function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function TopProducts({ products = [], loading = false }) {

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Top-selling products</h2>
        </div>
        <div className="p-12 text-center text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Top-selling products</h2>
      </div>

      {products.length === 0 ? (
        <div className="p-12 text-center text-gray-400">No sales data available</div>
      ) : (
        <div className="p-6 space-y-4">
          {products.map((product, index) => (
            <div key={product._id || index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shrink-0">
                {index + 1}
              </div>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product._id}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  onError={(e) => { e.target.src = '/placeholder.png' }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{product.name || 'Product name'}</h3>
                <p className="text-sm text-gray-500">{product.soldAmount || 0} sold</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-gray-900">{formatCurrency(product.revenue || 0)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
