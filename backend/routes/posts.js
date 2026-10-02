const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Global feed — every non-hidden post, newest first.
router.get("/global", async (req, res) => {
  try {
    const posts = await Post.find({ hidden: false })
      .sort({ createdAt: -1 })
      .populate("author", "displayName username profileImage")
      .populate("comments.author", "displayName username");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load global feed.", error: err.message });
  }
});

// Local feed — the viewer's own posts plus their friends' posts.
router.get("/local/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const authorIds = [user._id, ...user.friends];
    const posts = await Post.find({ author: { $in: authorIds }, hidden: false })
      .sort({ createdAt: -1 })
      .populate("author", "displayName username profileImage")
      .populate("comments.author", "displayName username");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load local feed.", error: err.message });
  }
});

// Posts belonging to one user (profile page grid).
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId, hidden: false })
      .sort({ createdAt: -1 })
      .populate("author", "displayName username profileImage");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load user posts.", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "displayName username profileImage")
      .populate("comments.author", "displayName username");
    if (!post) return res.status(404).json({ message: "Post not found." });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: "Could not load post.", error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { description, image, hashtags, albumId } = req.body || {};
    if (!description || !image) {
      return res.status(400).json({ message: "description and image are required." });
    }
    const post = await Post.create({
      author: req.user._id,
      description,
      image,
      hashtags: hashtags || [],
      album: albumId || null,
    });

    if (albumId) {
      const Album = require("../models/Album");
      await Album.findByIdAndUpdate(albumId, { $addToSet: { posts: post._id } });
    }

    const populated = await post.populate("author", "displayName username profileImage");
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Could not create post.", error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }
    const { description, hashtags } = req.body || {};
    if (description !== undefined) post.description = description;
    if (hashtags !== undefined) post.hashtags = hashtags;
    await post.save();
    const populated = await post.populate("author", "displayName username profileImage");
    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Could not update post.", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }
    await Post.findByIdAndDelete(req.params.id);
    return res.json({ message: "Post deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete post.", error: err.message });
  }
});

router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    const already = post.likes.some((l) => l.toString() === req.user._id.toString());
    if (already) {
      post.likes = post.likes.filter((l) => l.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    return res.json({ likes: post.likes.length, liked: !already });
  } catch (err) {
    return res.status(500).json({ message: "Could not like post.", error: err.message });
  }
});

router.post("/:id/comment", requireAuth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    post.comments.push({ author: req.user._id, text });
    await post.save();
    const populated = await post.populate("comments.author", "displayName username");
    return res.status(201).json(populated.comments[populated.comments.length - 1]);
  } catch (err) {
    return res.status(500).json({ message: "Could not add comment.", error: err.message });
  }
});

router.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ message: "A report reason is required." });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    post.reports.push({ reporter: req.user._id, reason });
    await post.save();
    return res.json({ message: "Post reported.", reportCount: post.reports.length });
  } catch (err) {
    return res.status(500).json({ message: "Could not report post.", error: err.message });
  }
});

module.exports = router;
