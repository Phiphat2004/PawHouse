import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryApi } from '../../services/api'

const categoryIcons = [
  '🐕', '🐈', '🐇', '🐹', '📦', '🧤', '🎖️', '🎾'
]

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    categoryApi.getAll()
      .then((res) => {
        const list = res.categories || res || []
        // Chỉ lấy các danh mục gốc (không có parentCategory)
        const rootCategories = list.filter(c => !c.parentCategory)
        setCategories(rootCategories.slice(0, 6))
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gray-400">Đang tải danh mục...</div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Danh Mục Sản Phẩm</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Khám phá đa dạng sản phẩm chất lượng cao dành cho thú cưng của bạn
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <button
              key={category._id || category.id}
              onClick={() => navigate(`/san-pham?category=${category.slug || category._id || category.id}`)}
              className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <span className="text-4xl block mb-3 group-hover:scale-125 transition-transform duration-300">
                {category.icon || categoryIcons[index % categoryIcons.length]}
              </span>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{category.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

