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
          No categories yet
        </h3>
        <p className="text-gray-600">Add your first category to get started</p>
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
                Category name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
                    {category.productCount || 0} products
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/quan-tri/danh-muc/${category._id}`}
                        className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-all"
                        title="View details"
                      >
                        <EyeOutlined className="text-lg" />
                      </Link>
                      {canManage && (
                        <>
                          <button
                            onClick={() => onEdit(category)}
                            className="p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-all"
                            title="Edit"
                          >
                            <EditOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => onDelete(category)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
