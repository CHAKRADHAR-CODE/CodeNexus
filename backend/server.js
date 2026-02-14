
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

console.log('\n--- CodeNexus Engineering Backend ---');

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'CodeNexus API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

if (!MONGO_URI) {
  console.error('❌ CONFIG ERROR: MONGODB_URI missing from .env');
  process.exit(1);
}

// --- SCHEMAS ---
const ContentBlockSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ['VIDEO', 'PDF'] },
  title: String,
  url: String,
  isVisible: { type: Boolean, default: true }
});

const ProblemSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  difficulty: String,
  points: Number,
  platform: String,
  externalLink: String
});

const ModuleSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  isVisible: { type: Boolean, default: true },
  contentBlocks: [ContentBlockSchema],
  problems: [ProblemSchema]
});

const TrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  icon: String,
  isVisible: { type: Boolean, default: true },
  modules: [ModuleSchema]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STUDENT'], default: 'STUDENT' },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  completedModuleIds: [String],
  completedDailyProblemIds: [String],
  completedDates: [String],
  earnedBadgeIds: [String]
});

const User = mongoose.model('User', UserSchema);
const Track = mongoose.model('Track', TrackSchema);
const Progress = mongoose.model('Progress', ProgressSchema);

// --- AUTO-SEED FUNCTION ---
async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('🌱 DATABASE: Empty detected. Seeding default accounts...');
    await User.create([
      { 
        email: 'admin@test.com', 
        password: '111111', 
        name: 'Master Admin', 
        role: 'ADMIN' 
      },
      { 
        email: 'student@test.com', 
        password: '222222', 
        name: 'Chakradhar', 
        role: 'STUDENT', 
        points: 1200, 
        streak: 4 
      }
    ]);
    console.log('✅ DATABASE: Admin (111111) and Student (222222) created.');
  }
}

console.log('📡 Attempting Database Handshake...');

mongoose.connect(MONGO_URI, { 
  serverSelectionTimeoutMS: 10000,
  family: 4 
})
  .then(() => {
    console.log('✅ DATABASE: Connection Secure');
    seedIfEmpty();
  })
  .catch(err => {
    console.error('❌ DATABASE: Connection Failed');
    console.error('Error Details:', err.message);
  });

// --- ROUTES ---

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account suspended by Admin' });
    
    const u = user.toObject();
    u.id = u._id;
    delete u.password;
    res.json(u);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users.map(u => ({ ...u._doc, id: u._id })));
});

app.get('/api/leaderboard', async (req, res) => {
  const users = await User.find({ role: 'STUDENT' }).sort({ points: -1 }).limit(50);
  res.json(users.map(u => ({ ...u._doc, id: u._id })));
});

app.get('/api/tracks', async (req, res) => {
  const tracks = await Track.find({}).sort('-createdAt');
  res.json(tracks.map(t => ({ ...t._doc, id: t._id })));
});

app.post('/api/tracks', async (req, res) => {
  try {
    const data = req.body;
    let track;
    if (data.id && mongoose.Types.ObjectId.isValid(data.id)) {
      track = await Track.findByIdAndUpdate(data.id, data, { new: true });
    } else {
      delete data.id;
      track = await Track.create(data);
    }
    res.json({ ...track._doc, id: track._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/block', async (req, res) => {
  try {
    const { isBlocked } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isBlocked });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/progress/:userId', async (req, res) => {
  const p = await Progress.findOne({ userId: req.params.userId });
  res.json(p);
});

app.post('/api/progress', async (req, res) => {
  const p = await Progress.findOneAndUpdate({ userId: req.body.userId }, req.body, { upsert: true, new: true });
  await User.findByIdAndUpdate(req.body.userId, { points: req.body.points, streak: req.body.currentStreak });
  res.json(p);
});

// Manual Seed Route (Optional backup)
app.get('/api/seed', async (req, res) => {
  try {
    await seedIfEmpty();
    res.json({ message: 'Seed logic triggered.' });
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => console.log(`🚀 CodeNexus Server: http://localhost:${PORT}`));
