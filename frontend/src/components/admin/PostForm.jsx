import { useState, useEffect, useRef } from "react";
import { postApi } from "../../services/api";

export default function PostForm({ post, canApprove = false, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    status: "draft",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        coverImageUrl: post.coverImageUrl || "",
        status: post.status || "draft",
      });
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === "title" && !post) {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, coverImageUrl: "", submit: "" }));
    try {
      const result = await postApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, coverImageUrl: result.url || "" }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        coverImageUrl: err.message || "Image upload failed",
      }));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handlePickImage = () => {
    if (uploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (uploadingImage) return;
    setFormData((prev) => ({ ...prev, coverImageUrl: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (!canApprove) {
        delete payload.status;
      }
      await onSubmit(payload);
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {post ? "Edit post" : "Create new post"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter post title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.slug ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="post-slug"
          />
          {errors.slug && (
            <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            URL: /community/{formData.slug || "post-slug"}
          </p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summary
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="A short summary of the post"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.content ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter post content..."
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handlePickImage}
            className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-orange-400"
          >
            {formData.coverImageUrl ? (
              <div className="flex max-h-130 min-h-45 w-full items-center justify-center p-3">
                <img
                  src={formData.coverImageUrl}
                  alt="Preview"
                  className="h-auto max-h-125 w-auto max-w-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="flex min-h-45 w-full items-center justify-center text-gray-500">
                Choose image from device
              </div>
            )}

            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
              </div>
            )}
          </button>

          {formData.coverImageUrl && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            </div>
          )}

          {errors.coverImageUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.coverImageUrl}</p>
          )}
        </div>

        {/* Status */}
        {canApprove ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Your post will move to <strong>Pending approval</strong> and will only be publicly visible after admin approval.
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="flex-1 bg-linear-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : post ? "Update" : "Create post"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
