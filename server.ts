import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

import topSongsHandler from "./api/top-songs";
import searchHandler from "./api/search";
import searchArtistsHandler from "./api/search-artists";
import searchAlbumsHandler from "./api/search-albums";
import artistTracksHandler from "./api/artist-tracks";
import albumTracksHandler from "./api/album-tracks";
import lyricsHandler from "./api/lyrics";
import ytAudioHandler from "./api/yt-audio";
import proxyAudioHandler from "./api/proxy-audio";
import coverProxyHandler from "./api/cover-proxy";

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === "production" && process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.all("/api/top-songs", topSongsHandler);
  app.all("/api/search", searchHandler);
  app.all("/api/search-artists", searchArtistsHandler);
  app.all("/api/search-albums", searchAlbumsHandler);
  app.all("/api/artist-tracks", artistTracksHandler);
  app.all("/api/album-tracks", albumTracksHandler);
  app.all("/api/lyrics", lyricsHandler);
  app.all("/api/audio", ytAudioHandler);
  app.all("/api/yt-audio", ytAudioHandler);
  app.all("/api/stream", ytAudioHandler);
  app.all("/api/proxy-audio", proxyAudioHandler);
  app.all("/api/download", proxyAudioHandler);
  app.all("/api/cover-proxy", coverProxyHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
