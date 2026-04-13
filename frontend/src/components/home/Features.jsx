const features = [
  {
    icon: '🚚',
    title: 'Giao Hàng Toàn Quốc',
    description: 'Giao hàng đến tận tay, đóng gói an toàn'
  },
  {
    icon: '✅',
    title: 'Chính Hãng 100%',
    description: 'Cam kết hàng chính hãng, nguồn gốc rõ ràng'
  },
  {
    icon: '💚',
    title: 'An Toàn Cho Thú Cưng',
    description: 'Sản phẩm được kiểm định an toàn cho thú cưng'
  },
  {
    icon: '🔄',
    title: 'Đổi Trả Dễ Dàng',
    description: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi'
  }
]

export default function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">{feature.icon}</span>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
