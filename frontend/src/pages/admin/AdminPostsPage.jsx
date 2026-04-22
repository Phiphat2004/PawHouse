import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/admin";
import PostTable from "../../components/admin/PostTable";
import PostForm from "../../components/admin/PostForm";
import { postApi } from "../../services/api";
import { isAdminUser } from "../../utils/role";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("pawhouse_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      setCanApprove(isAdminUser(user));
    } catch {
      setCanApprove(false);
    }

    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getAll();
      setPosts(data.posts || data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await postApi.delete(postId);
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingPost) {
        const updated = await postApi.update(editingPost._id, formData);
        setPosts(
          posts.map((p) =>
            p._id === editingPost._id ? updated.post || updated : p
          )
        );
      } else {
        const created = await postApi.create(formData);
        setPosts([created.post || created, ...posts]);
      }
      setShowForm(false);
      setEditingPost(null);
    } catch (err) {
      console.error("Form submit error:", err);
      throw err;
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    if (!canApprove) {
      alert("Only admins can approve/publish posts.");
      return;
    }

    try {
      const updated = await postApi.toggleStatus(postId);
      setPosts(
        posts.map((p) => (p._id === postId ? updated.post || updated : p))
      );
    } catch (err) {
      alert("Failed to change status: " + err.message);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchSearch =
      !searchTerm ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = !filterStatus || post.status === filterStatus;

    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (showForm) {
    return (
      <AdminLayout>
        <PostForm
          post={editingPost}
          canApprove={canApprove}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Community Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage posts and community content
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
          >
            + Create New Post
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {posts.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Published</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {posts.filter((p) => p.status === "published").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Draft</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  {posts.filter((p) => p.status === "draft").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Hidden</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {posts.filter((p) => p.status === "hidden").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <PostTable
          posts={filteredPosts}
          canApprove={canApprove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </AdminLayout>
  );
}
