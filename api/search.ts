import type { Request, Response } from 'express';
import { search as appleMusicSearch } from './apple-music';

const searchCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const formatDuration = (sec?: number | null) => {
  if (!sec || isNaN(sec)) return '03:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default async function handler(req: Request | any, res: Response | any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = (req.query?.q as string || "").toLowerCase().trim();

  if (!query) {
    return res.json([]);
  }

  // Instant in-memory cache hit
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    // 1. Primary search using Apple Music API wrapper
    let tracks: any[] = [];
    try {
      const amResults = await appleMusicSearch(query, { types: 'songs', limit: 30 });
      if (Array.isArray(amResults?.songs) && amResults.songs.length > 0) {
        const seen = new Set<string>();
        for (const song of amResults.songs) {
          const resolvedId = String(song.isrc || song.id);
          if (seen.has(resolvedId)) continue;
          seen.add(resolvedId);

          const duration = Math.round(song.durationSec || 210);
          tracks.push({
            id: resolvedId,
            title: String(song.name || 'Untitled'),
            artist: String(song.artist || 'Unknown Artist'),
            coverUrl: song.artwork || (song.isrc ? `https://lrc.red/s/${song.isrc}.webp` : ''),
            audioUrl: `/api/stream?id=${encodeURIComponent(resolvedId)}&title=${encodeURIComponent(song.name || '')}&artist=${encodeURIComponent(song.artist || '')}&duration=${duration}`,
            duration,
            durationFormatted: formatDuration(duration),
            isrc: song.isrc || null,
            isVerified: true,
          });
        }
      }
    } catch (amErr) {
      console.warn('Apple Music search error, falling back:', amErr);
    }

    // 2. Fallback to LRC.red search if Apple Music returned no songs
    if (tracks.length === 0) {
      try {
        const url = `https://lrc.red/search.json?q=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            accept: 'application/json',
            'user-agent': 'Mozilla/5.0 LightMusic/2.0',
          },
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data: any = await response.json();
          if (Array.isArray(data?.hits)) {
            const seen = new Set<string>();
            for (const track of data.hits) {
              const trackId = String(track.isrc);
              if (seen.has(trackId)) continue;
              seen.add(trackId);

              const dur = Math.round(track.duration || 210);
              tracks.push({
                id: trackId,
                title: track.title || '',
                artist: track.artist || '',
                coverUrl: track.cover || `https://lrc.red/s/${track.isrc}.webp`,
                audioUrl: `/api/stream?id=${track.isrc}&title=${encodeURIComponent(track.title || '')}&artist=${encodeURIComponent(track.artist || '')}&duration=${dur}`,
                duration: dur,
                durationFormatted: formatDuration(dur),
                isrc: track.isrc,
                isVerified: true,
              });
            }
          }
        }
      } catch (lrcErr) {
        console.error('LRC.red fallback search error:', lrcErr);
      }
    }

    if (tracks.length > 0) {
      searchCache.set(query, { data: tracks, timestamp: Date.now() });
    }

    return res.json(tracks);
  } catch (err) {
    console.error("Search handler error:", err);
    return res.json([]);
  }
}
