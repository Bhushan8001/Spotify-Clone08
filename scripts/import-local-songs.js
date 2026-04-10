const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Song = require('../server/models/Song');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotifyDB';
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const songsToImport = [
  {
    sourcePath:
      'C:\\Users\\Bhushan\\Downloads\\Dhurandhar The Revenge - Aari Aari - Dhurandhar The Revenge (128 kbps).mp3',
    title: 'Aari Aari',
    artist: 'Dhurandhar The Revenge',
    album: 'Dhurandhar The Revenge',
  },
  {
    sourcePath:
      'C:\\Users\\Bhushan\\Downloads\\Ram Ji Aake Bhala Karenge (From _Bhooth Bangla_) - Ram Ji Aake Bhala Karenge (From Bhooth Bangla) (128 kbps).mp3',
    title: 'Ram Ji Aake Bhala Karenge (From Bhooth Bangla)',
    artist: 'Bhooth Bangla',
    album: 'Bhooth Bangla',
  },
];

const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

const copySongFile = (sourcePath, index) => {
  const baseName = path.basename(sourcePath);
  const stamp = `${Date.now()}-${index + 1}`;
  const fileName = `${stamp}-${baseName}`;
  const destination = path.join(UPLOADS_DIR, fileName);
  fs.copyFileSync(sourcePath, destination);
  return {
    fileName,
    destination,
  };
};

const alreadyExists = async (title, artist) => {
  return Song.findOne({ title, artist });
};

const run = async () => {
  ensureUploadsDir();
  await mongoose.connect(MONGODB_URI);

  const created = [];

  for (let index = 0; index < songsToImport.length; index += 1) {
    const song = songsToImport[index];
    if (!fs.existsSync(song.sourcePath)) {
      console.warn(`Missing file: ${song.sourcePath}`);
      continue;
    }

    const existing = await alreadyExists(song.title, song.artist);
    if (existing) {
      console.log(`Skipped (already exists): ${song.title} - ${song.artist}`);
      continue;
    }

    const { fileName, destination } = copySongFile(song.sourcePath, index);

    const record = await Song.create({
      title: song.title,
      artist: song.artist,
      album: song.album,
      filePath: `music/${fileName}`,
    });

    created.push({ id: record._id.toString(), file: destination });
  }

  await mongoose.disconnect();

  if (!created.length) {
    console.log('No new songs imported.');
    return;
  }

  console.log('Imported songs:');
  created.forEach((item) => {
    console.log(`- ${item.id} (${item.file})`);
  });
};

run().catch((err) => {
  console.error('Import failed:', err);
  process.exitCode = 1;
});
