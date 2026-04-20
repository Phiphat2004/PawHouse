import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { EditOutlined, RightOutlined } from '@ant-design/icons'
import { postApi } from '../../services/api'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function getAuthorLabel(post) {
  return post.authorId?.profile?.fullName || post.author?.name || post.authorName || 'Admin PawHouse'
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
                className="group block overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {post.coverImageUrl || post.coverImage ? (
                  <div className="overflow-hidden">
                    <img
                      src={post.coverImageUrl || post.coverImage?.url || post.coverImage}
                      alt={post.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.parentElement
                        if (fallback) {
                          fallback.innerHTML = '<div class="h-44 bg-linear-to-br from-orange-50 to-amber-100 border-b border-orange-100"></div>'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-linear-to-br from-orange-50 to-amber-100 border-b border-orange-100" />
                )}

                <div className="p-6">
                  <h3 className="font-bold text-2xl leading-8 text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 text-base line-clamp-2 min-h-[3.25rem] mb-5">
                    {post.excerpt || 'Bài viết chia sẻ kinh nghiệm chăm sóc thú cưng từ cộng đồng PawHouse.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <span className="inline-flex items-center gap-2 font-medium text-gray-700">
                      <EditOutlined /> {getAuthorLabel(post)}
                    </span>
                    {(post.publishedAt || post.createdAt) && (
                      <span className="text-gray-400">{formatDate(post.publishedAt || post.createdAt)}</span>
                    )}
                  </div>
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
            Xem tất cả bài viết <RightOutlined />
          </Link>
        </div>
      </div>
    </section>
  )
}

