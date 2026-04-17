// Core models
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Post = require("./Post");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Booking = require("./Booking");
const Service = require("./Service");
const CareAppointment = Booking;

// Auth models
const EmailVerificationOtp = require("./EmailVerificationOtp");
const PasswordResetOtp = require("./PasswordResetOtp");
const Session = require("./Session");

// Order models
const Payment = require("./Payment");

// Product models
const Cart = require("./Cart");
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
  OrderItem,
  Booking,
  Service,
  CareAppointment,
  // Auth
  EmailVerificationOtp,
  PasswordResetOtp,
  Session,
  // Order
  Payment,
  // Product
  Cart,
  ProductVariation,
  StockLevel,
  StockMovement,
};
