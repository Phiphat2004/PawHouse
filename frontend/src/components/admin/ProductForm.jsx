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
    originalPrice: 0,
    discountPercentage: 0,
    sku: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
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
        originalPrice: product.compareAtPrice || product.price || 0,
        discountPercentage: product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0,
        sku: product.sku || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === "checkbox" ? checked : value;

    // Automatically convert SKU to uppercase
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

  const handleFocus = (e) => {
    const { name, value } = e.target;
    if (Number(value) === 0) {
      setFormData((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value === "") {
      setFormData((prev) => ({ ...prev, [name]: 0 }));
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find((c) => c._id === categoryId);
    if (!category) return;

    setFormData((prev) => {
      let newIds = [...prev.categoryIds];
      const isSelected = newIds.includes(categoryId);

      if (isSelected) {
        // Unselecting - just remove the ID
        newIds = newIds.filter((id) => id !== categoryId);
      } else {
        // Selecting - add current ID
        newIds.push(categoryId);

        if (!category.parentCategory) {
          // It's a PARENT - Deselect all its children to keep it "Broad"
          const childIds = categories
            .filter(
              (c) =>
                c.parentCategory === categoryId ||
                c.parentCategory?._id === categoryId
            )
            .map((c) => c._id);
          newIds = newIds.filter((id) => !childIds.includes(id));
        } else {
          // It's a CHILD - Deselect its parent to keep it "Specific"
          const parentId =
            typeof category.parentCategory === "string"
              ? category.parentCategory
              : category.parentCategory?._id;
          if (parentId) {
            newIds = newIds.filter((id) => id !== parentId);
          }
        }
      }

      return { ...prev, categoryIds: newIds };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => {
      const totalExising = formData.images.length;
      const totalNew = prev.length + files.length;
      if (totalExising + totalNew > 5) {
        alert("You can have at most 5 images per product");
        const remainingSlots = 5 - totalExising - prev.length;
        if (remainingSlots <= 0) return prev;
        return [...prev, ...files.slice(0, remainingSlots)];
      }
      return [...prev, ...files];
    });
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      newErrors.name = "Please enter a product name";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Please enter a slug";
    }

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = "Please select at least one category";
    }

    // Validation for price, stock, sku
    if (!formData.sku.trim()) {
      newErrors.sku = "Please enter SKU";
    }

    if (!formData.originalPrice || formData.originalPrice <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0";
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = "Discount percentage must be between 0 and 100";
    }

    if (formData.images.length + selectedFiles.length === 0) {
      newErrors.images = "Please select at least one product image";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const originalP = Number(formData.originalPrice);
      const discountP = Number(formData.discountPercentage);
      let compareAtPrice = 0;
      let price = originalP;

      if (discountP > 0) {
        compareAtPrice = originalP;
        price = Math.round(originalP * (1 - discountP / 100));
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        brand: formData.brand,
        categoryIds: formData.categoryIds,
        images: formData.images,
        isActive: formData.isActive,
        sku: formData.sku,
        price,
        compareAtPrice, // 0 = no discount (backend will remove it), >0 = has discount
        stock: product?.stock || 0
      };

      const data = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'categoryIds') {
          payload.categoryIds.forEach(id => data.append('categoryIds[]', id));
        } else if (key === 'images') {
          data.append('images', JSON.stringify(payload.images));
        } else {
          data.append(key, payload[key]);
        }
      });

      selectedFiles.forEach(file => data.append('images', file));

      await onSubmit(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm bg-white/10">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              {product ? "Edit product" : "Add new product"}
            </h2>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Basic information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      Product name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.name
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 bg-white"
                        }`}
                      placeholder="Example: Chicken flavor dog food"
                    />
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
                      Slug (friendly URL){" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm ${errors.slug
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 bg-white"
                        }`}
                      placeholder="thuc-an-cho-cho-vi-ga"
                    />
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
                    Brand
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                      placeholder="Example: Royal Pet, SmartHeart..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price and stock */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Price
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.sku ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Example: RPET001"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-500">{errors.sku}</p>
                  )}
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original price (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.originalPrice ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="0"
                  />
                  {errors.originalPrice && (
                    <p className="mt-1 text-sm text-red-500">{errors.originalPrice}</p>
                  )}
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount percentage (%)
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.discountPercentage ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="0"
                  />
                  {errors.discountPercentage && (
                    <p className="mt-1 text-sm text-red-500">{errors.discountPercentage}</p>
                  )}
                </div>

                {/* Final Price (Readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual selling price (VND)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(formData.originalPrice * (1 - formData.discountPercentage / 100)))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-green-700 font-bold cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Product description
              </h3>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white resize-none"
                  placeholder="Enter a detailed product description, features, and benefits..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {formData.description.length} characters
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Categories <span className="text-red-500 text-sm">*</span>
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No categories available
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
                    {categories
                      .filter((c) => !c.parentCategory)
                      .map((rootCat) => {
                        const childCats = categories.filter(
                          (c) => c.parentCategory === rootCat._id || c.parentCategory?._id === rootCat._id
                        );

                        return (
                          <div key={rootCat._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className={`flex items-center gap-2 cursor-pointer p-2 mb-2 rounded-lg transition-all ${formData.categoryIds.includes(rootCat._id)
                              ? "bg-orange-100 text-orange-800"
                              : "hover:bg-gray-100"
                              }`}>
                              <input
                                type="checkbox"
                                checked={formData.categoryIds.includes(rootCat._id)}
                                onChange={() => handleCategoryChange(rootCat._id)}
                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 shrink-0"
                              />
                              <span className="font-bold text-sm uppercase tracking-wider">
                                {rootCat.name} (Main category)
                              </span>
                            </label>

                            {childCats.length === 0 ? (
                              <p className="text-xs text-gray-500 px-1 italic">No subcategories</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 pl-4">
                                {childCats.map((child) => (
                                  <label
                                    key={child._id}
                                    className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border-2 transition-all bg-white ${formData.categoryIds.includes(child._id)
                                      ? "border-orange-500 bg-orange-50"
                                      : "border-gray-200 hover:border-orange-200"
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.categoryIds.includes(child._id)}
                                      onChange={() => handleCategoryChange(child._id)}
                                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 shrink-0"
                                    />
                                    <span
                                      className={`text-sm font-medium ${formData.categoryIds.includes(child._id)
                                        ? "text-orange-700"
                                        : "text-gray-700"
                                        }`}
                                    >
                                      {child.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                  <span>✓</span> Selected {formData.categoryIds.length} categories
                </p>
              )}
            </div>

            {/* Images */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Product images
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Add product images (Maximum 5 images) <span className="text-red-500">*</span>
                    </label>
                    <label className="relative cursor-pointer group">
                      <div className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center bg-gray-50 shadow-sm font-medium text-gray-600">
                        Choose images
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Images ready to upload ({selectedFiles.length}/5):</p>
                      <div className="flex flex-wrap gap-4">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-orange-50 group shadow-sm transition-transform hover:scale-105">
                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 font-bold text-lg"
                              title="Remove this image"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.images && (
                    <p className="text-[11px] text-red-500 font-medium">⚠️ {errors.images}</p>
                  )}
                </div>

                {formData.images.length > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">
                      Current images ({formData.images.length})
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-gray-100 group shadow-sm transition-transform hover:scale-105">
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Label for main image */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                              ⭐ Primary
                            </div>
                          )}

                          {/* Removal button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 font-bold text-lg"
                            title="Delete this image"
                          >
                            &times;
                          </button>

                          {/* Sorting controls */}
                          <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, "up")}
                                className="w-6 h-6 bg-white/90 rounded border border-gray-200 flex items-center justify-center hover:bg-white text-[10px]"
                                title="Move to top"
                              >
                                ⬆️
                              </button>
                            )}
                            {index < formData.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, "down")}
                                className="w-6 h-6 bg-white/90 rounded border border-gray-200 flex items-center justify-center hover:bg-white text-[10px]"
                                title="Move down"
                              >
                                ⬇️
                              </button>
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
                Settings
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
                    Activate product
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Product will be visible on the website
                  </p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-12 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <span>{product ? "Update" : "Add"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
