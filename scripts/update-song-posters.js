const mongoose = require('mongoose');

const Song = require('../server/models/Song');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotifyDB';

const updates = [
  {
    title: 'Aari Aari',
    artist: 'Dhurandhar The Revenge',
    image:
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&h=500&fit=crop',
  },
  {
    title: 'Ram Ji Aake Bhala Karenge (From Bhooth Bangla)',
    artist: 'Bhooth Bangla',
    image:
      'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=500&h=500&fit=crop',
  },
];

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const results = [];

  for (const update of updates) {
    const song = await Song.findOne({ title: update.title, artist: update.artist });
    if (!song) {
      results.push(`Missing: ${update.title} - ${update.artist}`);
      continue;
    }
    song.image = update.image;
    await song.save();
    results.push(`Updated: ${update.title} - ${update.artist}`);
  }

  await mongoose.disconnect();

  results.forEach((line) => console.log(line));
};

run().catch((err) => {
  console.error('Poster update failed:', err);
  process.exitCode = 1;
});
