import { Header, Footer } from "../components/layout";

const teamMembers = [
  { name: "Hồ Phi Phát", role: "CE181877", emoji: "👨🏻‍💻" },
  { name: "Lâm Huy Hoàng", role: "CE181003", emoji: "👨🏾‍💻" },
  { name: "Nguyễn Văn Nghĩa", role: "CE180831", emoji: "🐶" },
  { name: "Bùi Anh Tuấn", role: "CE161158", emoji: "👨‍💻" },
];

const stats = [
  { value: "500+", label: "Sản phẩm thú cưng" },
  { value: "2.000+", label: "Khách hàng tin dùng" },
  { value: "98%", label: "Hài lòng dịch vụ" },
  { value: "24/7", label: "Hỗ trợ khách hàng" },
];

const values = [
  {
    icon: "❤️",
    title: "Tình yêu thương thú cưng",
    desc: "Chúng tôi hiểu rằng thú cưng là thành viên thực sự của gia đình bạn. Mọi sản phẩm đều được lựa chọn kỹ lưỡng vì sự an toàn và hạnh phúc của chúng.",
  },
  {
    icon: "⭐",
    title: "Chất lượng đảm bảo",
    desc: "Tất cả sản phẩm tại PawHouse đều qua kiểm định chất lượng nghiêm ngặt, nguồn gốc rõ ràng, an toàn cho thú cưng của bạn.",
  },
  {
    icon: "🤝",
    title: "Cộng đồng gắn kết",
    desc: "PawHouse không chỉ là một cửa hàng — chúng tôi xây dựng cộng đồng những người yêu thú cưng, nơi chia sẻ kinh nghiệm và niềm vui.",
  },
  {
    icon: "🚀",
    title: "Đổi mới liên tục",
    desc: "Chúng tôi không ngừng cập nhật và cải tiến để mang đến trải nghiệm mua sắm tốt nhất, tiện lợi nhất cho bạn và thú cưng.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-5xl mb-4">🐾</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Về <span className="text-orange-500">PawHouse</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi là nền tảng thương mại điện tử dành riêng cho thú cưng —
            nơi bạn tìm thấy mọi thứ cần thiết để chăm sóc người bạn bốn chân của mình.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold mb-1">{s.value}</div>
                <div className="text-orange-100 text-sm sm:text-base">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Câu chuyện của chúng tôi
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                PawHouse ra đời từ tình yêu thuần túy dành cho thú cưng. Chúng tôi nhận thấy
                rằng việc tìm kiếm sản phẩm chất lượng, uy tín cho thú cưng tại Việt Nam
                còn nhiều khó khăn — từ đó, ý tưởng về một nền tảng mua sắm chuyên biệt
                được hình thành.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Với đội ngũ trẻ nhiệt huyết, am hiểu về công nghệ và yêu thú cưng, chúng tôi
                xây dựng PawHouse không chỉ là một cửa hàng trực tuyến mà còn là cộng đồng —
                nơi các chủ nuôi thú cưng có thể chia sẻ, học hỏi và kết nối.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Sứ mệnh của chúng tôi: <strong className="text-orange-500">Mang đến cuộc sống tốt nhất cho mọi thú cưng tại Việt Nam.</strong>
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 rounded-2xl p-8 text-center">
                <span className="text-6xl">🐶🐱🐰</span>
                <p className="mt-4 text-gray-700 font-medium">
                  Từ chó, mèo đến thỏ — chúng tôi lo cho tất cả!
                </p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-6 flex items-start gap-4">
                <span className="text-3xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-900">Giao hàng toàn quốc</p>
                  <p className="text-gray-600 text-sm">Đóng gói cẩn thận, giao hàng nhanh chóng đến tận tay bạn.</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 flex items-start gap-4">
                <span className="text-3xl">🔒</span>
                <div>
                  <p className="font-semibold text-gray-900">Thanh toán an toàn</p>
                  <p className="text-gray-600 text-sm">Hỗ trợ nhiều phương thức thanh toán, bảo mật tuyệt đối.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Giá trị cốt lõi</h2>
            <p className="text-gray-600">Những điều chúng tôi tin tưởng và cam kết</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-4xl">{v.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Đội ngũ của chúng tôi</h2>
            <p className="text-gray-600">Những con người tạo nên PawHouse</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((m) => (
              <div
                key={m.name}
                className="text-center bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {m.emoji}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{m.name}</h3>
                <p className="text-orange-500 text-sm">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
