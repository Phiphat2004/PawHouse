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
    .sort({ name: 1 });

  const { Product } = require("../../models");
  await Promise.all(
    categories.map(async (category) => {
      category.productCount = await Product.countDocuments({
        categoryIds: category._id,
        isDeleted: false,
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
