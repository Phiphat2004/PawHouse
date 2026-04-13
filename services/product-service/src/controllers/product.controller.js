const { Product, StockLevel, Warehouse } = require("../models");

const productController = {
  // Get all products
  async getAll(req, res) {
    console.log("[CONTROLLER] getAll called");
    try {
      console.log("[CONTROLLER] Query params:", req.query);
      const {
        page = 1,
        limit = 50,
        search,
        categoryId,
        isActive,
        brand,
      } = req.query;

      const query = {};

      // Hide only records explicitly soft-deleted; keep legacy records without isDeleted
      query.isDeleted = { $ne: true };

      if (search) {
        query.$text = { $search: search };
      }

      if (categoryId) {
        query.categoryIds = categoryId;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      if (brand) {
        query.brand = { $regex: brand, $options: "i" };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      console.log("[CONTROLLER] Executing query...");
      const [products, total] = await Promise.all([
        Product.find(query)
          // .populate("categoryIds", "name slug")  // Temporarily disable populate
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Product.countDocuments(query),
      ]);

      console.log("[CONTROLLER] Query done, products:", products.length);
      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm" });
    }
  },

  // Get product by ID
  async getById(req, res) {
    try {
      const product = await Product.findById(req.params.id).populate(
        "categoryIds",
        "name slug",
      );

      if (!product || product.isDeleted) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      res.json({ product });
    } catch (error) {
      console.error("Error getting product:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
    }
  },

  // Get product by slug (for public pages)
  async getBySlug(req, res) {
    try {
      const product = await Product.findOne({
        slug: req.params.slug,
        isDeleted: { $ne: true },
      }).populate("categoryIds", "name slug");

      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      // Only return active products for public access
      if (!product.isActive) {
        return res.status(404).json({ error: "Sản phẩm không khả dụng" });
      }

      res.json({ product });
    } catch (error) {
      console.error("Error getting product by slug:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
    }
  },

  // Create new product
  async create(req, res) {
    try {
      const {
        name,
        slug,
        description,
        brand,
        categoryIds,
        images,
        isActive,
        price,
        stock,
        sku,
        compareAtPrice,
      } = req.body;

      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
      }

      // Validation
      if (!price || price <= 0) {
        return res.status(400).json({ error: "Giá sản phẩm phải lớn hơn 0" });
      }
      if (stock === undefined || stock < 0) {
        return res
          .status(400)
          .json({ error: "Số lượng tồn kho không được âm" });
      }
      if (!sku || !sku.trim()) {
        return res.status(400).json({ error: "Mã SKU không được để trống" });
      }
      if (compareAtPrice && compareAtPrice <= price) {
        return res
          .status(400)
          .json({ error: "Giá so sánh phải lớn hơn giá bán" });
      }

      // Check if SKU already exists
      const existingSKU = await Product.findOne({
        sku: sku.toUpperCase(),
        isDeleted: { $ne: true },
      });
      if (existingSKU) {
        return res.status(400).json({ error: "Mã SKU đã tồn tại" });
      }

      // Check if slug already exists and auto-generate unique slug
      let finalSlug = slug;
      const existingProduct = await Product.findOne({
        slug: finalSlug,
        isDeleted: { $ne: true },
      });
      if (existingProduct) {
        let counter = 1;
        while (
          await Product.findOne({
            slug: `${slug}-${counter}`,
            isDeleted: { $ne: true },
          })
        ) {
          counter++;
        }
        finalSlug = `${slug}-${counter}`;
      }

      const product = new Product({
        name,
        slug: finalSlug,
        description,
        brand,
        categoryIds,
        images,
        isActive,
        price,
        stock,
        sku: sku.toUpperCase(),
        compareAtPrice,
        createdBy: req.user.userId,
      });

      await product.save();
      await product.populate("categoryIds", "name slug");

      // Tự động tạo StockLevel cho sản phẩm mới tạo (dùng cho reserve/release/fulfill flow)
      try {
        const warehouse = await Warehouse.findOne();
        if (warehouse && stock > 0) {
          await StockLevel.findOneAndUpdate(
            { productId: product._id, warehouseId: warehouse._id },
            {
              $setOnInsert: {
                quantity: stock,
                reservedQuantity: 0,
                availableQuantity: stock
              }
            },
            { upsert: true }
          );
        }
      } catch (slErr) {
        console.warn('[Product] Could not init StockLevel (non-fatal):', slErr.message);
      }

      res.status(201).json({ product });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ error: messages.join(". ") });
      }
      res.status(500).json({ error: error.message || "Lỗi khi tạo sản phẩm" });
    }
  },

  // Update product
  async update(req, res) {
    try {
      const {
        name,
        slug,
        description,
        brand,
        categoryIds,
        images,
        isActive,
        price,
        stock,
        sku,
        compareAtPrice,
      } = req.body;

      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        isDeleted: { $ne: true },
      });
      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      // Validation for price, stock, sku, compareAtPrice if provided
      if (price !== undefined && price <= 0) {
        return res.status(400).json({ error: "Giá sản phẩm phải lớn hơn 0" });
      }
      if (stock !== undefined && stock < 0) {
        return res
          .status(400)
          .json({ error: "Số lượng tồn kho không được âm" });
      }
      if (sku !== undefined) {
        if (!sku.trim()) {
          return res.status(400).json({ error: "Mã SKU không được để trống" });
        }
        // Check if SKU already exists for another product
        const existingSKU = await Product.findOne({
          sku: sku.toUpperCase(),
          isDeleted: { $ne: true },
          _id: { $ne: req.params.id },
        });
        if (existingSKU) {
          return res.status(400).json({ error: "Mã SKU đã tồn tại" });
        }
      }
      if (compareAtPrice !== undefined) {
        const finalPrice = price !== undefined ? price : product.price;
        if (compareAtPrice > 0 && compareAtPrice <= finalPrice) {
          return res
            .status(400)
            .json({ error: "Giá so sánh phải lớn hơn giá bán" });
        }
      }

      // Check if slug is being changed and if it already exists
      if (slug && slug !== product.slug) {
        const existingProduct = await Product.findOne({
          slug,
          isDeleted: { $ne: true },
          _id: { $ne: req.params.id },
        });
        if (existingProduct) {
          return res.status(400).json({ error: "Slug đã tồn tại" });
        }
      }

      // Update fields
      if (name !== undefined) product.name = name;
      if (slug !== undefined) product.slug = slug;
      if (description !== undefined) product.description = description;
      if (brand !== undefined) product.brand = brand;
      if (categoryIds !== undefined) product.categoryIds = categoryIds;
      if (images !== undefined) product.images = images;
      if (isActive !== undefined) product.isActive = isActive;
      if (price !== undefined) product.price = price;
      if (stock !== undefined) product.stock = stock;
      if (sku !== undefined) product.sku = sku.toUpperCase();
      if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;

      await product.save();
      await product.populate("categoryIds", "name slug");

      res.json({ product });
    } catch (error) {
      console.error("Error updating product:", error);
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ error: messages.join(". ") });
      }
      res.status(500).json({ error: "Lỗi khi cập nhật sản phẩm" });
    }
  },

  // Delete product
  async delete(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles?.includes("admin")) {
        return res.status(403).json({ error: "Không có quyền thực hiện" });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        isDeleted: { $ne: true },
      });
      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      await Product.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user?.userId || null,
      });

      res.json({
        message: "Xóa mềm sản phẩm thành công",
        deletedProduct: {
          id: product._id,
          name: product.name,
          isDeleted: true,
        },
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
    }
  },

  // Search products
  async search(req, res) {
    try {
      const { q } = req.query;
      const products = await Product.find({
        name: { $regex: q, $options: "i" },
        isDeleted: { $ne: true },
      })
        .limit(50)
        .sort({ createdAt: -1 });

      res.json({ products });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Lỗi khi tìm kiếm sản phẩm" });
    }
  },

  // Get product statistics
  async getStats(req, res) {
    try {
      const total = await Product.countDocuments({ isDeleted: { $ne: true } });
      const active = await Product.countDocuments({
        isActive: true,
        isDeleted: { $ne: true },
      });

      res.json({
        total,
        active,
        inactive: total - active,
      });
    } catch (error) {
      console.error("Error getting product stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê sản phẩm" });
    }
  },
};

module.exports = productController;
