export default function PostTable({ posts, onEdit, onDelete, onToggleStatus }) {
  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Bản nháp",
      },
      published: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã xuất bản",
      },
      hidden: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Ẩn",
      },
    };

    const badge = badges[status] || badges.draft;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa xuất bản";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có bài viết nào
        </h3>
        <p className="text-gray-500">
          Nhấn nút "Tạo bài viết mới" để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bài viết
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tác giả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày xuất bản
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {post.coverImageUrl && (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500">
                          {truncateText(post.excerpt, 80)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Slug: {post.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {post.authorId?.profile?.fullName || "N/A"}
                    </p>
                    <p className="text-gray-500">{post.authorId?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {formatDate(post.publishedAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Tạo: {formatDate(post.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStatus(post._id, post.status)}
                      className={`p-2 rounded-lg transition-colors ${
                        post.status === "published"
                          ? "text-orange-600 hover:bg-orange-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={
                        post.status === "published"
                          ? "Chuyển sang bản nháp"
                          : "Xuất bản"
                      }
                    >
                      {post.status === "published" ? "📥" : "📤"}
                    </button>
                    <button
                      onClick={() => onEdit(post)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      🗑️
                    </button>
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
