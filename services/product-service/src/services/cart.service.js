const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

exports.addToCart = async (userId, productId, quantity) => {
    console.log('[CART] addToCart called:', { userId, productId, quantity });
    
    let cart = await Cart.findOne({ user_id: userId });
    if (cart) { 
        const listCart = await CartItem.find({ cart_id: cart._id });
        if (listCart.length == 5) { 
            return 0;
        }
    }
  
    // Check product
    const product = await Product.findOne({
        _id: productId,
        isActive: true
    });
    console.log('[CART] Product found:', product);
    if (!product) throw new Error("Product not found or inactive");
    
    // Check stock
    if (product.stock < quantity) {
        throw new Error(`Not enough stock. Only ${product.stock} left`);
    }
    
    // Check cart exists or not
    if (!cart) {
        cart = await Cart.create({ user_id: userId });
    }

    // If cart exists 
    let cartItem = await CartItem.findOne({ cart_id: cart._id, product_id: productId });

    if (cartItem) {
        if (product.stock < cartItem.quantity + quantity) {
            throw new Error(`Not enough stock. Only ${product.stock} left`);
        }
        cartItem.quantity += quantity;
        await cartItem.save();
    } else {
        cartItem = await CartItem.create({
            cart_id: cart._id,
            product_id: productId,
            quantity
        });
        // Add cartItem to cart's items array
        cart.items.push(cartItem._id);
        await cart.save();
    }
    
    // Populate cart
    const populateCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'product_id' }
    });
    return populateCart;
};

exports.getCartsByUser = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId }).populate({
        path: 'items',
        populate: { path: 'product_id' }
    });
    
    // If cart exists but items array is empty, check if CartItems exist and sync
    if (cart && (!cart.items || cart.items.length === 0)) {
        const existingItems = await CartItem.find({ cart_id: cart._id });
        if (existingItems.length > 0) {
            // Sync the items array with existing CartItems
            cart.items = existingItems.map(item => item._id);
            await cart.save();
            // Re-populate after syncing
            await cart.populate({
                path: 'items',
                populate: { path: 'product_id' }
            });
        }
    }
    
    return cart;
};

exports.editCartItemQuantity = async (userId, itemId, newQuantity) => {
    // Check cart exists
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found!!");
    
    // Find cartItem
    const cartItem = await CartItem.findOne({ _id: itemId, cart_id: cart._id });
    if (!cartItem) throw new Error("Cart item not found!");
    
    const product = await Product.findById(cartItem.product_id);
    if (!product) throw new Error("Product not found!");
    
    if (newQuantity > product.stock) {
        throw new Error(`Not enough stock. Only ${product.stock} left`);
    }
    
    // If newQuantity <= 0 then delete
    if (newQuantity <= 0) {
        await CartItem.deleteOne({ _id: itemId });
        // Remove cartItem from cart's items array
        cart.items = cart.items.filter(itemId => itemId.toString() !== cartItem._id.toString());
        await cart.save();
    } else {
        cartItem.quantity = newQuantity;
        await cartItem.save();
    }

    // Populate
    const updatedCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'product_id' }
    });

    return updatedCart;
};

exports.removeItem = async (userId, productId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error("Cart not found!!!");
    }
    const deleted = await CartItem.findOneAndDelete({ cart_id: cart._id, product_id: productId });
    if (!deleted) {
        throw new Error("Cart item not found!");
    }
    // Remove cartItem from cart's items array
    cart.items = cart.items.filter(itemId => itemId.toString() !== deleted._id.toString());
    await cart.save();

    return;
};

exports.clearAllCart = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error("Cart not found!!!");
    }
    await CartItem.deleteMany({ cart_id: cart._id });
    cart.items = [];
    cart.original_price = 0;
    cart.total_price = 0;
    await cart.save();
    return cart;
};
