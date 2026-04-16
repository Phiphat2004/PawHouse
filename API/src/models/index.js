// Core models
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Post = require("./Post");
const Order = require("./Order");
const CareAppointment = require("./CareAppointment");

// Auth models
const EmailVerificationOtp = require("./EmailVerificationOtp");
const PasswordResetOtp = require("./PasswordResetOtp");
const Session = require("./Session");

// Order models
const DeliveryZone = require("./DeliveryZone");
const Invoice = require("./Invoice");
const Payment = require("./Payment");

// Post models
const Tag = require("./Tag");

// Product models
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const ProductVariation = require("./ProductVariation");
const StockLevel = require("./StockLevel");
const StockMovement = require("./StockMovement");

module.exports = {
  // Core
  User,
  Product,
  Category,
  Post,
  Order,
  CareAppointment,
  // Auth
  EmailVerificationOtp,
  PasswordResetOtp,
  Session,
  // Order
  DeliveryZone,
  Invoice,
  Payment,
  // Post
  Tag,
  // Product
  Cart,
  CartItem,
  ProductVariation,
  StockLevel,
  StockMovement,
};
