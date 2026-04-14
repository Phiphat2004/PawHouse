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

  // Get product by ID
  async getById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }
      res.json({ product });
    } catch (error) {
      console.error("Error getting product:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
    }
  },

  // Get product by slug
  async getBySlug(req, res) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }
      res.json({ product });
    } catch (error) {
      console.error("Error getting product by slug:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
    }},
  // Update product
  async update(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body, req.user?.roles);
      res.json({ product });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(error.status || 500).json({ error: error.message || "Lỗi khi cập nhật sản phẩm" });
    }
  },
};

module.exports = productController;
