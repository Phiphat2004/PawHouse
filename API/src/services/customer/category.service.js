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

module.exports = {
  getAllCategories,
  getCategoryById,
};
