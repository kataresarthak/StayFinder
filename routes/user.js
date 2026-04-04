const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const usersController = require("../controllers/users.js");

router
  .route("/signup")
  .get(usersController.renderSignupForm)
  .post(wrapAsync(usersController.signup));

router
  .route("/login")
  .get(usersController.renderLoginForm)
  .post(saveRedirectUrl, wrapAsync(usersController.login));

router
  .route("/verify-email")
  .get(usersController.renderVerifyForm)
  .post(wrapAsync(usersController.verifyEmail));

router.post(
  "/verify-email/resend",
  wrapAsync(usersController.resendVerificationOtp),
);

router.get("/logout", usersController.logout);

module.exports = router;
