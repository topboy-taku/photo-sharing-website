const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Populated incoming friend requests for the logged-in user — saves the
// frontend from an N+1 fetch loop over friendRequestsReceived ids.
router.get("/:id/friend-requests", requireAuth, async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ message: "You can only view your own friend requests." });
  }
  try {
    const user = await User.findById(req.params.id).populate(
      "friendRequestsReceived",
      "displayName username profileImage"
    );
    return res.json(user.friendRequestsReceived);
  } catch (err) {
    return res.status(500).json({ message: "Could not load friend requests.", error: err.message });
  }
});

// Populated friends list.
router.get("/:id/friends", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("friends", "displayName username profileImage");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json(user.friends);
  } catch (err) {
    return res.status(500).json({ message: "Could not load friends.", error: err.message });
  }
});

// View a profile. Full details only shown if the viewer is the owner, a
// friend, or no viewer is specified (kept permissive for simplicity here).
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const viewerId = req.header("x-user-id");
    const isOwner = viewerId === req.params.id;
    const isFriend = viewerId && user.friends.some((f) => f.toString() === viewerId);
    const restricted = !isOwner && !isFriend;

    const safe = user.toSafeObject();
    if (restricted) {
      // Bio/links/stats are hidden, but the friendship-status arrays are
      // still needed so the frontend can show the right action button
      // (send request / request pending / etc.) instead of always
      // defaulting to "Send friend request".
      return res.json({
        _id: safe._id,
        displayName: safe.displayName,
        username: safe.username,
        profileImage: safe.profileImage,
        friends: safe.friends,
        friendRequestsReceived: safe.friendRequestsReceived,
        friendRequestsSent: safe.friendRequestsSent,
        restricted: true,
      });
    }

    const postsCount = await Post.countDocuments({ author: user._id, hidden: false });
    return res.json({ ...safe, restricted: false, postsCount, friendsCount: safe.friends.length });
  } catch (err) {
    return res.status(500).json({ message: "Could not load profile.", error: err.message });
  }
});

// Edit your own profile.
router.put("/:id", requireAuth, async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ message: "You can only edit your own profile." });
  }
  const { displayName, username, pronouns, bio, links, profileImage } = req.body || {};
  const update = {};
  if (displayName !== undefined) update.displayName = displayName;
  if (username !== undefined) update.username = username;
  if (pronouns !== undefined) update.pronouns = pronouns;
  if (bio !== undefined) update.bio = bio;
  if (links !== undefined) update.links = links;
  if (profileImage !== undefined) update.profileImage = profileImage;

  try {
    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    return res.json({ message: "Profile updated.", user: updated.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ message: "Could not update profile.", error: err.message });
  }
});

// Delete your own profile.
router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ message: "You can only delete your own profile." });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ author: req.params.id });
    // Remove this user from everyone else's friend lists/requests.
    await User.updateMany(
      {},
      {
        $pull: {
          friends: req.params.id,
          friendRequestsReceived: req.params.id,
          friendRequestsSent: req.params.id,
        },
      }
    );
    return res.json({ message: "Account deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete account.", error: err.message });
  }
});

// --- Friends ---------------------------------------------------------------

router.post("/:id/friend-request", requireAuth, async (req, res) => {
  const targetId = req.params.id;
  if (req.user._id.toString() === targetId) {
    return res.status(400).json({ message: "You can't friend yourself." });
  }
  try {
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: "User not found." });

    await User.findByIdAndUpdate(targetId, { $addToSet: { friendRequestsReceived: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { friendRequestsSent: targetId } });
    return res.json({ message: "Friend request sent." });
  } catch (err) {
    return res.status(500).json({ message: "Could not send friend request.", error: err.message });
  }
});

router.post("/:id/friend-accept", requireAuth, async (req, res) => {
  // :id is the requester being accepted; req.user is the one accepting.
  const requesterId = req.params.id;
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friendRequestsReceived: requesterId },
      $addToSet: { friends: requesterId },
    });
    await User.findByIdAndUpdate(requesterId, {
      $pull: { friendRequestsSent: req.user._id },
      $addToSet: { friends: req.user._id },
    });
    return res.json({ message: "Friend request accepted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not accept friend request.", error: err.message });
  }
});

router.post("/:id/friend-decline", requireAuth, async (req, res) => {
  const requesterId = req.params.id;
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { friendRequestsReceived: requesterId } });
    await User.findByIdAndUpdate(requesterId, { $pull: { friendRequestsSent: req.user._id } });
    return res.json({ message: "Friend request declined." });
  } catch (err) {
    return res.status(500).json({ message: "Could not decline friend request.", error: err.message });
  }
});

router.post("/:id/unfriend", requireAuth, async (req, res) => {
  const otherId = req.params.id;
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: otherId } });
    await User.findByIdAndUpdate(otherId, { $pull: { friends: req.user._id } });
    return res.json({ message: "Unfriended." });
  } catch (err) {
    return res.status(500).json({ message: "Could not unfriend.", error: err.message });
  }
});

// Simple search across display name / username — used by the Search page.
router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  try {
    const regex = new RegExp(q, "i");
    const users = await User.find({ $or: [{ displayName: regex }, { username: regex }] }).limit(20);
    return res.json(users.map((u) => u.toSafeObject()));
  } catch (err) {
    return res.status(500).json({ message: "Search failed.", error: err.message });
  }
});

module.exports = router;
