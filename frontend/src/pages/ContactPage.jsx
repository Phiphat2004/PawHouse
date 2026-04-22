import { useState } from "react";
import { Header, Footer } from "../components/layout";

const contactInfo = [
  {
    icon: "📍",
    title: "Address",
    lines: ["Hoa Lac Hi-Tech Park,", "Thach That, Hanoi, Vietnam"],
  },
  {
    icon: "📞",
    title: "Phone",
    lines: ["0909 123 456", "Mon – Sat, 8:00 – 17:30"],
  },
  {
    icon: "✉️",
    title: "Email",
    lines: ["support@pawhouse.vn", "Response within 24 hours"],
  },
  {
    icon: "🕐",
    title: "Working Hours",
    lines: ["Mon – Fri: 8:00 – 17:30", "Sat: 8:00 – 12:00"],
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-5xl mb-4">💬</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Contact <span className="text-orange-500">Us</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Have a question or need support? The PawHouse team is always ready to help.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((c) => (
              <div
                key={c.title}
                className="bg-orange-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-4xl">{c.icon}</span>
                <h3 className="font-bold text-gray-900 mt-3 mb-2">{c.title}</h3>
                {c.lines.map((line) => (
                  <p key={line} className="text-gray-600 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send a Message</h2>
              <p className="text-gray-500 text-sm mb-6">
                Fill in the information below and we will get back to you within 24 hours.
              </p>

              {submitted ? (
                <div className="text-center py-10">
                  <span className="text-5xl">✅</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">
                    Sent successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We will respond as soon as possible.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="example@email.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white"
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      <option value="order">Hỏi về đơn hàng</option>
                      <option value="product">Hỏi về sản phẩm</option>
                      <option value="return">Đổi trả hàng</option>
                      <option value="payment">Thanh toán</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "📨 Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ + Social */}
            <div className="space-y-6">
              {/* FAQ */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    {
                      q: "Thời gian giao hàng bao lâu?",
                      a: "Thông thường 2–5 ngày làm việc tùy khu vực. Nội thành HN/HCM có thể nhận trong ngày.",
                    },
                    {
                      q: "Tôi có thể đổi/trả hàng không?",
                      a: "Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu sản phẩm bị lỗi hoặc không đúng mô tả.",
                    },
                    {
                      q: "PawHouse có bảo đảm chất lượng sản phẩm không?",
                      a: "Tất cả sản phẩm đều được kiểm định kỹ lưỡng, có xuất xứ rõ ràng và an toàn cho thú cưng.",
                    },
                    {
                      q: "Tôi quên mật khẩu thì phải làm gì?",
                      a: "Vào trang đăng nhập → chọn \"Quên mật khẩu\" → nhập email để nhận link đặt lại.",
                    },
                  ].map((item) => (
                    <div key={item.q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-semibold text-gray-900 mb-1">❓ {item.q}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-orange-500 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-2">Connect With Us</h3>
                <p className="text-orange-100 text-sm mb-5">
                  Follow PawHouse for the latest news and deals!
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Facebook", icon: "📘", href: "#" },
                    { label: "Instagram", icon: "📷", href: "#" },
                    { label: "TikTok", icon: "🎵", href: "#" },
                    { label: "Zalo", icon: "💬", href: "#" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      {s.icon} {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
