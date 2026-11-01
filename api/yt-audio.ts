import type { Request, Response } from 'express';
import { getTrack, search, findBestMatchByTitleAndDuration } from './ytmusic';

export const config = { maxDuration: 60 };

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const query = String(req.query?.q ?? '').trim();
    const id = String(req.query?.id ?? '').trim();
    const title = String(req.query?.title ?? '').trim();
    const artist = String(req.query?.artist ?? '').trim();
    const targetDuration = Number(req.query?.duration ?? 0);

    let videoId = '';

    // 1. Direct YouTube video ID
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      videoId = id;
    }

    // 2. If no direct ID, find best match by title, artist and duration matching lyrics
    if (!videoId) {
      const searchTitle = title || query;
      if (searchTitle || artist) {
        videoId = (await findBestMatchByTitleAndDuration(searchTitle, artist, targetDuration)) || '';
      }
    }

    // 3. Fallback search
    let track: any = null;
    if (videoId) {
      track = await getTrack(videoId).catch(() => null);
    }

    if (!track) {
      const searchTerm = `${artist} ${title || query}`.trim() || query || title;
      if (searchTerm) {
        const sRes: any = await search(searchTerm);
        const firstSong = sRes?.songs?.[0] || sRes?.topResult;
        if (firstSong?.videoId) {
          videoId = firstSong.videoId;
          track = await getTrack(videoId).catch(() => null);
        }
      }
    }

    if (!track || !track.audio || !track.audio.url) {
      return res.status(404).json({
        status: false,
        error: 'No se pudo resolver el audio en YouTube Music con getTrack',
      });
    }

    return res.status(200).json({
      status: true,
      source: 'ytmusic',
      result: {
        downloadUrl: track.audio.url,
        url: track.audio.url,
        title: track.title,
        artist: track.author,
        duration: track.durationSeconds,
        youtubeId: track.videoId,
        thumbnail: track.thumbnail,
        client: track.audio.client,
      },
    });
  } catch (err: any) {
    console.error('yt-audio handler error:', err);
    return res.status(500).json({
      status: false,
      error: err?.message || 'Error resolviendo audio con YouTube Music',
    });
  }
}
