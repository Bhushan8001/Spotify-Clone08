const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Song = require('../models/Song');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const toSongResponse = (song) => ({
  _id: song._id,
  title: song.title,
  artist: song.artist,
  album: song.album,
  image: song.image,
  audioUrl: `/api/songs/${song._id}/stream`,
  createdAt: song.createdAt,
});

router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs.map(toSongResponse));
  } catch (err) {
    console.error('Failed to fetch songs:', err);
    res.status(500).json({ message: 'Failed to fetch songs.' });
  }
});

router.get('/songs/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid song id.' });
    }
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found.' });
    }
    res.json(toSongResponse(song));
  } catch (err) {
    console.error('Failed to fetch song:', err);
    res.status(500).json({ message: 'Failed to fetch song.' });
  }
});

router.post('/songs', upload.single('audio'), async (req, res) => {
  try {
    const { title, artist, album, image } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required.' });
    }
    const bucket = req.app.locals.bucket;
    if (!bucket) {
      return res.status(503).json({ message: 'Storage is not ready yet.' });
    }

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        title,
        artist,
        album,
        image,
      },
    });

    uploadStream.on('error', (err) => {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Failed to store audio file.' });
    });

    uploadStream.on('finish', async (file) => {
      try {
        const song = await Song.create({
          title,
          artist,
          album,
          image,
          audioFileId: file._id,
        });
        res.status(201).json(toSongResponse(song));
      } catch (err) {
        console.error('Failed to save song metadata:', err);
        res.status(500).json({ message: 'Failed to save song metadata.' });
      }
    });

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Failed to upload song:', err);
    res.status(500).json({ message: 'Failed to upload song.' });
  }
});

router.get('/songs/:id/stream', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid song id.' });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found.' });
    }

    const bucket = req.app.locals.bucket;
    if (!bucket) {
      return res.status(503).json({ message: 'Storage is not ready yet.' });
    }

    const files = await bucket.find({ _id: song.audioFileId }).toArray();
    const file = files[0];
    if (!file) {
      return res.status(404).json({ message: 'Audio file not found.' });
    }

    const total = file.length;
    const contentType = file.contentType || 'audio/mpeg';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Math.max(parseInt(parts[0], 10) || 0, 0);
      const end = Math.min(
        parts[1] ? parseInt(parts[1], 10) : total - 1,
        total - 1
      );
      if (start >= total || end < start) {
        return res.status(416).json({ message: 'Requested range not satisfiable.' });
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      const stream = bucket.openDownloadStream(song.audioFileId, {
        start,
        end: end + 1,
      });
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
      });
      return stream.pipe(res);
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    const stream = bucket.openDownloadStream(song.audioFileId);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.end();
    });
    return stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream song:', err);
    res.status(500).json({ message: 'Failed to stream song.' });
  }
});

module.exports = router;
