const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isLoggedIn } = require("../middleware.js");

router.post("/createOrder/:id", isLoggedIn, paymentController.createOrder);
router.post("/capturePayment", isLoggedIn, paymentController.capturePayment);

module.exports = router;
