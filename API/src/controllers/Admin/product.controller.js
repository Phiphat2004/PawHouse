const productService = require("../../services/admin/product.service");
const cloudinary = require("cloudinary").v2;
const config = require("../../config");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "pawhouse/products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });

const getStats = async (req, res) => {
  try {
    const stats = await productService.getProductStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting product stats:", error);
    res.status(500).json({ error: "Lỗi khi lấy thống kê sản phẩm" });
  }
};

const create = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Vui lòng thêm ít nhất một ảnh" });
    }

    const uploadResults = await Promise.all(
      req.files.map((file) => streamUpload(file.buffer)),
    );

    const images = uploadResults.map((result, index) => ({
      url: result.secure_url,
      sortOrder: index,
    }));

    const product = await productService.createProduct(
      { ...req.body, images },
      req.user?.roles,
      req.user?.userId,
    );
    res.status(201).json({ product });
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi tạo sản phẩm" });
  }
};

const update = async (req, res) => {
  try {
    let data = { ...req.body };

    let resolvedImages = [];
    if (req.body.images) {
      try {
        resolvedImages =
          typeof req.body.images === "string"
            ? JSON.parse(req.body.images)
            : req.body.images;
      } catch (e) {
        resolvedImages = [];
      }
    }

    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => streamUpload(file.buffer)),
      );

      const newImages = uploadResults.map((result, index) => ({
        url: result.secure_url,
        sortOrder: resolvedImages.length + index,
      }));

      resolvedImages = [...resolvedImages, ...newImages];
    }

    if (req.body.images || (req.files && req.files.length > 0)) {
      if (resolvedImages.length === 0) {
        return res
          .status(400)
          .json({ error: "Sản phẩm phải có ít nhất một ảnh" });
      }
      data.images = resolvedImages;
    }

    const product = await productService.updateProduct(
      req.params.id,
      data,
      req.user?.roles,
    );
    res.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi cập nhật sản phẩm" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await productService.deleteProduct(req.params.id);
    res.json({
      message: "Xóa sản phẩm thành công",
      deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Lỗi khi xóa sản phẩm" });
  }
};

module.exports = {
  getStats,
  create,
  update,
  delete: deleteProduct,
};
