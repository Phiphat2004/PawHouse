const cartService = require('../services/cart.service');

exports.addToCart = async (req, res, next) => {
    try {
        console.log('[CART CONTROLLER] req.user:', req.user);
        console.log('[CART CONTROLLER] req.body:', req.body);
        
        const userId = req.user._id;
        const { product_id, quantity } = req.body;
        const cart = await cartService.addToCart(userId, product_id, quantity);
        if (cart == 0) {
            return res.status(400).json({ code: 0, message: 'Giỏ hàng đã đầy (tối đa 5 sản phẩm)' });
        }
        res.status(200).json({
            status: 'success',
            message: 'Add product to cart successfully',
            data: cart
        });
    } catch (error) {
        console.error('[CART CONTROLLER ERROR]:', error);
        next(error);
    }
};

exports.getCartsByUser = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const cartsList = await cartService.getCartsByUser(userId);
        res.status(200).json({
            status: 'success',
            message: 'Get cart successfully',
            data: cartsList
        });
    } catch (error) {
        next(error);
    }
};

exports.editCartItemQuantity = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const itemId = req.params.itemId;
        const { quantity } = req.body;
        const cartIsUpdated = await cartService.editCartItemQuantity(
            userId,
            itemId,
            quantity
        );
        res.status(200).json({
            status: 'success',
            message: 'Update quantity successfully',
            data: cartIsUpdated
        });
    } catch (error) {
        next(error);
    }
};

exports.removeItem = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { product_id } = req.body;
        const deleted = await cartService.removeItem(user_id, product_id);
        res.status(200).json({
            status: 'success',
            message: 'Remove item successfully',
            data: deleted
        });
    } catch (error) {
        next(error);
    }
};

exports.clearAllCart = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const cartClear = await cartService.clearAllCart(user_id);
        res.status(200).json({
            status: 'success',
            message: 'Clear all cart successfully',
            data: cartClear
        });
    } catch (error) {
        next(error);
    }
};
