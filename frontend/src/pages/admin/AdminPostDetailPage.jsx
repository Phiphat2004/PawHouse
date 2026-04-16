import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin";
import { postApi } from "../../services/api";

const statusStyles = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  hidden: "bg-gray-100 text-gray-700",
};

const statusLabels = {
  draft: "Chờ duyệt",
  published: "Đã xuất bản",
  hidden: "Ẩn",
};

export default function AdminPostDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPostDetail() {
      try {
        setLoading(true);
        const data = await postApi.getBySlug(slug);
        setPost(data?.post || null);
      } catch (err) {
        setError(err.message || "Không thể tải chi tiết bài viết");
      } finally {
        setLoading(false);
      }
    }

    loadPostDetail();
  }, [slug]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !post) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error || "Không tìm thấy bài viết"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/quan-tri/cong-dong"
              className="text-sm text-gray-600 hover:text-orange-600"
            >
              ← Quay lại quản lý cộng đồng
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{post.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>
                Tác giả: {post.authorId?.profile?.fullName || post.authorId?.email || "N/A"}
              </span>
              <span>•</span>
              <span>
                Tạo lúc: {new Date(post.createdAt).toLocaleString("vi-VN")}
              </span>
              <span>
                <span
                  className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[post.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabels[post.status] || post.status}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/quan-tri/cong-dong")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>

        {post.coverImageUrl && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="max-h-125 w-full rounded-lg object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {post.excerpt && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-gray-700">
            {post.excerpt}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Nội dung bài viết</h2>
          <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
            {post.content}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
