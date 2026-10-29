const User = require("../models/User");

// Simplified auth: the frontend stores the logged-in user's Mongo _id
// (returned at signup/login) and sends it as x-user-id on every request.
// This is NOT secure (no signature/expiry) — a real token scheme is out of
// scope for this project's basic-functionality bar.
async function requireAuth(req, res, next) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ message: "Missing x-user-id header. Please log in." });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid session. Please log in again." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session. Please log in again." });
  }
}

// Must follow requireAuth — relies on req.user already being set.
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
