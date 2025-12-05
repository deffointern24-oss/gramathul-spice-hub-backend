const instance = require("../config/razorpay");
const Order = require("../models/Order");
const user = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");
const dotenv = require("dotenv");
const Product = require("../models/Product");
dotenv.config();


const createOrder = async (req, res) => {
    try {
        console.log("🚀 Creating order with data:", req.body);
        const { items, promoCode } = req.body;

        console.log('Received items:', items);
        console.log('Received promoCode:', promoCode);

        const userId = req.user.id;

        // Validate input
        if (!userId || !items?.length) {
            return res.status(400).json({ error: "Invalid order data" });
        }

        // Get user and delivery address
        const userDoc = await user.findById(userId);
        if (!userDoc) {
            return res.status(404).json({ error: "User not found" });
        }

        const deliveryAddress = userDoc.address;
        if (!deliveryAddress) {
            return res.status(400).json({ error: "Delivery address required" });
        }

        // Calculate order values
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.id);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.id} not found` });
            }

            if (!product.inStock) {
                return res.status(400).json({ message: `Product ${product.name} is out of stock` });
            }

            subtotal += product.price * item.quantity;
            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
            });
        }

        // Calculate shipping
        const shipping = subtotal > 500 ? 0 : 50;

        // Calculate discount (validate promo code)
        let discount = 0;
        if (promoCode && promoCode.toLowerCase() === 'welcome10') {
            discount = Math.round(subtotal * 0.1);
        }

        // Total amount
        const total = subtotal + shipping - discount;

        console.log('💰 Calculated values:', { subtotal, shipping, discount, total });

        // ✅ FIX: Use 'total' instead of undefined 'amount'
        // Create Razorpay order
        const razorpayOrder = await instance.orders.create({
            amount: Math.round(total * 100), // ✅ Changed from 'amount' to 'total'
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId,
                promoCode: promoCode || 'none'
            }
        });

        // Create Order Document
        const order = await Order.create({
            userId,
            items: orderItems,
            subtotal: subtotal, // ✅ Changed from 'amount' to 'subtotal'
            shipping: shipping,
            discount: discount,
            tax: 0,
            deliveryAddress,
            paymentMethod: "ONLINE",
            paymentStatus: "Pending",
            orderStatus: "Pending"
        });

        // Create Payment Record
        await Payment.create({
            userId,
            orderId: order._id,
            products: orderItems, // ✅ Use orderItems instead of formattedItems
            amount: total, // ✅ Changed from 'amount' to 'total'
            razorpay_order_id: razorpayOrder.id,
            status: "PENDING"
        });

        console.log('✅ Order created successfully:', order._id);
        console.log('✅ Razorpay order ID:', razorpayOrder.id);

        return res.status(201).json({
            success: true,
            razorpayOrder,
            order
        });

    } catch (error) {
        console.error("❌ Order creation error:", error);
        return res.status(500).json({ 
            error: "Failed to create order",
            message: error.message 
        });
    }
};


const paymentVerification = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (expectedSign !== razorpay_signature) {
            await Payment.findOneAndUpdate(
                { razorpay_order_id },
                { status: "FAILED" }
            );
            return res.status(400).json({ error: "Invalid signature" });
        }

        const paymentInfo = await Payment.findOneAndUpdate(
            { razorpay_order_id },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: "SUCCESS"
            },
            { new: true }
        );

        await Order.findByIdAndUpdate(paymentInfo.orderId, {
            paymentStatus: "Completed",
            orderStatus: "Confirmed"
        });
        return res.status(200).json({
            success: true,
            orderId: paymentInfo.orderId
        });


    } catch (error) {
        console.error("Payment verification error:", error);
        return res.redirect(`${process.env.FRONTEND_URL}/failed`);
    }
};

module.exports = {
    createOrder,
    paymentVerification
};