const productService = require("../../services/customer/product.service");

const getAll = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.json(result);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm" });
  }
};

const getById = async (req, res) => {
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
};

const getBySlug = async (req, res) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    if (!product.isActive) {
      return res.status(404).json({ error: "Sản phẩm không khả dụng" });
    }

    res.json({ product });
  } catch (error) {
    console.error("Error getting product by slug:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
  }
};

const search = async (req, res) => {
  try {
    const { q } = req.query;
    const products = await productService.searchProducts(q);
    res.json({ products });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Lỗi khi tìm kiếm sản phẩm" });
  }
};

module.exports = {
  getAll,
  getById,
  getBySlug,
  search,
};
