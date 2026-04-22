import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { postApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";
import { isAdminUser, isStaffUser } from "../utils/role";

export default function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [canCreatePost, setCanCreatePost] = useState(false);

  useEffect(() => {
    loadPosts();

    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
      const user = rawUser ? JSON.parse(rawUser) : null;
      const canCreate = !!token && (isAdminUser(user) || isStaffUser(user));
      setCanCreatePost(canCreate);
    } catch {
      setCanCreatePost(false);
    }
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getPublic();
      // Filter only published posts
      const publishedPosts = (data.posts || data || []).filter(
        (post) => post.status === "published"
      );
      setPosts(publishedPosts);
    } catch (err) {
      setError(err.message);
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchSearch =
      !searchTerm ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-orange-500 to-amber-500 text-white pt-28 pb-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            🌐 PawHouse Community
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Discover stories, care tips, and useful knowledge about pets
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            {canCreatePost && (
              <button
                onClick={() => navigate("/cong-dong/tao-bai-viet")}
                className="whitespace-nowrap bg-orange-500 text-white px-6 py-4 rounded-full font-semibold hover:bg-orange-600 transition flex items-center gap-2"
              >
                <span>✍️</span>
                <span>Create Post</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Posts Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unexpected Error
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Posts Yet
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No matching posts found"
                : "Come back later!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <Link to={`/cong-dong/${post.slug}`}>
                  {post.coverImageUrl ? (
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="h-48 w-full bg-linear-to-br from-orange-200 to-amber-200 flex items-center justify-center"><span class="text-7xl">🐾</span></div>';
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="h-48 bg-linear-to-br from-orange-400 to-amber-400 flex items-center justify-center">
                      <span className="text-6xl">🐾</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      {post.authorId?.profile?.fullName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            ✍️ {post.authorId.profile.fullName}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {truncateText(post.excerpt)}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-orange-500 font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
                        Read More
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination - for future */}
        {filteredPosts.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Showing {filteredPosts.length} post(s)
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
