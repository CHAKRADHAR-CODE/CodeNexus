
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;

console.log('\n--- CodeNexus Engineering Backend ---');

if (!MONGO_URI) {
  console.error('❌ CONFIG ERROR: MONGODB_URI missing from .env');
  process.exit(1);
}

// Validation for the common mistake of putting DB name in the wrong place
if (MONGO_URI.includes('CodeNexus.n72hkkv.mongodb.net')) {
  console.log('⚠️  DETECTION: Your URI uses "CodeNexus" as the cluster address.');
  console.log('If your cluster is named "cluster", the URI should be cluster.n72hkkv.mongodb.net/CodeNexus');
}

console.log('📡 Attempting Database Handshake...');

mongoose.connect(MONGO_URI, { 
  serverSelectionTimeoutMS: 5000,
  family: 4 // Force IPv4 to bypass some DNS resolution issues
})
  .then(() => console.log('✅ DATABASE: Connection Secure & Synchronized'))
  .catch(err => {
    console.error('❌ DATABASE: Connection Failed');
    if (err.message.includes('querySrv ECONNREFUSED')) {
      console.log('\n🚨 NETWORK BLOCK DETECTED (SRV Block)');
      console.log('Your ISP/Wi-Fi is blocking MongoDB SRV records.');
      console.log('FIX: Go to Atlas > Connect > Drivers > Node.js > Select Version "2.2.12 or later"');
      console.log('Copy the "mongodb://" (not +srv) string into your .env file.');
    } else {
      console.error('Error Details:', err.message);
    }
    console.log('--------------------------------------\n');
  });

// --- FULL SCHEMAS ---

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

const ChallengeSchema = new mongoose.Schema({
  date: { type: String, unique: true },
  problems: [ProblemSchema]
});

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  completedModuleIds: [String],
  completedDailyProblemIds: [String],
  completedDates: [String],
  earnedBadgeIds: [String]
});

const User = mongoose.model('User', UserSchema);
const Track = mongoose.model('Track', TrackSchema);
const Challenge = mongoose.model('Challenge', ChallengeSchema);
const Progress = mongoose.model('Progress', ProgressSchema);

// --- ROUTES ---

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });
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

app.delete('/api/tracks/:id', async (req, res) => {
  await Track.findByIdAndDelete(req.params.id);
  res.status(204).send();
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

app.get('/api/seed', async (req, res) => {
  try {
    await User.deleteMany({ email: { $in: ['admin@test.com', 'student@test.com'] } });
    await User.create([
      { email: 'admin@test.com', password: '111111', name: 'Master Admin', role: 'ADMIN' },
      { email: 'student@test.com', password: '222222', name: 'Chakradhar', role: 'STUDENT', points: 1200, streak: 4 }
    ]);
    res.json({ message: 'Database Seeded. Use 111111 for Admin, 222222 for Student.' });
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => console.log(`🚀 CodeNexus Server: http://localhost:${PORT}`));
