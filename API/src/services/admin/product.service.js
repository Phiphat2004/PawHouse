const mongoose = require("mongoose");
const { Product, StockLevel, Category } = require("../../models");

const DEFAULT_WAREHOUSE_ID = new mongoose.Types.ObjectId(
  "000000000000000000000001",
);
const DEFAULT_WAREHOUSE = {
  name: "Kho Cần Thơ",
  code: "WH001",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  },
  isActive: true,
};

/**
 * Get total stock quantity for a product from all warehouses
 */
async function getProductStock(productId) {
  const stockLevels = await StockLevel.find({ productId });
  return stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
}

/**
 * Enrich product with stock data from StockLevel
 */
async function enrichProductWithStock(product) {
  if (!product) return product;
  const stock = await getProductStock(product._id);
  const productObj = product.toObject ? product.toObject() : product;
  return { ...productObj, stock };
}

/**
 * Enrich multiple products with stock data
 */
async function enrichProductsWithStock(products) {
  const enriched = await Promise.all(
    products.map((p) => enrichProductWithStock(p)),
  );
  return enriched;
}

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
    const childCategories = await Category.find({ parentCategory: categoryId })
      .select("_id")
      .lean();
    const allIds = [categoryId, ...childCategories.map((c) => c._id)];
    query.categoryIds = { $in: allIds };
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

  const enrichedProducts = await enrichProductsWithStock(products);

  return {
    products: enrichedProducts,
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
  const product = await Product.findOne({
    _id: id,
    isDeleted: { $ne: true },
  }).populate("categoryIds", "name slug");
  return enrichProductWithStock(product);
}

/**
 * Get product by slug
 */
async function getProductBySlug(slug) {
  const product = await Product.findOne({
    slug,
    isDeleted: { $ne: true },
  }).populate("categoryIds", "name slug");
  return enrichProductWithStock(product);
}

/**
 * Search products (Regex-based search like Legacy)
 */
async function searchProducts(q) {
  const products = await Product.find({
    name: { $regex: q, $options: "i" },
    isDeleted: { $ne: true },
  })
    .limit(50)
    .populate("categoryIds", "name slug")
    .sort({ createdAt: -1 });
  return enrichProductsWithStock(products);
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

  const normalizedPrice = Number(price);
  const normalizedStock = Number(stock);
  // compareAtPrice=0 means "no discount" (will be saved as undefined)
  const rawCompareAt =
    compareAtPrice === undefined ||
    compareAtPrice === null ||
    compareAtPrice === ""
      ? undefined
      : Number(compareAtPrice);
  const normalizedCompareAtPrice =
    rawCompareAt === 0 ? undefined : rawCompareAt;

  if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
    const error = new Error("Invalid product price");
    error.status = 400;
    throw error;
  }

  if (Number.isNaN(normalizedStock) || normalizedStock < 0) {
    const error = new Error("Invalid stock quantity");
    error.status = 400;
    throw error;
  }

  if (
    normalizedCompareAtPrice !== undefined &&
    (Number.isNaN(normalizedCompareAtPrice) ||
      normalizedCompareAtPrice <= normalizedPrice)
  ) {
    const error = new Error("Compare price must be greater than sale price");
    error.status = 400;
    throw error;
  }

  // Check if SKU exists
  const existingSKU = await Product.findOne({
    sku: sku.toUpperCase(),
    isDeleted: { $ne: true },
  });
  if (existingSKU) {
    const error = new Error("SKU already exists");
    error.status = 400;
    throw error;
  }

  // Check if Slug exists
  const existingSlug = await Product.findOne({
    slug,
    isDeleted: { $ne: true },
  });
  if (existingSlug) {
    const error = new Error("Slug already exists");
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
    price: normalizedPrice,
    sku: sku.toUpperCase(),
    compareAtPrice: normalizedCompareAtPrice,
    createdBy: userId,
  });

  await product.save();

  // Initialize StockLevel with initial stock quantity
  try {
    if (normalizedStock > 0) {
      await StockLevel.findOneAndUpdate(
        { productId: product._id, warehouseId: DEFAULT_WAREHOUSE_ID },
        {
          $setOnInsert: {
            quantity: normalizedStock,
            reservedQuantity: 0,
            availableQuantity: normalizedStock,
            warehouse: DEFAULT_WAREHOUSE,
          },
        },
        { upsert: true },
      );
    } else {
      // Create StockLevel with 0 quantity if no initial stock
      await StockLevel.findOneAndUpdate(
        { productId: product._id, warehouseId: DEFAULT_WAREHOUSE_ID },
        {
          $setOnInsert: {
            quantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouse: DEFAULT_WAREHOUSE,
          },
        },
        { upsert: true },
      );
    }
  } catch (slErr) {
    console.warn(
      "[Product] Could not init StockLevel (non-fatal):",
      slErr.message,
    );
  }

  await product.populate("categoryIds", "name slug");
  return enrichProductWithStock(product);
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
    const error = new Error("Product not found");
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
      const error = new Error("SKU already exists");
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
      const error = new Error("Slug already exists");
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
  const normalizedPrice = price !== undefined ? Number(price) : undefined;
  const normalizedStock = stock !== undefined ? Number(stock) : undefined;
  // compareAtPrice=0 means "remove discount" (will be saved as undefined)
  const rawCompareAt =
    compareAtPrice === undefined ||
    compareAtPrice === null ||
    compareAtPrice === ""
      ? undefined
      : Number(compareAtPrice);
  const normalizedCompareAtPrice = rawCompareAt === 0 ? null : rawCompareAt;

  if (
    normalizedPrice !== undefined &&
    (Number.isNaN(normalizedPrice) || normalizedPrice < 0)
  ) {
    const error = new Error("Invalid product price");
    error.status = 400;
    throw error;
  }

  if (
    normalizedStock !== undefined &&
    (Number.isNaN(normalizedStock) || normalizedStock < 0)
  ) {
    const error = new Error("Invalid stock quantity");
    error.status = 400;
    throw error;
  }

  const finalPrice =
    normalizedPrice !== undefined ? normalizedPrice : Number(product.price);
  if (
    normalizedCompareAtPrice !== undefined &&
    normalizedCompareAtPrice !== null &&
    (Number.isNaN(normalizedCompareAtPrice) ||
      normalizedCompareAtPrice <= finalPrice)
  ) {
    const error = new Error("Compare price must be greater than sale price");
    error.status = 400;
    throw error;
  }

  if (normalizedPrice !== undefined) product.price = normalizedPrice;
  if (sku !== undefined) product.sku = sku.toUpperCase();
  // null means "remove discount", undefined means "unchanged"
  if (compareAtPrice !== undefined)
    product.compareAtPrice =
      normalizedCompareAtPrice === null ? undefined : normalizedCompareAtPrice;

  await product.save();

  // Update StockLevel if stock is provided
  if (normalizedStock !== undefined) {
    try {
      const existingLevel = await StockLevel.findOne({
        productId: id,
        warehouseId: DEFAULT_WAREHOUSE_ID,
      });
      const reservedQty = existingLevel?.reservedQuantity || 0;
      await StockLevel.findOneAndUpdate(
        { productId: id, warehouseId: DEFAULT_WAREHOUSE_ID },
        {
          $set: {
            quantity: normalizedStock,
            availableQuantity: Math.max(0, normalizedStock - reservedQty),
          },
        },
        { upsert: true },
      );
    } catch (slErr) {
      console.warn(
        "[Product] Could not update StockLevel (non-fatal):",
        slErr.message,
      );
    }
  }

  await product.populate("categoryIds", "name slug");
  return enrichProductWithStock(product);
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
    const error = new Error("Product not found");
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
  getProductStock,
  enrichProductWithStock,
  enrichProductsWithStock,
};
