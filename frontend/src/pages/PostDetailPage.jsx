import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { postApi } from "../services/api";
import { isAdminUser, isStaffUser } from "../utils/role";

export default function PostDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [canViewUnpublished, setCanViewUnpublished] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("pawhouse_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      setCanViewUnpublished(isAdminUser(user) || isStaffUser(user));
    } catch {
      setCanViewUnpublished(false);
    }

    loadPost();
    loadRelatedPosts();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const progress = (scrollTop / trackLength) * 100;
      
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép link bài viết!');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post?.title || '')}`, '_blank');
    setShowShareMenu(false);
  };

  const renderMarkdown = (content) => {
    if (!content) return null;
    
    return content.split('\n').map((line, i) => {
      // Headings
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-3xl font-bold mt-10 mb-5 text-gray-900">{line.substring(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-4xl font-bold mt-12 mb-6 text-gray-900">{line.substring(2)}</h1>;
      }
      
      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-6 mb-2 text-gray-800 leading-relaxed list-disc">{line.substring(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-6 mb-2 text-gray-800 leading-relaxed list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      
      // Bold and italic
      let processedLine = line;
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      processedLine = processedLine.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
      processedLine = processedLine.replace(/`(.+?)`/g, '<code class="px-2 py-1 bg-gray-100 text-orange-600 rounded font-mono text-sm">$1</code>');
      
      return <p key={i} className="mb-4 text-gray-800 leading-[1.9] text-[17px]" dangerouslySetInnerHTML={{ __html: processedLine || '<br/>' }} />;
    });
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await postApi.getBySlug(slug);

      setPost(data.post);
    } catch (err) {
      setError(err.message || "Không thể tải bài viết");
      console.error("Error loading post:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPosts = async () => {
    try {
      const data = await postApi.getPublic();
      const publishedPosts = (data.posts || data || [])
        .filter((p) => p.status === "published" && p.slug !== slug)
        .slice(0, 3);
      setRelatedPosts(publishedPosts);
    } catch (err) {
      console.error("Error loading related posts:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              to="/cong-dong"
              className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              ← Quay lại cộng đồng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-['Inter',sans-serif] bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-screen">
      <Header />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Breadcrumb Bar - Sticky */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 mt-16 sticky top-16 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
              <span>🏠</span>
              <span>Trang chủ</span>
            </Link>
            <span className="text-gray-400">›</span>
            <Link to="/cong-dong" className="hover:text-orange-500 transition-colors">
              Cộng đồng
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium truncate max-w-xs md:max-w-md">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Article Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 8 columns */}
          <article className="lg:col-span-8" ref={contentRef}>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* Article Header with Cover Image */}
              {post.coverImageUrl && (
                <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 lg:p-10">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                        📖 Bài viết
                      </span>
                      {post.tagIds && post.tagIds[0] && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                          #{post.tagIds[0].name}
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-2xl leading-tight">
                      {post.title}
                    </h1>
                  </div>
                </div>
              )}

              {/* Article Body */}
              <div className="p-6 sm:p-8 lg:p-12">
                {/* Title if no cover image */}
                {!post.coverImageUrl && (
                  <div className="mb-8">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                        📖 Bài viết
                      </span>
                      {post.tagIds && post.tagIds[0] && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          #{post.tagIds[0].name}
                        </span>
                      )}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                      {post.title}
                    </h1>
                  </div>
                )}

                {/* Author Card */}
                <div className="mb-8 pb-8 border-b border-gray-100">
                  {post.status !== "published" && canViewUnpublished && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                      Bài viết này đang ở trạng thái <strong>{post.status}</strong> và chưa hiển thị công khai cho khách hàng.
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-orange-100">
                          {post.authorId?.profile?.fullName?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {post.authorId?.profile?.fullName || "Admin"}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>5 phút đọc</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Share Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-semibold transition-all duration-200"
                      >
                        <span>🔗</span>
                        <span>Chia sẻ</span>
                      </button>
                      {showShareMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 animate-fade-in">
                          <button
                            onClick={shareToFacebook}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-colors text-left"
                          >
                            <span className="text-xl">📘</span>
                            <span className="font-medium text-gray-700">Chia sẻ lên Facebook</span>
                          </button>
                          <button
                            onClick={shareToTwitter}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 rounded-xl transition-colors text-left"
                          >
                            <span className="text-xl">🐦</span>
                            <span className="font-medium text-gray-700">Chia sẻ lên Twitter</span>
                          </button>
                          <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                            <span className="text-xl">📋</span>
                            <span className="font-medium text-gray-700">Sao chép link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Excerpt with modern styling */}
                {post.excerpt && (
                  <div className="relative mb-10">
                    <div className="p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0">💡</span>
                        <div>
                          <p className="text-sm font-bold text-orange-700 uppercase tracking-wide mb-2">Tóm tắt</p>
                          <p className="text-lg text-gray-800 leading-relaxed font-medium">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content with enhanced markdown rendering */}
                <div className="prose prose-lg max-w-none mb-12">
                  <div className="text-gray-800 leading-relaxed">
                    {renderMarkdown(post.content)}
                  </div>
                </div>

                {/* Tags with modern design */}
                {post.tagIds && post.tagIds.length > 0 && (
                  <div className="mb-10 pb-10 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🏷️</span>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Từ khóa
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tagIds.map((tag) => (
                        <span
                          key={tag._id}
                          className="group px-4 py-2 bg-white hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-400 text-gray-700 hover:text-orange-700 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 py-8 bg-gradient-to-r from-gray-50 to-white rounded-2xl">
                  <button className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-600 rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                    <span className="group-hover:scale-125 transition-transform text-xl">👍</span>
                    <span>Thích bài viết</span>
                  </button>
                  <button className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-400 text-gray-700 hover:text-green-600 rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                    <span className="group-hover:scale-125 transition-transform text-xl">💬</span>
                    <span>Bình luận</span>
                  </button>
                  <button className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-400 text-gray-700 hover:text-purple-600 rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                    <span className="group-hover:scale-125 transition-transform text-xl">🔖</span>
                    <span>Lưu bài</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📚</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Bài viết liên quan
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost._id}
                      to={`/cong-dong/${relatedPost.slug}`}
                      className="group block"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <article className="bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                        {relatedPost.coverImageUrl ? (
                          <div className="h-48 overflow-hidden bg-gray-100">
                            <img
                              src={relatedPost.coverImageUrl}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="h-48 w-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center"><span class="text-6xl">🐾</span></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-6xl group-hover:scale-125 transition-transform duration-300">🐾</span>
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors mb-3 text-base leading-tight">
                            {relatedPost.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>📅</span>
                            <span>
                              {formatDate(
                                relatedPost.publishedAt || relatedPost.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Author Info Card - Sticky */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-28">
              <div className="text-center mb-6">
                <div className="inline-block relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl ring-4 ring-orange-100">
                    {post.authorId?.profile?.fullName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {post.authorId?.profile?.fullName || "Admin"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {post.authorId?.email || "admin@pawhouse.vn"}
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-6">
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-lg">24</div>
                    <div className="text-xs">Bài viết</div>
                  </div>
                  <div className="w-px h-10 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-lg">1.2K</div>
                    <div className="text-xs">Người theo dõi</div>
                  </div>
                </div>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  + Theo dõi
                </button>
              </div>
            </div>

            {/* Back to Community Button */}
            <Link
              to="/cong-dong"
              className="group flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-2xl font-bold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="group-hover:-translate-x-1 transition-transform text-xl">←</span>
              <span>Quay lại cộng đồng</span>
            </Link>
          </aside>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16"></div>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}} />
    </div>
  );
}
