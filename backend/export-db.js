// Exports every collection to a JSON file in backend/db-export/, for the
// ClickUP submission requirement ("ClickUP submission also contains exported
// database files (JSON)"). Run with: npm run export-db
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const Album = require("./models/Album");
const ReportReason = require("./models/ReportReason");

const OUT_DIR = path.join(__dirname, "db-export");

async function exportDb() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to backend/.env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Exporting collections...");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const collections = {
    users: User,
    posts: Post,
    albums: Album,
    reportreasons: ReportReason,
  };

  for (const [name, Model] of Object.entries(collections)) {
    const docs = await Model.find().lean();
    const filePath = path.join(OUT_DIR, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    console.log(`  ${name}: ${docs.length} documents -> db-export/${name}.json`);
  }

  console.log("Export complete.");
  await mongoose.disconnect();
}

exportDb().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
