# Spotify

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend API (MongoDB + GridFS)

This project now includes a simple Node/Express API that stores audio files in MongoDB (GridFS) and streams them to the Angular player.

1. Ensure MongoDB is running locally.
2. Create `server/.env` from `server/.env.example` if you want to customize the connection string or port.
3. Install dependencies and start the API:

```bash
npm install
npm run dev:server
```

The API starts at `http://localhost:4000`.

### Upload a song

Send a `multipart/form-data` request to add a new song:

```bash
curl -X POST http://localhost:4000/api/songs ^
  -F "title=My Track" ^
  -F "artist=My Artist" ^
  -F "album=My Album" ^
  -F "image=https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" ^
  -F "audio=@C:\\path\\to\\song.mp3"
```

After upload, refresh the Angular app to see the new songs and play them.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
