const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.SECRET || "thisshouldbeabettersecret!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const AUTH_COOKIE_NAME = "token";
const DEFAULT_AUTH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getExpiresInMs = (expiresIn) => {
  if (
    typeof expiresIn === "number" &&
    Number.isFinite(expiresIn) &&
    expiresIn > 0
  ) {
    return expiresIn * 1000;
  }

  if (typeof expiresIn !== "string") {
    return DEFAULT_AUTH_MAX_AGE_MS;
  }

  const trimmed = expiresIn.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    return DEFAULT_AUTH_MAX_AGE_MS;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factors = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * factors[unit];
};

const AUTH_COOKIE_MAX_AGE_MS = getExpiresInMs(JWT_EXPIRES_IN);

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies ? req.cookies[AUTH_COOKIE_NAME] : null;
  if (cookieToken) return cookieToken;

  const authHeader = req.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const signAuthToken = (user) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const setAuthCookie = (res, user) => {
  const token = signAuthToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

const attachCurrentUser = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;

    if (!user) {
      clearAuthCookie(res);
    }

    return next();
  } catch (err) {
    clearAuthCookie(res);
    req.user = null;
    return next();
  }
};

module.exports = {
  AUTH_COOKIE_MAX_AGE_MS,
  setAuthCookie,
  clearAuthCookie,
  attachCurrentUser,
};
