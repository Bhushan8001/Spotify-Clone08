const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const API_PORT = process.env.API_PORT || process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';
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

const PORT = API_PORT;
const defaultAllowedOrigins = [
  'http://127.0.0.1:4200',
  'http://localhost:4200',
  'https://soppo.netlify.app',
  'https://agent-69d8da557564580a89--genuine-biscuit-5a741e.netlify.app',
];
const envOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultAllowedOrigins, ...envOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
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
