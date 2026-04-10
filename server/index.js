const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const songsRouter = require('./routes/songs');

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotify';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';

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

    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
