const categoryService = require("../../services/admin/category.service");

const create = async (req, res) => {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.user?.roles,
    );
    res.status(201).json({ category });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi tạo danh mục" });
  }
};

const update = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.user?.roles,
    );
    res.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi cập nhật danh mục" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await categoryService.deleteCategory(
      req.params.id,
      req.user?.roles,
    );
    res.json({
      message: "Xóa danh mục thành công",
      deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi xóa danh mục" });
  }
};

module.exports = {
  create,
  update,
  delete: deleteCategory,
};
