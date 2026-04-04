const User = require("../models/user.js");
const crypto = require("crypto");
const { Resend } = require("resend");
const { setAuthCookie, clearAuthCookie } = require("../utils/jwtAuth.js");

const OTP_TTL_MS = 10 * 60 * 1000;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const authenticateUser = (username, password) =>
  new Promise((resolve, reject) => {
    User.authenticate()(username, password, (err, user) => {
      if (err) return reject(err);
      resolve(user || null);
    });
  });

const sendVerificationEmail = async (email, otp) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: "StayFinder Email Verification OTP",
    html: `
      <p>Your StayFinder verification code is:</p>
      <h2 style="letter-spacing: 3px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};

const createAndSendOtp = async (user) => {
  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  await sendVerificationEmail(user.email, otp);
};

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.renderVerifyForm = (req, res) => {
  const email = req.query.email || "";
  res.render("users/verify.ejs", { email });
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUserWithEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUserWithEmail) {
      req.flash("error", "This email is already registered. Please log in.");
      return res.redirect("/signup");
    }

    const newUser = new User({ email: normalizedEmail, username });
    const registeredUser = await User.register(newUser, password);

    try {
      await createAndSendOtp(registeredUser);
      req.flash(
        "success",
        "Account created! We sent an OTP to your email for verification.",
      );
    } catch (otpErr) {
      console.error("Failed to send signup OTP:", otpErr);
      req.flash(
        "error",
        "Account created, but OTP email could not be sent. Use resend on the verification page.",
      );
    }

    res.redirect(
      `/verify-email?email=${encodeURIComponent(registeredUser.email)}`,
    );
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await authenticateUser(username, password);

  if (!user) {
    req.flash("error", "Invalid username or password.");
    return res.redirect("/login");
  }

  if (user.isEmailVerified === false) {
    const unverifiedEmail = user.email;

    try {
      await createAndSendOtp(user);
      req.flash(
        "error",
        "Please verify your email first. A new OTP has been sent.",
      );
    } catch (otpErr) {
      console.error("Failed to send login OTP:", otpErr);
      req.flash(
        "error",
        "Please verify your email first. We could not send OTP right now, try resend.",
      );
    }

    clearAuthCookie(res);
    return res.redirect(
      `/verify-email?email=${encodeURIComponent(unverifiedEmail)}`,
    );
  }

  setAuthCookie(res, user);
  req.flash("success", "Welcome back to StayFinder!");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  res.redirect(redirectUrl);
};

module.exports.verifyEmail = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const otp = (req.body.otp || "").trim();

  if (!email || !otp) {
    req.flash("error", "Email and OTP are required.");
    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "No account found for this email.");
    return res.redirect("/signup");
  }

  if (user.isEmailVerified) {
    req.flash("success", "Email already verified. Please log in.");
    return res.redirect("/login");
  }

  if (
    !user.emailOtpHash ||
    !user.emailOtpExpires ||
    user.emailOtpExpires < new Date()
  ) {
    req.flash("error", "OTP expired. Please request a new OTP.");
    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  if (hashOtp(otp) !== user.emailOtpHash) {
    req.flash("error", "Invalid OTP. Please try again.");
    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  user.isEmailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  await user.save();

  setAuthCookie(res, user);
  req.flash("success", "Email verified successfully. Welcome to StayFinder!");
  const redirectUrl = req.session.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  res.redirect(redirectUrl);
};

module.exports.resendVerificationOtp = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();

  if (!email) {
    req.flash("error", "Email is required to resend OTP.");
    return res.redirect("/verify-email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "No account found for this email.");
    return res.redirect("/signup");
  }

  if (user.isEmailVerified) {
    req.flash("success", "Email already verified. Please log in.");
    return res.redirect("/login");
  }

  try {
    await createAndSendOtp(user);
    req.flash("success", "A new OTP has been sent to your email.");
  } catch (otpErr) {
    console.error("Failed to resend OTP:", otpErr);
    req.flash(
      "error",
      "Unable to send OTP right now. Please try again shortly.",
    );
  }

  res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
};

module.exports.logout = (req, res) => {
  clearAuthCookie(res);
  req.flash("success", "You are logged out!");
  res.redirect("/");
};
