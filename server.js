
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*", methods: ["GET", "POST"] } 
});

/**
 * DATABASE SCHEMAS (The 'Tables')
 */

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, enum: ['ADMIN', 'STUDENT'], default: 'STUDENT' },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  leetcodeUsername: String,
  isBlocked: { type: Boolean, default: false },
  lastSynced: { type: Date, default: Date.now }
});

const TopicSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  icon: String,
  modules: [{
    id: String,
    title: String,
    description: String,
    videoUrl: String,
    pdfUrl: String,
    problems: [{
      id: String,
      title: String,
      difficulty: String,
      points: Number,
      platform: String,
      externalLink: String
    }]
  }],
  interviewQuestions: [String]
});

const ChallengeSchema = new mongoose.Schema({
  id: String,
  date: { type: String, required: true, unique: true },
  problems: [{
    id: String,
    title: String,
    difficulty: String,
    points: Number,
    platform: String,
    externalLink: String
  }]
});

const User = mongoose.model("User", UserSchema);
const Topic = mongoose.model("Topic", TopicSchema);
const Challenge = mongoose.model("Challenge", ChallengeSchema);

/**
 * INITIAL SEED DATA
 * This is used to "Create" and "Populate" your tables the first time
 */
const INITIAL_TOPICS = [
  {
    id: 'dsa-01',
    title: 'Data Structures & Algorithms',
    description: 'Master the core concepts of efficient computing.',
    icon: 'Binary',
    modules: [{
      id: 'mod-1', title: 'Complexity Analysis', description: 'Big O Basics',
      videoUrl: 'https://www.youtube.com/embed/v4cd1O4zkGw',
      problems: [{ id: 'q1', title: 'Two Sum', difficulty: 'EASY', points: 10, platform: 'LeetCode', externalLink: 'https://leetcode.com/problems/two-sum/' }]
    }]
  }
];

const seedDatabase = async () => {
  try {
    const topicCount = await Topic.countDocuments();
    if (topicCount === 0) {
      console.log("Database is empty. Creating 'Topics' table and seeding data...");
      await Topic.insertMany(INITIAL_TOPICS);
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
};

/**
 * API ROUTES
 */

app.get("/health", (req, res) => res.status(200).send("Cloud Engine Online"));

app.get("/curriculum", async (req, res) => {
  try {
    const topics = await Topic.find({});
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: "Cloud fetch failed" });
  }
});

app.get("/challenges", async (req, res) => {
  try {
    const challenges = await Challenge.find({});
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: "Cloud fetch failed" });
  }
});

app.post("/save", async (req, res) => {
  const data = req.body;
  try {
    await User.findOneAndUpdate(
      { email: data.email },
      { name: data.name, points: data.points, streak: data.streak, lastSynced: new Date() },
      { upsert: true }
    );
    io.emit("dataUpdated", { type: "CLOUD_SYNC", userEmail: data.email });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
});

const PORT = 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/codenexus";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    seedDatabase(); // Initialize tables
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("DB Connection Error:", err));
