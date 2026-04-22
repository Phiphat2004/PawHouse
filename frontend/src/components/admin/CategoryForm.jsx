import { useState, useEffect } from "react";

export default function CategoryForm({
  category,
  categories,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentCategory: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        parentCategory: category.parentCategory?._id || category.parentCategory || "",
      });
    }
  }, [category]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Please enter a category name";
    if (!formData.slug.trim()) newErrors.slug = "Please enter a slug";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        parentCategory: formData.parentCategory || null,
      };

      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Removed availableParents

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-white/10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {category ? " Edit category" : " Add new category"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Category name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
              placeholder="Example: Dog food"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${errors.slug ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
              placeholder="thuc-an-cho-cho"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
              placeholder="Category description..."
            />
          </div>

          {/* Parent category */}
          {(!category || !categories?.some(c => (c.parentCategory?._id || c.parentCategory) === category._id)) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Parent category (Optional)
              </label>
              <select
                name="parentCategory"
                value={formData.parentCategory}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              >
                <option value="">None (Root category)</option>
                {categories
                  ?.filter((c) => !c.parentCategory && c._id !== category?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}





          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "⏳ Saving..."
                : category
                  ? " Update"
                  : " Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
