import { useState, useEffect } from "react";
import { postApi } from "../../services/api";

export default function UserPostForm({ post = null, onSuccess, onCancel, user }) {
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        coverImageUrl: post.coverImageUrl || "",
      });
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error("Vui lòng nhập tiêu đề");
      }
      if (!formData.content.trim()) {
        throw new Error("Vui lòng nhập nội dung");
      }

      if (post) {
        await postApi.updateMyPost(post._id, formData);
      } else {
        await postApi.create(formData);
      }

      onSuccess();
    } catch (err) {
      console.error("Error creating post:", err);
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra";
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (name === 'coverImageUrl') {
      setImageLoading(true);
      setImageError(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // create a local preview so user sees the image immediately
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setFormData(prev => ({ ...prev, coverImageUrl: objectUrl }));
    setImageLoading(true);
    setImageError(false);

    try {
      const data = await postApi.uploadImage(file);
      // replace local preview with remote url
      setFormData(prev => ({ ...prev, coverImageUrl: data.url }));
      // revoke local preview URL if present
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
    } catch (err) {
      console.error('Upload error', err);
      setImageError(true);
      alert('Tải ảnh lên thất bại');
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const renderMarkdownPreview = (text) => {
    if (!text) return <p className="text-gray-400 italic">Nội dung preview sẽ hiển thị ở đây...</p>;
    
    return text.split('\n').map((line, i) => {
      // Headings
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-3">{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(4)}</h3>;
      
      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-6 list-disc">{line.substring(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-6 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      
      // Bold and italic
      let processedLine = line;
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
      
      return <p key={i} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine || '<br/>' }} />;
    });
  };

  const titleLength = formData.title.length;
  const excerptLength = formData.excerpt.length;
  const contentLength = formData.content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md animate-shake">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">Có lỗi xảy ra</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900 mb-2">Quy trình phê duyệt bài viết</p>
            <p className="text-blue-800 text-sm leading-relaxed">
              Bài viết của bạn sẽ được lưu dưới dạng <span className="font-semibold">bản nháp</span> và cần được quản trị viên xem xét, phê duyệt trước khi xuất bản công khai trên cộng đồng.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form Inputs */}
        <div className="space-y-6">
          {/* Author Card */}
          {user && (
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-3">Tác giả</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user?.profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.profile?.fullName || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-xl">📌</span>
                <span>Tiêu đề bài viết</span>
                <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-medium ${
                titleLength > 100 ? 'text-red-500' : titleLength > 80 ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {titleLength}/100
              </span>
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề hấp dẫn cho bài viết của bạn..."
              maxLength={100}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              required
            />
          </div>

          {/* Excerpt Input */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-xl">✏️</span>
                <span>Mô tả ngắn</span>
              </label>
              <span className={`text-xs font-medium ${
                excerptLength > 200 ? 'text-red-500' : excerptLength > 160 ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {excerptLength}/200
              </span>
            </div>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Tóm tắt ngắn gọn về nội dung bài viết (hiển thị trong danh sách bài viết)..."
              rows="3"
              maxLength={200}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
            />
          </div>

          {/* Cover Image Input */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="text-xl">🖼️</span>
              <span>Ảnh bìa</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:rounded-full"
              />
            </div>
            
            {/* Image Preview */}
            {formData.coverImageUrl && (
              <div className="mt-4">
                {!imageError ? (
                  <div className="relative group">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                      </div>
                    )}
                    <img
                      src={formData.coverImageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover:shadow-lg transition-all"
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all"></div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-center text-red-600">
                    <div className="text-center">
                      <span className="text-4xl">🚫</span>
                      <p className="mt-2 font-medium">URL ảnh không hợp lệ</p>
                      <p className="text-sm text-red-500 mt-1">Vui lòng kiểm tra lại đường dẫn</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!formData.coverImageUrl && (
              <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-xl text-center">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-gray-500 mt-2">Thêm ảnh bìa để bài viết hấp dẫn hơn</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Content & Preview */}
        <div className="space-y-6">
          {/* Content Editor */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  !showPreview
                    ? 'bg-white text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>✍️</span>
                  <span>Viết</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  showPreview
                    ? 'bg-white text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>👁️</span>
                  <span>Xem trước</span>
                </span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {!showPreview ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span>Nội dung</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs font-medium ${
                      contentLength < 100 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {contentLength} ký tự
                    </span>
                  </div>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Nhập nội dung bài viết... 

# Tiêu đề lớn
## Tiêu đề nhỏ

**Chữ in đậm** hoặc *chữ in nghiêng*

- Danh sách 1
- Danh sách 2

Viết những câu chuyện, kinh nghiệm thú vị về thú cưng của bạn..."
                    rows="20"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none font-mono text-sm"
                    required
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <span>💡</span>
                      <span>Hỗ trợ Markdown</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <span># H1</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <span>**bold**</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <span>*italic*</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-orange max-w-none min-h-[500px]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Xem trước</h3>
                  {renderMarkdownPreview(formData.content)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky bottom-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span className="text-xl">{post ? '💾' : '🚀'}</span>
                <span>{post ? 'Cập nhật bài viết' : 'Gửi bài viết'}</span>
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
            >
              <span>❌</span>
              <span>Hủy</span>
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}} />
    </form>
  );
}
