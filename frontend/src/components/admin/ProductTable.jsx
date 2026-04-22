import { Link } from "react-router-dom";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

export default function ProductTable({
  products,
  categories,
  canManage = false,
  onEdit,
  onDelete,
  onToggleStatus,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
}) {
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return "-";
    return categoryIds
      .map((id) => {
        const catId = typeof id === "string" ? id : id._id;
        const category = categories.find((c) => c._id === catId);
        return category?.name || "";
      })
      .filter(Boolean)
      .join(", ");
  };

  const formatPrice = (price) => {
    if (!price) return "0đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No products yet
        </h3>
        <p className="text-gray-600">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categories
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const imageUrl =
                product.images && product.images.length > 0
                  ? typeof product.images[0] === "string"
                    ? product.images[0]
                    : product.images[0]?.url
                  : null;

              return (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 shrink-0">
                        {imageUrl ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                            src={imageUrl}
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center"
                          style={{ display: imageUrl ? "none" : "flex" }}
                        >
                          <span className="text-gray-400 text-xl">📦</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 max-w-sm truncate" title={product.name}>
                          {product.name}
                        </div>
                        {product.brand && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {product.brand}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div
                      className="text-sm font-medium text-gray-900 max-w-[200px] truncate"
                      title={getCategoryNames(product.categoryIds)}
                    >
                      {getCategoryNames(product.categoryIds)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                            -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                          </span>
                        </div>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.sku ? (
                      <span className="text-sm text-gray-900 font-mono font-medium">
                        {product.sku}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManage ? (
                      <button
                        onClick={() =>
                          onToggleStatus(product._id, product.isActive)
                        }
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${product.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                      >
                        {product.isActive ? "Active" : "Paused"}
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {product.isActive ? "Active" : "Paused"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/quan-tri/san-pham/${product._id}`}
                        className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-all"
                        title="View details"
                      >
                        <EyeOutlined className="text-lg" />
                      </Link>
                      {canManage && (
                        <>
                          <button
                            onClick={() => onEdit(product)}
                            className="p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-all"
                            title="Edit"
                          >
                            <EditOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => onDelete(product)}
                            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                            title="Delete"
                          >
                            <DeleteOutlined className="text-lg" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {products.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            out of <span className="font-medium">{totalItems}</span> items
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
              >
                {'<'} Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    // Show first, last, current, and surrounding pages
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 &&
                        pageNum <= currentPage + 1);

                    // Show ellipsis when needed
                    const showEllipsisBefore =
                      pageNum === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter =
                      pageNum === currentPage + 2 &&
                      currentPage < totalPages - 2;

                    if (
                      !showPage &&
                      !showEllipsisBefore &&
                      !showEllipsisAfter
                    ) {
                      return null;
                    }

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span
                          key={`ellipsis-${pageNum}`}
                          className="px-3 py-2 text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`min-w-10 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                          ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>

              {/* Next button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
              >
                Next {'>'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
