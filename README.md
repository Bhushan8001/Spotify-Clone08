# Spotify-Clone08

Angular frontend + Node/Express backend for a Spotify-style music player.

## Local development

Install dependencies:

```bash
npm install
```

Run Angular app:

```bash
npm start
```

Run backend API:

```bash
npm run server
```

Frontend runs on `http://localhost:4200` and backend runs on `http://localhost:3000` by default.

## Environment variables

Create a `.env` file in the `spotify` folder:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:4200
MONGO_URI=mongodb://127.0.0.1:27017/spotifyDB
```

`MONGO_URI` is preferred for cloud deployment (MongoDB Atlas), while `MONGODB_URI` is also supported for compatibility.

## Deployment notes (Render)

Use these settings for backend deployment:

- Build command: `npm install`
- Start command: `node server.js`
- Environment variables:
  - `MONGO_URI=<your-atlas-connection-string>`
  - `PORT=10000`
  - `CLIENT_ORIGIN=<your-frontend-url>`

Important: current upload storage uses local disk (`/uploads`). This is fine for local/dev, but cloud platforms may delete local files on restart. For production, move audio storage to Cloudinary, S3, or GridFS-only storage.
