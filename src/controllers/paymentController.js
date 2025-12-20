const instance = require("../config/razorpay");
const Order = require("../models/Order");
const User = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");
const dotenv = require("dotenv");
const Product = require("../models/Product");
dotenv.config();

const createOrder = async (req, res) => {
  try {
    console.log("🚀 Creating order with data:", req.body);
    const { items, address, paymentMethod, discount: clientDiscount } = req.body;

    const userId = req.user.id;

    // Basic validation
    if (!userId || !items?.length) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Get user (optional: you can skip address from user if you fully trust `address` from client)
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }


    // Calculate order values
    let item_price = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.id} not found` });
      }

      if (!product.inStock) {
        return res
          .status(400)
          .json({ message: `Product ${product.name} is out of stock` });
      }

      item_price += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
      });
    }

    // Shipping
    const shipping = 100;

    // Discount: you can either trust clientDiscount or recompute based on a promoCode
    const discount = Number(clientDiscount) || 0;

    // Total
    const total = item_price + shipping - discount;

    console.log("💰 Calculated values:", { item_price, shipping, discount, total });

    // Create Order document first (common for COD & ONLINE)
    const order = await Order.create({
      userId,
      items: orderItems,
      item_price,
      shipping,
      discount,
      tax: 0,
      deliveryAddress: address,
      paymentMethod: paymentMethod === "cod" ? "COD" : "ONLINE",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Pending",
      orderStatus: paymentMethod === "cod" ? "Pending" : "Pending",
      // Optionally store totals
      totalAmount: total,
    });

    // COD FLOW: no Razorpay order, return order only
    if (paymentMethod === "cod") {
      console.log("✅ COD order created:", order._id);
      return res.status(201).json({
        success: true,
        order,
        razorpayOrder: null,
      });
    }

    // ONLINE FLOW: create Razorpay order
    const razorpayOrder = await instance.orders.create({
      amount: Math.round(total * 100), // in paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
      notes: {
        userId,
        orderId: order._id.toString(),
      },
    });

    // Create Payment record
    await Payment.create({
      userId,
      orderId: order._id,
      products: orderItems,
      amount: total,
      razorpay_order_id: razorpayOrder.id,
      status: "PENDING",
    });

    console.log("✅ Order created successfully:", order._id);
    console.log("✅ Razorpay order ID:", razorpayOrder.id);

    return res.status(201).json({
      success: true,
      razorpayOrder,
      order,
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    return res.status(500).json({
      error: "Failed to create order",
      message: error.message,
    });
  }
};


const paymentVerification = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Basic validation
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid payment verification data" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    // Signature mismatch
    if (expectedSign !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpay_order_id },
        { status: "FAILED" }
      );

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "Failed",
          orderStatus: "Cancelled",
        });
      }

      return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    // Signature OK → update payment doc
    const paymentInfo = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "SUCCESS",
      },
      { new: true }
    );

    if (!paymentInfo && !orderId) {
      return res.status(404).json({
        success: false,
        error: "Payment record not found",
      });
    }

    const finalOrderId = orderId || paymentInfo.orderId;

    // Update order status
    if (finalOrderId) {
      await Order.findByIdAndUpdate(finalOrderId, {
        paymentStatus: "Completed",
        orderStatus: "Confirmed",
      });
    }

    return res.status(200).json({
      success: true,
      orderId: finalOrderId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Payment verification failed",
      message: error.message,
    });
  }
};

module.exports = {
    createOrder,
    paymentVerification
};