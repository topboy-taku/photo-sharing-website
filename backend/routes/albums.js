const express = require("express");
const Album = require("../models/Album");
const Post = require("../models/Post");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/user/:userId", async (req, res) => {
  try {
    const albums = await Album.find({ owner: req.params.userId }).populate("owner", "displayName username");
    return res.json(albums);
  } catch (err) {
    return res.status(500).json({ message: "Could not load albums.", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("owner", "displayName username")
      .populate({ path: "posts", populate: { path: "author", select: "displayName username profileImage" } });
    if (!album) return res.status(404).json({ message: "Album not found." });
    return res.json(album);
  } catch (err) {
    return res.status(500).json({ message: "Could not load album.", error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, hashtags } = req.body || {};
    if (!name) return res.status(400).json({ message: "Album name is required." });
    const album = await Album.create({
      owner: req.user._id,
      name,
      description: description || "",
      hashtags: hashtags || [],
    });
    return res.status(201).json(album);
  } catch (err) {
    return res.status(500).json({ message: "Could not create album.", error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own albums." });
    }
    const { name, description, hashtags } = req.body || {};
    if (name !== undefined) album.name = name;
    if (description !== undefined) album.description = description;
    if (hashtags !== undefined) album.hashtags = hashtags;
    await album.save();
    return res.json(album);
  } catch (err) {
    return res.status(500).json({ message: "Could not update album.", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });
    if (album.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own albums." });
    }
    await Post.updateMany({ album: album._id }, { $set: { album: null } });
    await Album.findByIdAndDelete(req.params.id);
    return res.json({ message: "Album deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete album.", error: err.message });
  }
});

router.post("/:id/posts", requireAuth, async (req, res) => {
  try {
    const { postId } = req.body || {};
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only add to your own albums." });
    }
    await Album.findByIdAndUpdate(req.params.id, { $addToSet: { posts: postId } });
    await Post.findByIdAndUpdate(postId, { album: req.params.id });
    return res.json({ message: "Post added to album." });
  } catch (err) {
    return res.status(500).json({ message: "Could not add post to album.", error: err.message });
  }
});

router.delete("/:id/posts/:postId", requireAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own albums." });
    }
    await Album.findByIdAndUpdate(req.params.id, { $pull: { posts: req.params.postId } });
    await Post.findByIdAndUpdate(req.params.postId, { album: null });
    return res.json({ message: "Post removed from album." });
  } catch (err) {
    return res.status(500).json({ message: "Could not remove post from album.", error: err.message });
  }
});

module.exports = router;
