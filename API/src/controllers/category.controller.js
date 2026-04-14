const categoryService = require("../services/category.service");

const categoryController = {
  // Get all categories
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAllCategories(req.query);
      res.json({ categories });
    } catch (error) {
      console.error("Error getting categories:", error);
      res.status(error.status || 500).json({ error: error.message || "Lỗi khi lấy danh sách danh mục" });
    }
  },

  // Get category by ID
  async getById(req, res) {
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
  },

  // Get category by ID
  async getById(req, res) {
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
  },

  // Update category
  async update(req, res) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body, req.user?.roles);
      res.json({ category });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(error.status || 500).json({ error: error.message || "Lỗi khi cập nhật danh mục" });
    }
  },

  // Create new category
  async create(req, res) {
    try {
      const category = await categoryService.createCategory(req.body, req.user?.roles);
      res.status(201).json({ category });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(error.status || 500).json({ error: error.message || "Lỗi khi tạo danh mục" });
    }
  }
};

module.exports = categoryController;
