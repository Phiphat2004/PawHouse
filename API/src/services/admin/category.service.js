const { Category } = require("../../models");

async function getAllCategories({ isActive, search }) {
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  const categories = await Category.find(query)
    .populate("parentCategory", "name slug")
    .lean()
    .sort({ createdAt: -1 });

  const { Product } = require("../../models");
  
  // Build a tree of category relations
  const categoryTree = {};
  categories.forEach(c => {
    const parentId = c.parentCategory?._id ? c.parentCategory._id.toString() : null;
    if (parentId) {
      if (!categoryTree[parentId]) categoryTree[parentId] = [];
      categoryTree[parentId].push(c._id.toString());
    }
  });

  const getDescendantIds = (idStr) => {
    let ids = [idStr];
    const children = categoryTree[idStr] || [];
    for (const childId of children) {
      ids = ids.concat(getDescendantIds(childId));
    }
    return ids;
  };

  await Promise.all(
    categories.map(async (category) => {
      const allIds = getDescendantIds(category._id.toString());
      category.productCount = await Product.countDocuments({
        categoryIds: { $in: allIds },
        isDeleted: { $ne: true },
      });
    }),
  );

  return categories;
}

async function getCategoryById(id) {
  return Category.findById(id);
}

async function updateCategory(
  id,
  { name, slug, description, isActive, parentCategory },
  userRoles,
) {
  if (!userRoles?.includes("admin")) {
    const error = new Error("Permission denied");
    error.status = 403;
    throw error;
  }

  if (slug) {
    const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
    if (existingCategory) {
      const error = new Error("Slug already exists");
      error.status = 400;
      throw error;
    }
  }

  if (parentCategory && parentCategory.toString() === id.toString()) {
    const error = new Error("Parent category cannot reference itself");
    error.status = 400;
    throw error;
  }

  const payload = { name, slug, description, isActive };
  if (parentCategory !== undefined) {
    payload.parentCategory = parentCategory || null;
  }

  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }

  return category;
}

async function deleteCategory(id, userRoles) {
  if (!userRoles?.includes("admin")) {
    const error = new Error("Permission denied");
    error.status = 403;
    throw error;
  }

  const category = await Category.findById(id);
  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }

  // Check if category has sub-categories
  const childCount = await Category.countDocuments({ parentCategory: id });
  if (childCount > 0) {
    const error = new Error(
      `Cannot delete this category because it has ${childCount} sub-categories. Please delete or move them first.`,
    );
    error.status = 400;
    throw error;
  }

  const { Product } = require("../../models");
  const productsCount = await Product.countDocuments({ 
    categoryIds: id,
    isDeleted: { $ne: true }
  });
  if (productsCount > 0) {
    const error = new Error(
      `Cannot delete category with ${productsCount} products. Please move or delete products first.`,
    );
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
  const { name, slug, description, isActive, parentCategory } = data;

  if (!userRoles?.includes("admin")) {
    const error = new Error("Permission denied");
    error.status = 403;
    throw error;
  }

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    const error = new Error("Slug already exists");
    error.status = 400;
    throw error;
  }

  const category = new Category({
    name,
    slug,
    description,
    isActive,
    parentCategory: parentCategory || null,
  });

  await category.save();

  return category;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createCategory,
};
