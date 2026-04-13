import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { postApi } from '../../services/api'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function Testimonials() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postApi.getPublic()
      .then((res) => {
        const list = (res.posts || res || []).filter((p) => p.status === 'published')
        setPosts(list.slice(0, 3))
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && posts.length === 0) return null

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Cộng Đồng PawHouse</h2>
          <p className="text-gray-600">Chia sẻ kinh nghiệm và câu chuyện về thú cưng của bạn</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Đang tải bài viết...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/cong-dong/${post.slug || post._id}`}
                className="group block p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl hover:shadow-xl transition-all duration-300"
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>✍️ {post.author?.name || post.authorName || 'Ẩn danh'}</span>
                  {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/cong-dong"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300"
          >
            Xem tất cả bài viết →
          </Link>
        </div>
      </div>
    </section>
  )
}

