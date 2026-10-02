// Seeds the database with the minimum required data per the D2 rubric:
// at least 2 users, 2 posts, 1 album, and 1 user with a friend.
// Run with: npm run seed  (after MONGODB_URI is set in backend/.env)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");
const Album = require("./models/Album");

const SAMPLE_IMAGE =
  "https://picsum.photos/seed/orbit-seed-1/900/600"; // placeholder — real posts will use uploaded images

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to backend/.env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Clearing existing data...");

  await User.deleteMany({});
  await Post.deleteMany({});
  await Album.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  const takunda = await User.create({
    displayName: "Takunda Mugwagwa",
    username: "takunda",
    email: "takunda@example.com",
    passwordHash,
    pronouns: "he/him",
    bio: "Building Orbit for IMY220. Into synths, film photography and late-night drives.",
    links: ["instagram.com/takunda"],
  });

  const lindiwe = await User.create({
    displayName: "Lindiwe Khumalo",
    username: "lindiwe.k",
    email: "lindiwe@example.com",
    passwordHash,
    pronouns: "she/her",
    bio: "Nebula chaser. Film photography and synthwave playlists.",
    links: ["instagram.com/lindiwe.k"],
  });

  // Make takunda and lindiwe friends (rubric requires "1 user with a friend").
  takunda.friends.push(lindiwe._id);
  lindiwe.friends.push(takunda._id);
  await takunda.save();
  await lindiwe.save();

  const album = await Album.create({
    owner: lindiwe._id,
    name: "Late Night Drives",
    description: "Everything shot after midnight.",
    hashtags: ["latenight", "film"],
  });

  const post1 = await Post.create({
    author: takunda._id,
    description: "First post on Orbit — testing the new backend!",
    image: "https://picsum.photos/seed/orbit-seed-2/900/600",
    hashtags: ["orbit", "test"],
  });

  const post2 = await Post.create({
    author: lindiwe._id,
    description: "Nebula over the reservoir. Coldest I've been all year, worth it.",
    image: SAMPLE_IMAGE,
    hashtags: ["nebula", "film", "latenight"],
    album: album._id,
  });

  album.posts.push(post2._id);
  await album.save();

  console.log("Seed complete:");
  console.log(`  Users: ${takunda.username}, ${lindiwe.username} (password123 for both)`);
  console.log(`  Posts: ${post1._id}, ${post2._id}`);
  console.log(`  Album: ${album._id}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
