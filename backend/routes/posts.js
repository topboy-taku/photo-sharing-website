const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const ReportReason = require("../models/ReportReason");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// A post is auto-hidden from feeds once it collects more than this many reports.
const AUTO_HIDE_REPORT_THRESHOLD = 2;

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

// Posts belonging to one user (profile page grid). Hidden posts are included
// only when the viewer is that user themselves or an admin — with a `hidden`
// flag on each post so the frontend can badge them — so people can still find
// their own (or, for admins, anyone's) hidden posts via a logical place.
router.get("/user/:userId", async (req, res) => {
  try {
    const viewerId = req.header("x-user-id");
    let includeHidden = false;
    if (viewerId === req.params.userId) {
      includeHidden = true;
    } else if (viewerId) {
      const viewer = await User.findById(viewerId);
      if (viewer?.isAdmin) includeHidden = true;
    }

    const filter = { author: req.params.userId };
    if (!includeHidden) filter.hidden = false;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("author", "displayName username profileImage");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not load user posts.", error: err.message });
  }
});

// Search posts by description (case-insensitive substring).
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  try {
    const regex = new RegExp(q, "i");
    const posts = await Post.find({ $or: [{ description: regex }, { hashtags: regex }], hidden: false })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("author", "displayName username profileImage");
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Post search failed.", error: err.message });
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
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
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

    // Bonus behaviour: deleting a post that is the only post in an album
    // also deletes that album.
    if (post.album) {
      const Album = require("../models/Album");
      const album = await Album.findById(post.album);
      if (album && album.posts.length === 1 && album.posts[0].toString() === post._id.toString()) {
        await Album.findByIdAndDelete(album._id);
      } else if (album) {
        await Album.findByIdAndUpdate(album._id, { $pull: { posts: post._id } });
      }
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

// Reports must use one of the admin-maintained predefined reasons.
router.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ message: "A report reason is required." });

    const validReason = await ReportReason.findOne({ label: reason });
    if (!validReason) {
      return res.status(400).json({ message: "Please choose one of the listed report reasons." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    post.reports.push({ reporter: req.user._id, reason });
    if (post.reports.length > AUTO_HIDE_REPORT_THRESHOLD) {
      post.hidden = true;
    }
    await post.save();
    return res.json({ message: "Post reported.", reportCount: post.reports.length, hidden: post.hidden });
  } catch (err) {
    return res.status(500).json({ message: "Could not report post.", error: err.message });
  }
});

module.exports = router;
