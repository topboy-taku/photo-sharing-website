require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const albumRoutes = require("./routes/albums");
const adminRoutes = require("./routes/admin");
const activityRoutes = require("./routes/activity");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // generous limit — images are sent as base64 data URLs

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Orbit backend is running.", dbState: mongoose.connection.readyState });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);

async function start() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to backend/.env before starting the server.");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => console.log(`Orbit backend listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
