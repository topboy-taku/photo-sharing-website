const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { displayName, username, email, password } = req.body || {};
    if (!displayName || !username || !email || !password) {
      return res.status(400).json({ message: "displayName, username, email and password are required." });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "An account with that email or username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ displayName, username, email, passwordHash });

    return res.status(201).json({
      message: `Welcome to Orbit, ${displayName}!`,
      user: user.toSafeObject(),
      token: user._id.toString(),
    });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed.", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Logged in successfully.",
      user: user.toSafeObject(),
      token: user._id.toString(),
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// Stateless — there's no server-side session to destroy with this simplified
// auth scheme, so this exists for the frontend flow to call and clear local state.
router.post("/logout", (req, res) => {
  return res.status(200).json({ message: "Logged out." });
});

module.exports = router;
