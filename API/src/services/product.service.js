const { Product, StockLevel, Warehouse } = require("../models");

/**
 * Get all products with pagination and filtering (Legacy Logic)
 */
async function getAllProducts({
  page = 1,
  limit = 50,
  search,
  categoryId,
  isActive,
  brand,
}) {
  const query = { isDeleted: { $ne: true } };

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

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("categoryIds", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get product by ID
 */
async function getProductById(id) {
  return Product.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate("categoryIds", "name slug");
}

/**
 * Get product by slug
 */
async function getProductBySlug(slug) {
  return Product.findOne({ slug, isDeleted: { $ne: true } })
    .populate("categoryIds", "name slug");
}

/**
 * Search products (Regex-based search like Legacy)
 */
async function searchProducts(q) {
  return Product.find({
    name: { $regex: q, $options: "i" },
    isDeleted: { $ne: true },
  })
    .limit(50)
    .populate("categoryIds", "name slug")
    .sort({ createdAt: -1 });
}

/**
 * Get product statistics
 */
async function getProductStats() {
  const total = await Product.countDocuments({ isDeleted: { $ne: true } });
  const active = await Product.countDocuments({
    isActive: true,
    isDeleted: { $ne: true },
  });

  return {
    total,
    active,
    inactive: total - active,
  };
}

/**
 * Create a new product (Legacy Logic with StockLevel init)
 */
async function createProduct(data, userRoles, userId) {
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
  } = data;

  // Check if SKU exists
  const existingSKU = await Product.findOne({
    sku: sku.toUpperCase(),
    isDeleted: { $ne: true },
  });
  if (existingSKU) {
    const error = new Error("Mã SKU đã tồn tại");
    error.status = 400;
    throw error;
  }

  // Check if Slug exists
  const existingSlug = await Product.findOne({
    slug,
    isDeleted: { $ne: true },
  });
  if (existingSlug) {
    const error = new Error("Slug đã tồn tại");
    error.status = 400;
    throw error;
  }

  const product = new Product({
    name,
    slug,
    description,
    brand,
    categoryIds,
    images: images || [],
    isActive: isActive !== false,
    price,
    stock,
    sku: sku.toUpperCase(),
    compareAtPrice,
    createdBy: userId,
  });

  await product.save();

  // Legacy StockLevel Initialization
  try {
    const warehouse = await Warehouse.findOne();
    if (warehouse && stock > 0) {
      await StockLevel.findOneAndUpdate(
        { productId: product._id, warehouseId: warehouse._id },
        {
          $setOnInsert: {
            quantity: stock,
            reservedQuantity: 0,
            availableQuantity: stock,
          },
        },
        { upsert: true }
      );
    }
  } catch (slErr) {
    console.warn("[Product] Could not init StockLevel (non-fatal):", slErr.message);
  }

  return product.populate("categoryIds", "name slug");
}

/**
 * Update a product
 */
async function updateProduct(id, data, userRoles) {
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
  } = data;

  const product = await Product.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });
  if (!product) {
    const error = new Error("Không tìm thấy sản phẩm");
    error.status = 404;
    throw error;
  }

  // Validations
  if (sku !== undefined) {
    const existingSKU = await Product.findOne({
      sku: sku.toUpperCase(),
      isDeleted: { $ne: true },
      _id: { $ne: id },
    });
    if (existingSKU) {
      const error = new Error("Mã SKU đã tồn tại");
      error.status = 400;
      throw error;
    }
  }

  if (slug && slug !== product.slug) {
    const existingProduct = await Product.findOne({
      slug,
      isDeleted: { $ne: true },
      _id: { $ne: id },
    });
    if (existingProduct) {
      const error = new Error("Slug đã tồn tại");
      error.status = 400;
      throw error;
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
  return product.populate("categoryIds", "name slug");
}

/**
 * Delete a product
 */
async function deleteProduct(id) {
  const product = await Product.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });
  if (!product) {
    const error = new Error("Không tìm thấy sản phẩm");
    error.status = 404;
    throw error;
  }

  product.isDeleted = true;
  product.deletedAt = new Date();
  await product.save();
  return product;
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  searchProducts,
  getProductStats,
  createProduct,
  updateProduct,
  deleteProduct,
};
