import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import UserPostCard from "../components/user/UserPostCard";
import UserPostForm from "../components/user/UserPostForm";
import { postApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";
import { isAdminUser, isStaffUser } from "../utils/role";

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Only admin/staff can manage own posts
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER);

    if (!token || !userData) {
      alert("Vui lòng đăng nhập để tiếp tục");
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const canManagePosts = isAdminUser(parsedUser) || isStaffUser(parsedUser);
      if (!canManagePosts) {
        alert("Bạn không có quyền quản lý bài viết. Tài khoản customer chỉ có thể xem cộng đồng.");
        navigate("/cong-dong");
        return;
      }
    } catch {
      alert("Không thể xác định quyền tài khoản. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    loadPosts();
  }, [navigate]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filter !== "all" ? { status: filter } : {};
      const data = await postApi.getMyPosts(params);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải bài viết");
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    try {
      await postApi.deleteMyPost(postId);
      loadPosts();
      alert("Xóa bài viết thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa bài viết");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPost(null);
    loadPosts();
    alert(
      editingPost
        ? "Cập nhật bài viết thành công! Bài viết sẽ cần được admin duyệt lại."
        : "Tạo bài viết thành công! Bài viết sẽ được admin xem xét."
    );
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const filteredPosts = posts;

  const stats = {
    total: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    published: posts.filter((p) => p.status === "published").length,
    hidden: posts.filter((p) => p.status === "hidden").length,
  };

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        {!showForm ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                📝 Bài viết của tôi
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý các bài viết bạn đã tạo và theo dõi trạng thái duyệt
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Tổng bài viết
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats.total}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-3xl">📄</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Chờ duyệt
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {stats.draft}
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <span className="text-3xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Đã duyệt
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {stats.published}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-3xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Bị ẩn</p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">
                      {stats.hidden}
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-full p-3">
                    <span className="text-3xl">🔒</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Create Button */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "Tất cả" },
                    { value: "draft", label: "Chờ duyệt" },
                    { value: "published", label: "Đã duyệt" },
                    { value: "hidden", label: "Bị ẩn" },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setFilter(tab.value);
                        loadPosts();
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        filter === tab.value
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/cong-dong/tao-bai-viet")}
                  className="whitespace-nowrap bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Tạo bài viết mới</span>
                </button>
              </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                <p className="font-semibold">❌ Lỗi</p>
                <p className="mt-1">{error}</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Chưa có bài viết
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa tạo bài viết nào. Hãy chia sẻ câu chuyện của bạn với
                  cộng đồng!
                </p>
                <button
                  onClick={() => navigate("/cong-dong/tao-bai-viet")}
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition inline-flex items-center gap-2"
                >
                  <span>✍️</span>
                  <span>Tạo bài viết đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <UserPostCard
                    key={post._id}
                    post={post}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {editingPost ? "✏️ Chỉnh sửa bài viết" : "✍️ Tạo bài viết mới"}
              </h2>
              {editingPost && (
                <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                  ⚠️ <strong>Lưu ý:</strong> Khi bạn chỉnh sửa bài viết, trạng
                  thái sẽ chuyển về "Chờ duyệt" và cần được admin phê duyệt lại.
                </p>
              )}
            </div>
            <UserPostForm
              post={editingPost}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
