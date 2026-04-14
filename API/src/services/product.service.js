const { Product } = require("../models");

/**
 * Create a new product
 * @param {Object} data - Product data
 * @param {Array} userRoles - User roles for authorization
 * @param {string} userId - ID of the user creating the product
 * @returns {Promise<Object>} - Created product
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

  // Check if user is admin
  if (!userRoles?.includes("admin")) {
    const error = new Error("Không có quyền thực hiện");
    error.status = 403;
    throw error;
  }

  // Validation
  if (!price || price <= 0) {
    const error = new Error("Giá sản phẩm phải lớn hơn 0");
    error.status = 400;
    throw error;
  }
  if (stock === undefined || stock < 0) {
    const error = new Error("Số lượng tồn kho không được âm");
    error.status = 400;
    throw error;
  }
  if (!sku || !sku.trim()) {
    const error = new Error("Mã SKU không được để trống");
    error.status = 400;
    throw error;
  }
  if (compareAtPrice && compareAtPrice <= price) {
    const error = new Error("Giá so sánh phải lớn hơn giá bán");
    error.status = 400;
    throw error;
  }

  // Check if SKU already exists
  const existingSKU = await Product.findOne({
    sku: sku.toUpperCase(),
    isDeleted: { $ne: true },
  });
  if (existingSKU) {
    const error = new Error("Mã SKU đã tồn tại");
    error.status = 400;
    throw error;
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
    createdBy: userId,
  });

  await product.save();

  // Try to initialize StockLevel if models are available (matches legacy behavior)
  try {
    const { Warehouse, StockLevel } = require("../models");
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
    console.warn('[Product Service] Could not init StockLevel (non-fatal):', slErr.message);
  }

  return product.populate("categoryIds", "name slug");
}

/**
 * Get all products with pagination and filtering
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
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } }
    ];
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

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
};
