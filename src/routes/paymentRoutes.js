const express = require("express");
const { createOrder, paymentVerification } = require("../controllers/paymentController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();


router.post("/create-order", authenticate, authorize(['USER']), createOrder);
router.post("/payment-verification", paymentVerification);

module.exports = router;