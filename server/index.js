const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const API_PORT = process.env.API_PORT || process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const MONGODB_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/spotifyDB');

function isInvalidMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return true;
  if (!(uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) return true;
  return /<[^>]+>/.test(uri);
}

function hasExampleMongoUriValues(uri) {
  const examplePatterns = [
    /yourUser/i,
    /yourPassword/i,
    /your-real-cluster/i,
    /real-cluster/i,
    /cluster0\.xxxxx/i,
    /realUser/i,
    /realPassword/i,
    /your-atlas-connection-string/i,
    /<username>|<password>|<cluster>/i,
    /example/i,
  ];

  return examplePatterns.some((pattern) => pattern.test(uri || ''));
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

const songsRouter = require('./routes/songs');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://spppotify.netlify.app',
  'http://localhost:4200',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server and non-browser requests (no Origin header).
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const PORT = API_PORT;
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', songsRouter);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'tracks',
    });
    app.locals.bucket = bucket;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
