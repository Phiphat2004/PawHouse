import { useState, useEffect } from "react";

export default function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    brand: "",
    categoryIds: [],
    images: [],
    isActive: true,
    price: 0,
    compareAtPrice: 0,
    stock: 0,
    sku: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        brand: product.brand || "",
        categoryIds:
          product.categoryIds?.map((id) =>
            typeof id === "string" ? id : id._id
          ) || [],
        images: product.images || [],
        isActive: product.isActive !== false,
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice || 0,
        stock: product.stock || 0,
        sku: product.sku || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === "checkbox" ? checked : value;
    
    // Tự động chuyển SKU thành uppercase
    if (name === "sku") {
      processedValue = value.toUpperCase();
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (name === "name" && !product) {
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

  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;

    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: imageUrl.trim(), sortOrder: prev.images.length },
      ],
    }));
    setImageUrl("");
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMoveImage = (index, direction) => {
    const newImages = [...formData.images];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;

    [newImages[index], newImages[newIndex]] = [
      newImages[newIndex],
      newImages[index],
    ];
    newImages.forEach((img, i) => (img.sortOrder = i));

    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên sản phẩm";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Vui lòng nhập slug";
    }

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = "Vui lòng chọn ít nhất một danh mục";
    }

    // Validation for price, stock, sku
    if (!formData.sku.trim()) {
      newErrors.sku = "Vui lòng nhập mã SKU";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Giá sản phẩm phải lớn hơn 0";
    }

    if (formData.stock === "" || formData.stock < 0) {
      newErrors.stock = "Số lượng tồn kho không được âm";
    }

    if (formData.compareAtPrice > 0 && formData.compareAtPrice <= formData.price) {
      newErrors.compareAtPrice = "Giá so sánh phải lớn hơn giá bán";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }

    setLoading(true);
    try {
      // Đảm bảo SKU viết hoa trước khi submit
      const submitData = {
        ...formData,
        sku: formData.sku.toUpperCase(),
      };
      
      console.log('Submitting product data:', submitData);
      console.log('Is editing?', !!product);
      
      await onSubmit(submitData);
      
      console.log('Product submitted successfully');
    } catch (err) {
      console.error('Submit error:', err);
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <p className="text-orange-100 text-sm">
                {product
                  ? "Cập nhật thông tin sản phẩm"
                  : "Điền thông tin sản phẩm mới"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-lg transition-all flex items-center justify-center text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">📝</span>
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.name
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 bg-white"
                      }`}
                      placeholder="Ví dụ: Thức ăn cho chó vị gà"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">
                      🏷️
                    </span>
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {errors.name}
                    </p>
                  )}
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      Slug (URL thân thiện){" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm ${
                        errors.slug
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 bg-white"
                      }`}
                      placeholder="thuc-an-cho-cho-vi-ga"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">
                      🔗
                    </span>
                  </div>
                  {errors.slug && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {errors.slug}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                      placeholder="Ví dụ: Royal Pet, SmartHeart..."
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">
                      🏢
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Giá & Kho hàng */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">💰</span>
                Giá & Kho hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.sku ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ví dụ: RPET001"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-500">{errors.sku}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng tồn kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.stock ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                </div>

                {/* Compare At Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá so sánh (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="compareAtPrice"
                    value={formData.compareAtPrice}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.compareAtPrice ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors.compareAtPrice && (
                    <p className="mt-1 text-sm text-red-500">{errors.compareAtPrice}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Giá gốc để hiển thị giảm giá (phải lớn hơn giá bán)
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">📄</span>
                Mô tả sản phẩm
              </h3>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white resize-none"
                  placeholder="Nhập mô tả chi tiết về sản phẩm, tính năng, lợi ích..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {formData.description.length} ký tự
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">📂</span>
                Danh mục <span className="text-red-500 text-sm">*</span>
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Chưa có danh mục nào
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label
                        key={category._id}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          formData.categoryIds.includes(category._id)
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category._id)}
                          onChange={() => handleCategoryChange(category._id)}
                          className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span
                          className={`text-sm font-medium ${
                            formData.categoryIds.includes(category._id)
                              ? "text-orange-700"
                              : "text-gray-700"
                          }`}
                        >
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.categoryIds && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.categoryIds}
                </p>
              )}
              {formData.categoryIds.length > 0 && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span>✓</span> Đã chọn {formData.categoryIds.length} danh mục
                </p>
              )}
            </div>

            {/* Images */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">🖼️</span>
                Hình ảnh sản phẩm
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddImage())
                      }
                      placeholder="https://example.com/image.jpg"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">
                      🔗
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!imageUrl.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    + Thêm
                  </button>
                </div>

                {formData.images.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span>📸</span>
                      {formData.images.length} hình ảnh
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100 aspect-square">
                            <img
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                            <div
                              className="w-full h-full items-center justify-center p-3"
                              style={{ display: "none" }}
                            >
                              <div className="text-center">
                                <span className="text-4xl">🖼️</span>
                                <p className="text-xs text-gray-500 mt-2 break-all line-clamp-3">
                                  {image.url}
                                </p>
                              </div>
                            </div>

                            {/* Overlay with controls */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                                <div className="flex gap-2">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMoveImage(index, "up")
                                      }
                                      className="p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
                                      title="Di chuyển lên"
                                    >
                                      <span className="text-sm">⬆️</span>
                                    </button>
                                  )}
                                  {index < formData.images.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMoveImage(index, "down")
                                      }
                                      className="p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
                                      title="Di chuyển xuống"
                                    >
                                      <span className="text-sm">⬇️</span>
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="p-2 bg-red-500 bg-opacity-90 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
                                  title="Xóa"
                                >
                                  <span className="text-sm">🗑️</span>
                                </button>
                              </div>
                            </div>

                            {/* Label for main image */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                                <span>⭐</span> Ảnh chính
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-500">⚙️</span>
                Cài đặt
              </h3>
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-200 transition-all">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Kích hoạt sản phẩm
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sản phẩm sẽ hiển thị trên website
                  </p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            {product ? "Cập nhật thông tin sản phẩm" : "Tạo sản phẩm mới"}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              ✕ Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>{product ? "💾" : "➕"}</span>
                  <span>{product ? "Cập nhật" : "Tạo mới"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
