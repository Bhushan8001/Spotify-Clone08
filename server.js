const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Song = require('./Song');
const { PORT, MONGODB_URI } = require('./env');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/music', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

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

    const uploadsDir = path.join(__dirname, 'uploads');
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
