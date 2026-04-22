import { Header, Footer } from "../components/layout";

const teamMembers = [
  { name: "Hồ Phi Phát", role: "CE181877", emoji: "👨🏻‍💻" },
  { name: "Lâm Huy Hoàng", role: "CE181003", emoji: "👨🏾‍💻" },
  { name: "Nguyễn Văn Nghĩa", role: "CE180831", emoji: "👨🏽‍💻" },
  { name: "Bùi Anh Tuấn", role: "CE161158", emoji: "👨‍💻" },
];

const stats = [
  { value: "500+", label: "Pet products" },
  { value: "2,000+", label: "Trusted customers" },
  { value: "98%", label: "Service satisfaction" },
  { value: "24/7", label: "Customer support" },
];

const values = [
  {
    icon: "❤️",
    title: "Love for Pets",
    desc: "We understand that pets are true members of your family. Every product is carefully selected for their safety and happiness.",
  },
  {
    icon: "⭐",
    title: "Guaranteed Quality",
    desc: "All products at PawHouse go through strict quality checks, with clear origins and guaranteed safety for your pets.",
  },
  {
    icon: "🤝",
    title: "Connected Community",
    desc: "PawHouse is more than a store — we build a community of pet lovers where experiences and joy are shared.",
  },
  {
    icon: "🚀",
    title: "Continuous Innovation",
    desc: "We constantly update and improve to bring you the best and most convenient shopping experience for you and your pets.",
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
            About <span className="text-orange-500">PawHouse</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We are an e-commerce platform dedicated to pets —
            where you find everything you need to care for your four-legged friend.
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
                Our Story
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                PawHouse was born from a pure love of pets. We noticed that finding quality,
                reliable products for pets in Vietnam was still a challenge — and from that,
                the idea of a specialized shopping platform was formed.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                With a young, passionate team that understands technology and loves pets,
                we built PawHouse not just as an online store but also a community —
                where pet owners can share, learn, and connect.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our mission: <strong className="text-orange-500">To bring the best life to every pet in Vietnam.</strong>
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 rounded-2xl p-8 text-center">
                <span className="text-6xl">🐶🐱🐰</span>
                <p className="mt-4 text-gray-700 font-medium">
                  From dogs, cats to rabbits — we care for them all!
                </p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-6 flex items-start gap-4">
                <span className="text-3xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-900">Nationwide Delivery</p>
                  <p className="text-gray-600 text-sm">Carefully packed and delivered quickly right to your door.</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 flex items-start gap-4">
                <span className="text-3xl">🔒</span>
                <div>
                  <p className="font-semibold text-gray-900">Secure Payments</p>
                  <p className="text-gray-600 text-sm">Multiple payment methods supported with absolute security.</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Core Values</h2>
            <p className="text-gray-600">The things we believe in and are committed to</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Team</h2>
            <p className="text-gray-600">The people who make PawHouse possible</p>
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
