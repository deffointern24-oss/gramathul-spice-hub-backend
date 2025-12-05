const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
        }
    ],

    amount: {
        type: Number,
        required: true
    },

    // Razorpay fields
    razorpay_order_id: {
        type: String,
        required: true
    },
    razorpay_payment_id: {
        type: String
    },
    razorpay_signature: {
        type: String
    },

    status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING"
    }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
