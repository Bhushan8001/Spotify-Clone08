const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Song = require('./Song');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const MONGODB_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/spotifyDB');
const MONGO_RETRY_DELAY_MS = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);

function isInvalidMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return true;
  if (!(uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) return true;
  return /<[^>]+>/.test(uri);
}

function hasExampleMongoUriValues(uri) {
  return /(yourUser|yourPassword|cluster0\.xxxxx|example)/i.test(uri || '');
}

function isLocalMongoUri(uri) {
  return /mongodb(\+srv)?:\/\/(localhost|127\.0\.0\.1)/i.test(uri || '');
}

if (
  isInvalidMongoUri(MONGODB_URI) ||
  hasExampleMongoUriValues(MONGODB_URI) ||
  (isProduction && isLocalMongoUri(MONGODB_URI))
) {
  console.error(
    'Invalid MONGO_URI/MONGODB_URI. Set a real remote Mongo URI in Render (do not use localhost or sample placeholder values in production). Example: mongodb+srv://username:password@your-real-cluster.mongodb.net/spotifyDB?retryWrites=true&w=majority'
  );
  process.exit(1);
}

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');
let isMongoConnected = false;

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json());
app.use('/music', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.error('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  isMongoConnected = false;
  console.error('MongoDB connection error:', err.message || err);
});

async function connectMongoWithRetry() {
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (err) {
    console.error(
      `MongoDB connect failed. Retrying in ${MONGO_RETRY_DELAY_MS}ms.`,
      err.message || err
    );
    setTimeout(connectMongoWithRetry, MONGO_RETRY_DELAY_MS);
  }
}

connectMongoWithRetry();

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'spotify-api' });
});

app.get('/healthz', (req, res) => {
  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? 'ok' : 'degraded',
    mongo: isMongoConnected ? 'connected' : 'disconnected',
  });
});

// Upload API
app.post('/upload', upload.single('song'), async (req, res) => {
  const newSong = new Song({
    title: req.body.title,
    artist: req.body.artist,
    album: req.body.album,
    image: req.body.image,
    filePath: `music/${req.file.filename}`,
  });

  await newSong.save();
  res.send('Song uploaded');
});

// Get Songs API
app.get('/songs', async (req, res) => {
  const songs = await Song.find();
  res.json(songs);
});

// Delete Song API
app.delete('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const normalizedPath = (song.filePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
    let relativePath = normalizedPath;

    if (relativePath.startsWith('music/')) {
      relativePath = relativePath.replace(/^music\//, '');
    } else if (relativePath.startsWith('uploads/')) {
      relativePath = relativePath.replace(/^uploads\//, '');
    }

    const absolutePath = path.join(uploadsDir, relativePath);

    if (absolutePath.startsWith(uploadsDir) && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Song.deleteOne({ _id: song._id });
    res.json({ message: 'Song deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
