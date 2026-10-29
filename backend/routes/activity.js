const express = require("express");
const Post = require("../models/Post");
const Album = require("../models/Album");
const User = require("../models/User");

const router = express.Router();

async function buildFeed(postFilter, albumFilter) {
  const posts = await Post.find(postFilter)
    .populate("author", "displayName username profileImage")
    .populate("comments.author", "displayName username");

  const albums =  await Album.find(albumFilter).populate("owner", "displayName username profileImage");

  const feedItems = [];

  for(const post of posts) {
    const postObj = post.toObject();
    postObj.itemType = "post";
    feedItems.push(postObj);
  }

  for(const album of albums) {
    const albumObj = album.toObject();
    albumObj.itemType = "album";
    albumObj.author = albumObj.owner;
    feedItems.push(albumObj);
  }

  feedItems.sort(function (a, b) {
     return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return feedItems;
}

// Local feed — the viewer plus their friends.
router.get("/local/:userId", async (req, res) =>{
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const authorIds = [user._id, ...user.friends];
    const feed = await buildFeed({ author: { $in: authorIds }, hidden: false }, { owner: { $in: authorIds } });
    return res.json(feed);
  } catch (err) {
    return res.status(500).json({ message: "Could not load local activity.", error: err.message });
  }
});

// Global feed — everyone.
router.get("/global", async (req, res) => {
  try {
    const feed = await buildFeed({ hidden: false }, {});
    return res.json(feed);
  } catch (err) {
    return res.status(500).json({ message: "Could not load global activity.", error: err.message });
  }
});

module.exports = router;
