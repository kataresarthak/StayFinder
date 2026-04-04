const Razorpay = require("razorpay");
const Listing = require("../models/listing");

const getRazorpayInstance = () => {
  const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

  if (!RAZORPAY_ID_KEY || !RAZORPAY_SECRET_KEY) {
    return null;
  }

  return new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
  });
};

module.exports.createOrder = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        msg: "Razorpay keys are missing. Please set RAZORPAY_ID_KEY and RAZORPAY_SECRET_KEY in .env",
      });
    }

    const { RAZORPAY_ID_KEY } = process.env;
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, msg: "Listing not found" });
    }

    const amount = Math.round(Number(listing.price) * 100);

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid listing amount" });
    }

    const shortListingId = String(listingId).slice(-8);
    const shortTs = Date.now().toString(36);

    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${shortListingId}_${shortTs}`,
      notes: {
        listingId: String(listingId),
        userId: String(req.user._id),
      },
    };

    const order = await razorpayInstance.orders.create(options);

    return res.status(200).json({
      success: true,
      msg: "Order created",
      order_id: order.id,
      amount,
      key_id: RAZORPAY_ID_KEY,
      product_name: listing.title,
      description: listing.description,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Internal Server Error" });
  }
};

module.exports.capturePayment = async (req, res) => {
  const { paymentId, amount, listingId } = req.body;

  if (!paymentId || !amount || !listingId) {
    return res.status(400).json({
      success: false,
      msg: "paymentId, amount and listingId are required",
    });
  }

  try {
    const razorpayInstance = getRazorpayInstance();

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        msg: "Razorpay keys are missing. Please set RAZORPAY_ID_KEY and RAZORPAY_SECRET_KEY in .env",
      });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, msg: "Listing not found" });
    }

    const paymentDetails = await razorpayInstance.payments.fetch(paymentId);

    if (paymentDetails.status !== "captured") {
      await razorpayInstance.payments.capture(paymentId, Number(amount));
    }

    req.flash("success", "Payment successful! Booking confirmed.");

    return res.status(200).json({
      success: true,
      msg: "Payment captured successfully",
      redirectUrl: `/listings/${listingId}`,
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({
      success: false,
      msg: error.message || "Payment capture failed",
    });
  }
};
