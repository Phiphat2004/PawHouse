const { Category } = require("../models");

const categoryController = {
  // Get all categories
  async getAll(req, res) {
    try {
      const { isActive } = req.query;

      const query = {};
      if (isActive !== undefined) {
        query.isActive = isActive === "true"; 
      }

      const categories = await Category.find(query) 
        .populate("parentId", "name slug")
        .sort({ name: 1 });

      res.json({ categories });
    } catch (error) {
      console.error("Error getting categories:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách danh mục" });
    }
  },

  // Get category by ID
  async getById(req, res) {
    try {
      const category = await Category.findById(req.params.id).populate(
        "parentId",
        "name slug",
      );

      if (!category) {
        return res.status(404).json({ error: "Không tìm thấy danh mục" });
      }

      res.json({ category });
    } catch (error) {
      console.error("Error getting category:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin danh mục" });
    }
  },

  // Create new category
  async create(req, res) {
    try {
      const { parentId, name, slug, description, isActive } = req.body;

      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
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
      res.status(201).json({ category });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Lỗi khi tạo danh mục" });
    }
  },

  // Update category
  async update(req, res) {
    try {
      const { parentId, name, slug, description, isActive } = req.body;

      console.log("[CATEGORY UPDATE] Request body:", req.body);
      console.log("[CATEGORY UPDATE] Category ID:", req.params.id);

      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
      }

      // Check if slug is being changed and if it already exists
      if (slug) {
        const existingCategory = await Category.findOne({
          slug,
          _id: { $ne: req.params.id },
        });
        if (existingCategory) {
          return res.status(400).json({ error: "Slug đã tồn tại" });
        }
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { parentId, name, slug, description, isActive },
        { new: true, runValidators: true },
      ).populate("parentId", "name slug");

      if (!category) {
        return res.status(404).json({ error: "Không tìm thấy danh mục" });
      }

      console.log("[CATEGORY UPDATE] Success:", category.name);
      res.json({ category });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật danh mục" });
    }
  },

  // Delete category
  async delete(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
      }

      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Không tìm thấy danh mục" });
      }

      // Check if category has children
      const childCategories = await Category.countDocuments({
        parentId: req.params.id,
      });
      if (childCategories > 0) {
        return res.status(400).json({
          error: `Không thể xóa danh mục có ${childCategories} danh mục con. Vui lòng xóa các danh mục con trước.`,
        });
      }

      // Check if category has products
      const { Product } = require("../models");
      const productsCount = await Product.countDocuments({
        categoryIds: req.params.id,
      });

      if (productsCount > 0) {
        return res.status(400).json({
          error: `Không thể xóa danh mục có ${productsCount} sản phẩm. Vui lòng di chuyển hoặc xóa các sản phẩm trước.`,
        });
      }

      await Category.findByIdAndDelete(req.params.id);

      res.json({
        message: "Xóa danh mục thành công",
        deletedCategory: {
          id: category._id,
          name: category.name,
        },
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Lỗi khi xóa danh mục" });
    }
  },
};

module.exports = categoryController;
