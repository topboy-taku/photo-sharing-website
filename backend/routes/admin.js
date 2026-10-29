const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const Album = require("../models/Album");
const ReportReason = require("../models/ReportReason");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.get("/reasons", requireAuth, async (req, res) => {
  try {
    const reasons = await ReportReason.find().sort({ label: 1 });
    return res.json(reasons);
  } catch (err) {
    return res.status(500).json({ message: "Could not load report reasons.", error: err.message });
  }
});

// Everything below requires a logged-in admin.
router.use(requireAuth, requireAdmin);

// All posts that have at least one report (hidden or not), most recently
// updated (i.e. most recently reported) first.
router.get("/reports", async (req, res) => {
  try {
    const posts=await Post.find({ "reports.0": { $exists: true } })
      .sort({ updatedAt: -1 })
      .populate("author", "displayName username")
      .populate("reports.reporter", "displayName username");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load reported posts.", error: err.message });
  }
});

// All posts currently hidden (auto-hidden after >2 reports, or admin-hidden).
router.get("/hidden-posts", async (req, res) => {
  try {
    const posts = await Post.find({ hidden: true })
      .sort({ updatedAt: -1 })
      .populate("author", "displayName username");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load hidden posts.", error: err.message });
  }
});

// Admin can manually hide/unhide a post (independent of report auto-hide).
router.put("/posts/:id/visibility", async (req, res) => {
  try {
    const { hidden } = req.body || {};
    const post = await Post.findByIdAndUpdate(req.params.id, { hidden: !!hidden }, { new: true });
    if (!post) return res.status(404).json({ message: "Post not found." });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: "Could not update post visibility.", error: err.message });
  }
});

// All registered users, for the admin user-management list.
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users.map((u) => u.toSafeObject()));
  } catch (err) {
    return res.status(500).json({ message: "Could not load users.", error: err.message });
  }
});

// All albums, for the admin content-management list.
router.get("/albums", async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 }).populate("owner", "displayName username");
    return res.json(albums);
  } catch (err) {
    return res.status(500).json({ message: "Could not load albums.", error: err.message });
  }
});

// --- Report reasons (admin-managed) -----------------------------------------

router.post("/reasons", async (req, res) => {
  try {
    const { label } = req.body || {};
    if (!label || !label.trim()) return res.status(400).json({ message: "A reason label is required." });
    const existing = await ReportReason.findOne({ label: label.trim() });
    if (existing) return res.status(409).json({ message: "That reason already exists." });
    const reason = await ReportReason.create({ label: label.trim() });
    return res.status(201).json(reason);
  } catch (err) {
    return res.status(500).json({ message: "Could not add report reason.", error: err.message });
  }
});

router.delete("/reasons/:id", async (req, res) => {
  try {
    await ReportReason.findByIdAndDelete(req.params.id);
    return res.json({ message: "Report reason removed." });
  } catch (err) {
    return res.status(500).json({ message: "Could not remove report reason.", error: err.message });
  }
});

module.exports = router;
