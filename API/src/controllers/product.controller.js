const productService = require("../services/product.service");

const productController = {
  // Create new product
  async create(req, res) {
    try {
      const product = await productService.createProduct(req.body, req.user?.roles, req.user?.userId);
      res.status(201).json({ product });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(error.status || 500).json({ error: error.message || "Lỗi khi tạo sản phẩm" });
    }
  },

  // Get all products
  async getAll(req, res) {
    try {
      const result = await productService.getAllProducts(req.query);
      res.json(result);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm" });
    }
  },
};

module.exports = productController;
