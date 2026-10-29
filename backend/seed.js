// Seeds the database with realistic data satisfying the project rubric:
// at least 8 registered users, at least 10 posts, at least 1 album, friend
// connections, an admin account, and a predefined list of report reasons.
// Run with: npm run seed  (after MONGODB_URI is set in backend/.env)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");
const Album = require("./models/Album");
const ReportReason = require("./models/ReportReason");

function img(seed) {
  return `https://picsum.photos/seed/${seed}/900/600`;
}

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
  await ReportReason.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  const userDefs = [
    { displayName: "Takunda Mugwagwa", username: "takunda", email: "takunda@example.com", pronouns: "he/him", bio: "Building Orbit for IMY220. Into synths, film photography and late-night drives.", links: ["instagram.com/takunda"] },
    { displayName: "Lindiwe Khumalo", username: "lindiwe.k", email: "lindiwe@example.com", pronouns: "she/her", bio: "Nebula chaser. Film photography and synthwave playlists.", links: ["instagram.com/lindiwe.k"] },
    { displayName: "Thabo Nkosi", username: "thabo.n", email: "thabo@example.com", pronouns: "he/him", bio: "Street photography around Joburg. Coffee enthusiast.", links: ["instagram.com/thabo.shoots"] },
    { displayName: "Aisha Patel", username: "aisha.p", email: "aisha@example.com", pronouns: "she/her", bio: "Hiking trails and sunrise chasing. Based in Cape Town.", links: [] },
    { displayName: "Michael Chen", username: "m.chen", email: "michael@example.com", pronouns: "he/him", bio: "Food photography and weekend markets.", links: ["instagram.com/chenlens"] },
    { displayName: "Nomvula Dlamini", username: "nomvula.d", email: "nomvula@example.com", pronouns: "she/her", bio: "Studying graphic design. Posting campus life and typography finds.", links: [] },
    { displayName: "Sipho Ndlovu", username: "sipho.n", email: "sipho@example.com", pronouns: "he/him", bio: "Weekend road trips across the Drakensberg.", links: ["instagram.com/sipho.explores"] },
    { displayName: "Grace Mutasa", username: "grace.m", email: "grace@example.com", pronouns: "she/her", bio: "Plant parent and amateur botanist. Film over digital, always.", links: [] },
  ];

  const users = {};
  for (const def of userDefs) {
    users[def.username] = await User.create({ ...def, passwordHash, profileImage: "" });
  }

  const admin = await User.create({
    displayName: "Orbit Admin",
    username: "admin",
    email: "admin@orbit.app",
    passwordHash,
    pronouns: "",
    bio: "Orbit moderation account.",
    links: [],
    isAdmin: true,
  });

  // --- Friendships -----------------------------------------------------------
  async function makeFriends(a, b) {
    await User.findByIdAndUpdate(users[a]._id, { $addToSet: { friends: users[b]._id } });
    await User.findByIdAndUpdate(users[b]._id, { $addToSet: { friends: users[a]._id } });
  }
  await makeFriends("takunda", "lindiwe.k");
  await makeFriends("takunda", "thabo.n");
  await makeFriends("lindiwe.k", "aisha.p");
  await makeFriends("thabo.n", "m.chen");
  await makeFriends("nomvula.d", "sipho.n");
  await makeFriends("grace.m", "lindiwe.k");

  // A pending friend request for demo purposes (Michael -> Takunda).
  await User.findByIdAndUpdate(users["takunda"]._id, { $addToSet: { friendRequestsReceived: users["m.chen"]._id } });
  await User.findByIdAndUpdate(users["m.chen"]._id, { $addToSet: { friendRequestsSent: users["takunda"]._id } });

  // --- Albums ------------------------------------------------------------------
  const albumLateNight = await Album.create({
    owner: users["lindiwe.k"]._id,
    name: "Late Night Drives",
    description: "Everything shot after midnight.",
    hashtags: ["latenight", "film"],
  });
  const albumCampus = await Album.create({
    owner: users["nomvula.d"]._id,
    name: "Campus Life",
    description: "Snapshots from around Hatfield this semester.",
    hashtags: ["campus", "uni"],
  });
  const albumDrakensberg = await Album.create({
    owner: users["sipho.n"]._id,
    name: "Drakensberg Weekends",
    description: "Road trips into the mountains whenever there's a long weekend.",
    hashtags: ["drakensberg", "roadtrip"],
  });

  // --- Posts ---------------------------------------------------------------
  const postDefs = [
    { author: "takunda", description: "First post on Orbit — testing the new backend!", hashtags: ["orbit", "test"], seed: "orbit-2" },
    { author: "lindiwe.k", description: "Nebula over the reservoir. Coldest I've been all year, worth it.", hashtags: ["nebula", "film", "latenight"], seed: "orbit-1", album: albumLateNight._id },
    { author: "lindiwe.k", description: "3am on the N1, city lights streaking past.", hashtags: ["latenight", "longexposure"], seed: "orbit-3", album: albumLateNight._id },
    { author: "thabo.n", description: "Jozi CBD at golden hour, Bree Street looking alive as always.", hashtags: ["joburg", "streetphotography"], seed: "orbit-4" },
    { author: "thabo.n", description: "Coffee at the corner spot before the morning rush.", hashtags: ["coffee", "mornings"], seed: "orbit-5" },
    { author: "aisha.p", description: "Table Mountain at sunrise — the queue for the cableway was worth it.", hashtags: ["capetown", "hiking", "sunrise"], seed: "orbit-6" },
    { author: "m.chen", description: "Sunday market bunny chow stall, best in the city hands down.", hashtags: ["foodie", "market"], seed: "orbit-7" },
    { author: "nomvula.d", description: "Found this typography mural behind the Humanities building.", hashtags: ["campus", "design", "uni"], seed: "orbit-8", album: albumCampus._id },
    { author: "nomvula.d", description: "Group project all-nighter in the library, send help.", hashtags: ["campus", "uni"], seed: "orbit-9", album: albumCampus._id },
    { author: "sipho.n", description: "Sani Pass switchbacks — the 4x4 earned its keep this weekend.", hashtags: ["drakensberg", "roadtrip"], seed: "orbit-10", album: albumDrakensberg._id },
    { author: "sipho.n", description: "Camp set up just before the mist rolled in.", hashtags: ["drakensberg", "camping"], seed: "orbit-11", album: albumDrakensberg._id },
    { author: "grace.m", description: "My monstera finally pushed out a new leaf after months of nothing.", hashtags: ["plants", "slowliving"], seed: "orbit-12" },
    { author: "takunda", description: "Synth rig set up for a late-night recording session.", hashtags: ["synths", "latenight"], seed: "orbit-13" },
  ];

  const posts = {};
  for (const def of postDefs) {
    const post = await Post.create({
      author: users[def.author]._id,
      description: def.description,
      image: img(def.seed),
      hashtags: def.hashtags,
      album: def.album || null,
    });
    posts[def.seed] = post;
    if (def.album) {
      await Album.findByIdAndUpdate(def.album, { $addToSet: { posts: post._id } });
    }
  }

  // A couple of comments for demo richness.
  await Post.findByIdAndUpdate(posts["orbit-1"]._id, {
    $push: { comments: [
      { author: users["takunda"]._id, text: "This came out so well, what settings did you use?" },
      { author: users["grace.m"]._id, text: "The colours in this are unreal." },
    ] },
  });
  await Post.findByIdAndUpdate(posts["orbit-6"]._id, {
    $push: { comments: { author: users["m.chen"]._id, text: "Adding this to my Cape Town list." } },
  });

  // --- Report reasons (admin-managed predefined list) -------------------------
  const reasons = ["Spam", "Inappropriate content", "Harassment or bullying", "False information", "Copyright violation"];
  for (const label of reasons) {
    await ReportReason.create({ label });
  }

  // One post with enough reports to demonstrate the auto-hide-after->2 rule,
  // so the admin account has something to review out of the box.
  const reportedPost = posts["orbit-5"];
  reportedPost.reports.push(
    { reporter: users["lindiwe.k"]._id, reason: "Spam" },
    { reporter: users["aisha.p"]._id, reason: "Spam" },
    { reporter: users["grace.m"]._id, reason: "False information" }
  );
  reportedPost.hidden = true;
  await reportedPost.save();

  console.log("Seed complete:");
  console.log(`  Users: ${Object.keys(users).join(", ")}, admin (password123 for all, incl. admin)`);
  console.log(`  Posts created: ${postDefs.length}`);
  console.log(`  Albums: Late Night Drives, Campus Life, Drakensberg Weekends`);
  console.log(`  Report reasons seeded: ${reasons.join(", ")}`);
  console.log(`  Demo: "${reportedPost.description}" is pre-hidden via 3 reports — check it in the admin panel.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
