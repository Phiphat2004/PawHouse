import { Link } from "react-router-dom";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  InboxOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PostTable({
  posts,
  canApprove = false,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
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
        className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatDateParts = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-5xl text-orange-500 mb-4">
          <FileTextOutlined />
        </div>
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-50">
          <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bài viết
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tác giả
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Trạng thái
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày xuất bản
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => {
            const published = formatDateParts(post.publishedAt);
            const created = formatDateParts(post.createdAt);
            const displayTitle = (post.title || "").trim();
            const displayExcerpt = (post.excerpt || "").trim();
            return (
              <TableRow key={post._id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="px-6 py-4">
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
                        {displayTitle || "(Không có tiêu đề)"}
                      </p>
                      {displayExcerpt && (
                        <p className="text-sm text-gray-500">
                          {truncateText(displayExcerpt, 80)}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {post.authorId?.profile?.fullName || "N/A"}
                    </p>
                    <p className="text-gray-500">{post.authorId?.email}</p>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 min-w-[130px]">{getStatusBadge(post.status)}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="space-y-1.5 min-w-[180px]">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Ngày xuất bản
                      </p>
                      {published ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-900">
                          <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap">
                            <ClockCircleOutlined className="text-slate-500 text-[11px]" />
                            {published.time}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-700 whitespace-nowrap">
                            <CalendarOutlined className="text-slate-500 text-[11px]" />
                            {published.date}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700 font-medium">Chưa xuất bản</p>
                      )}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Ngày tạo
                      </p>
                      {created ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-900">
                          <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap">
                            <ClockCircleOutlined className="text-slate-500 text-[11px]" />
                            {created.time}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-700 whitespace-nowrap">
                            <CalendarOutlined className="text-slate-500 text-[11px]" />
                            {created.date}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-600">-</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/quan-tri/cong-dong/${post.slug}`}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <EyeOutlined />
                    </Link>
                    {canApprove && (
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
                        {post.status === "published" ? <InboxOutlined /> : <UploadOutlined />}
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(post)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      onClick={() => onDelete(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
