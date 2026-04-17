import { Link } from "react-router-dom";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from "@ant-design/icons";

export default function CategoryTable({
  categories,
  canManage = false,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-5xl mb-4 text-orange-500">
          <FolderOpenOutlined />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có danh mục nào
        </h3>
        <p className="text-gray-600">Thêm danh mục đầu tiên để bắt đầu</p>
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
                Tên danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục cha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số lượng sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr
                key={category._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 shrink-0 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FolderOutlined className="text-orange-600 text-lg" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 block">
                        {category.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {category.parentCategory ? category.parentCategory.name : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 bg-gray-100 inline-block px-3 py-1 rounded-full">
                    {category.productCount || 0} sản phẩm
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {canManage ? (
                    <button
                      onClick={() =>
                        onToggleStatus(category._id, category.isActive)
                      }
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${category.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                    >
                      {category.isActive ? "Hoạt động" : "Tạm ngưng"}
                    </button>
                  ) : (
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${category.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {category.isActive ? "Hoạt động" : "Tạm ngưng"}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/quan-tri/danh-muc/${category._id}`}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Xem chi tiết"
                    >
                      <EyeOutlined />
                    </Link>
                    {canManage && (
                      <>
                        <button
                          onClick={() => onEdit(category)}
                          className="text-orange-600 hover:text-orange-900 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => onDelete(category)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Xóa"
                        >
                          <DeleteOutlined />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
