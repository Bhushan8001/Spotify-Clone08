const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

const Song = require('../server/models/Song');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotifyDB';
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const tracks = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  return {
    title: `SoundHelix Song ${number}`,
    artist: 'SoundHelix',
    album: 'SoundHelix Examples',
    sourceUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${number}.mp3`,
  };
});

const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

const downloadFile = (url, destination) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Spotify Demo Importer)',
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destination, () => undefined);
          reject(new Error(`Download failed (${response.statusCode}) for ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    );

    request.on('error', (err) => {
      file.close();
      fs.unlink(destination, () => undefined);
      reject(err);
    });
  });

const run = async () => {
  ensureUploadsDir();
  await mongoose.connect(MONGODB_URI);

  const created = [];

  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index];
    const existing = await Song.findOne({ title: track.title, artist: track.artist });
    if (existing) {
      console.log(`Skipped (already exists): ${track.title} - ${track.artist}`);
      continue;
    }

    const baseName = path.basename(new URL(track.sourceUrl).pathname);
    const fileName = `${Date.now()}-${index + 1}-${baseName}`;
    const destination = path.join(UPLOADS_DIR, fileName);

    await downloadFile(track.sourceUrl, destination);

    const record = await Song.create({
      title: track.title,
      artist: track.artist,
      album: track.album,
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
