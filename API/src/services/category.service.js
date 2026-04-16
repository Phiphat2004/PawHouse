const { Category } = require("../models");

async function getAllCategories({ isActive, search }) {
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true"; 
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } }
    ];
  }

  const categories = await Category.find(query).lean().sort({ name: 1 });

  const { Product } = require("../models");
  await Promise.all(
    categories.map(async (category) => {
      category.productCount = await Product.countDocuments({
        categoryIds: category._id,
        isDeleted: false,
      });
    })
  );

  return categories;
}

async function getCategoryById(id) {
  return Category.findById(id);
}

async function updateCategory(id, { name, slug, description, isActive }, userRoles) {
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
    { name, slug, description, isActive },
    { new: true, runValidators: true },
  );

  if (!category) {
    const error = new Error("Không tìm thấy danh mục");
    error.status = 404;
    throw error;
  }

  return category;
}

async function deleteCategory(id, userRoles) {
  // Check if user is admin
  if (!userRoles?.includes("admin")) {
    const error = new Error("Không có quyền thực hiện");
    error.status = 403;
    throw error;
  }

  const category = await Category.findById(id);
  if (!category) {
    const error = new Error("Không tìm thấy danh mục");
    error.status = 404;
    throw error;
  }



  // Check if category has products
  const { Product } = require("../models");
  const productsCount = await Product.countDocuments({ categoryIds: id });
  if (productsCount > 0) {
    const error = new Error(`Không thể xóa danh mục có ${productsCount} sản phẩm. Vui lòng di chuyển hoặc xóa các sản phẩm trước.`);
    error.status = 400;
    throw error;
  }

  await Category.findByIdAndDelete(id);
  return {
    id: category._id,
    name: category.name,
  };
}

async function createCategory(data, userRoles) {
  const { name, slug, description, isActive } = data;

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

    name,
    slug: finalSlug,
    description,
    isActive,
  });

  await category.save();

  return category;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createCategory
};
