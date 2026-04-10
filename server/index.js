const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { API_PORT, CLIENT_ORIGIN, MONGODB_URI } = require('../env');

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
