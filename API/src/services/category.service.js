const { Category } = require("../models");

async function getAllCategories({ isActive }) {
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true"; 
  }

  return Category.find(query) 
    .populate("parentId", "name slug")
    .sort({ name: 1 });
}

async function getCategoryById(id) {
  return Category.findById(id).populate("parentId", "name slug");
}

async function updateCategory(id, { parentId, name, slug, description, isActive }, userRoles) {
  // Check if user is admin
  if (!userRoles?.includes("admin")) {
    const error = new Error("Không có quyền thực hiện");
    error.status = 403;
    throw error;
  }

  // Check if slug is being changed and if it already exists
  if (slug) {
    const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
    if (existingCategory) {
      const error = new Error("Slug đã tồn tại");
      error.status = 400;
      throw error;
    }
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { parentId, name, slug, description, isActive },
    { new: true, runValidators: true },
  ).populate("parentId", "name slug");

  if (!category) {
    const error = new Error("Không tìm thấy danh mục");
    error.status = 404;
    throw error;
  }

  return category;
}

async function getCategoryById(id) {
  return Category.findById(id).populate("parentId", "name slug");
}

async function createCategory(data, userRoles) {
  const { parentId, name, slug, description, isActive } = data;

  // Check if user is admin
  if (!userRoles?.includes("admin")) {
    const error = new Error("Không có quyền thực hiện");
    error.status = 403;
    throw error;
  }

  // Check if slug already exists
  let finalSlug = slug;
  const existingCategory = await Category.findOne({ slug: finalSlug });
  if (existingCategory) {
    let counter = 1;
    while (await Category.findOne({ slug: `${slug}-${counter}` })) {
      counter++;
    }
    finalSlug = `${slug}-${counter}`;
  }

  const category = new Category({
    parentId,
    name,
    slug: finalSlug,
    description,
    isActive,
  });

  await category.save();
  await category.populate("parentId", "name slug");
  return category;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  updateCategory,
  createCategory
};
