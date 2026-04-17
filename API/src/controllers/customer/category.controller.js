const categoryService = require("../../services/customer/category.service");

const getAll = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.query);
    res.json({ categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi lấy danh sách danh mục" });
  }
};

const getById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Không tìm thấy danh mục" });
    }
    res.json({ category });
  } catch (error) {
    console.error("Error getting category:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin danh mục" });
  }
};

module.exports = {
  getAll,
  getById,
};
