import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import Pagination from "../components/layout/Pagination";
import { postApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";
import { isAdminUser, isStaffUser } from "../utils/role";

const POSTS_PER_PAGE = 9;

export default function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: POSTS_PER_PAGE,
    total: 0,
    pages: 1,
  });
  const [canCreatePost, setCanCreatePost] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const trimmedSearch = searchTerm.trim();
        const data = await postApi.getPublic({
          page: pagination.page,
          limit: POSTS_PER_PAGE,
          search: trimmedSearch || undefined,
        });

        const publishedPosts = (data.posts || data || []).filter(
          (post) => post.status === "published",
        );
        const total = Number(data.pagination?.total ?? publishedPosts.length);
        const limit = Number(data.pagination?.limit ?? POSTS_PER_PAGE);
        const pages = Math.max(Number(data.pagination?.pages ?? 1), 1);

        setPosts(publishedPosts);
        setPagination({
          page: Number(data.pagination?.page ?? pagination.page),
          limit,
          total,
          pages,
        });
      } catch (err) {
        setError(err.message);
        console.error("Error loading posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [searchTerm, pagination.page]);

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

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="font-['Inter',sans-serif] min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-12 mt-16 bg-linear-to-r from-orange-500 via-amber-500 to-yellow-400 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_35%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
           🌐 PawHouse Community
          </h1>
          <p className="text-base sm:text-lg text-white/90 max-w-3xl mx-auto leading-7">
            Discover real stories, care tips, and practical pet advice from the
            PawHouse community.
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 sm:p-6 shadow-[0_20px_60px_rgba(249,115,22,0.12)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search posts
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search by keyword, topic, or pet care advice..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-4 text-base text-gray-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
            {canCreatePost && (
              <button
                onClick={() => navigate("/cong-dong/tao-bai-viet")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-6 py-4 font-semibold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.01] hover:shadow-xl"
              >
                <span>✍️</span>
                <span>Create post</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Posts Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No matching posts found"
                : "Come back later for more community posts."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
              <article
                key={post._id}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <Link to={`/cong-dong/${post.slug}`}>
                  {post.coverImageUrl ? (
                    <div className="relative h-52 overflow-hidden bg-gray-100">
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
                    <div className="h-52 bg-linear-to-br from-orange-400 via-orange-300 to-amber-400 flex items-center justify-center">
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

                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 transition-colors group-hover:text-orange-500">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {truncateText(post.excerpt)}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="flex items-center gap-1 font-medium text-orange-500 transition-all group-hover:gap-2">
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
          </>
        )}

        {pagination.total > pagination.limit && (
          <div className="mt-10 rounded-3xl  px-5 py-6 ">
            <Pagination
              page={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => {
                if (page !== pagination.page) {
                  setPagination((prev) => ({ ...prev, page }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
