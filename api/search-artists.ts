import type { Request, Response } from 'express';
import { search as appleMusicSearch } from './apple-music';

const artistSearchCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

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
  const cached = artistSearchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    let artists: any[] = [];
    try {
      const amResults = await appleMusicSearch(query, { types: 'artists', limit: 12 });
      if (Array.isArray(amResults?.artists) && amResults.artists.length > 0) {
        const seen = new Set<string>();
        for (const artist of amResults.artists) {
          const aid = String(artist.id);
          if (seen.has(aid)) continue;
          seen.add(aid);
          artists.push({
            id: aid,
            name: artist.name || '',
            pictureUrl: artist.artwork || null,
            isVerified: true,
          });
        }
      }
    } catch (amErr) {
      console.warn('Apple Music artist search error:', amErr);
    }

    // Fallback to Deezer if empty
    if (artists.length === 0) {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=10`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const fetchRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          'accept': '*/*',
          'user-agent': 'Mozilla/5.0',
        },
      });
      clearTimeout(timeout);

      const data: any = await fetchRes.json();
      artists = (data?.data || []).map((artist: any) => ({
        id: String(artist.id),
        name: artist.name || '',
        pictureUrl:
          artist.picture_xl ||
          artist.picture_big ||
          artist.picture_medium ||
          null,
        isVerified: true,
      }));
    }

    if (artists.length > 0) {
      artistSearchCache.set(query, { data: artists, timestamp: Date.now() });
    }

    res.json(artists);
  } catch (err) {
    console.error("Search artists error:", err);
    res.json([]);
  }
}
