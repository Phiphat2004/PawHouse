const { Cart, CartItem, Product } = require("../../models");

async function recalculateCart(cart) {
  await cart.populate({
    path: "items",
    populate: { path: "product_id", select: "price compareAtPrice" },
  });

  let original = 0;
  let total = 0;
  for (const item of cart.items) {
    const price = item.product_id?.price || 0;
    const compareAt = item.product_id?.compareAtPrice || price;
    original += compareAt * item.quantity;
    total += price * item.quantity;
  }

  cart.original_price = original;
  cart.total_price = total;
  await cart.save();
}

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id }).populate({
      path: "items",
      populate: {
        path: "product_id",
        select: "name price compareAtPrice images slug stock",
      },
    });

    if (!cart) {
      return res.json({ message: "Cart is empty", cart: null, items: [] });
    }

    return res.json({ message: "OK", cart, items: cart.items });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res
        .status(400)
        .json({ message: "quantity must be a positive integer" });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productStock = Number(product.stock) || 0;

    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user_id: req.user._id, items: [] });
    }

    await cart.populate("items");

    const existingItem = cart.items.find(
      (i) => i.product_id.toString() === product_id.toString(),
    );

    if (existingItem) {
      const requestedQty = existingItem.quantity + qty;
      if (requestedQty > productStock) {
        return res.status(400).json({
          message: `Chỉ còn ${productStock} sản phẩm trong kho`,
          stock: productStock,
          requested: requestedQty,
        });
      }

      existingItem.quantity += qty;
      await existingItem.save();
    } else {
      if (qty > productStock) {
        return res.status(400).json({
          message: `Chỉ còn ${productStock} sản phẩm trong kho`,
          stock: productStock,
          requested: qty,
        });
      }

      const newItem = await CartItem.create({
        cart_id: cart._id,
        product_id,
        quantity: qty,
      });
      cart.items.push(newItem._id);
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "product_id",
        select: "name price compareAtPrice images slug stock",
      },
    });

    await recalculateCart(cart);

    return res.json({ message: "Đã thêm vào giỏ hàng thành công!", cart });
  } catch (err) {
    next(err);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (!cart.items.map(String).includes(itemId)) {
      return res
        .status(403)
        .json({ message: "Item does not belong to your cart" });
    }

    const item = await CartItem.findById(itemId);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    const product = await Product.findById(item.product_id).select("stock");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const productStock = Number(product.stock) || 0;
    if (qty > productStock) {
      return res.status(400).json({
        message: `Chỉ còn ${productStock} sản phẩm trong kho`,
        stock: productStock,
        requested: qty,
      });
    }

    item.quantity = qty;
    await item.save();

    await recalculateCart(cart);

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "product_id",
        select: "name price compareAtPrice images slug stock",
      },
    });

    return res.json({ message: "Quantity updated", cart: updatedCart });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id)
      return res.status(400).json({ message: "product_id is required" });

    const cart = await Cart.findOne({ user_id: req.user._id }).populate(
      "items",
    );
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.product_id.toString() === product_id.toString(),
    );
    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });

    await CartItem.findByIdAndDelete(item._id);

    cart.items = cart.items.filter(
      (i) => i._id.toString() !== item._id.toString(),
    );
    await cart.save();

    await recalculateCart(cart);

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items",
      populate: {
        path: "product_id",
        select: "name price compareAtPrice images slug stock",
      },
    });

    return res.json({ message: "Item removed from cart", cart: updatedCart });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.json({ message: "Cart already empty" });

    await CartItem.deleteMany({ cart_id: cart._id });

    cart.items = [];
    cart.original_price = 0;
    cart.total_price = 0;
    await cart.save();

    return res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
};
