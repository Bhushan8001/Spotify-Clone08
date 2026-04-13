const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const API_PORT = process.env.API_PORT || process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';
const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/spotifyDB';

function isInvalidMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return true;
  if (!(uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) return true;
  return /<[^>]+>/.test(uri);
}

if (isInvalidMongoUri(MONGODB_URI)) {
  console.error(
    'Invalid MONGO_URI/MONGODB_URI. Use a real Atlas URI, for example: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/spotifyDB?retryWrites=true&w=majority'
  );
  process.exit(1);
}

const songsRouter = require('./routes/songs');

const app = express();

const PORT = API_PORT;

app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://127.0.0.1:4200'],
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
