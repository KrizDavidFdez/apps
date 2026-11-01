import type { Request, Response } from 'express';

const artistTracksCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 20 * 60 * 1000;

const formatDuration = (sec: number) => {
  if (!sec || isNaN(sec)) return '03:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default async function handler(req: Request | any, res: Response | any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query?.id as string;
  if (!id) {
    return res.json([]);
  }

  // Instant in-memory cache hit
  const cached = artistTracksCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.deezer.com/artist/${encodeURIComponent(id)}/top?limit=40`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const fetchRes = await fetch(url, {
      signal: controller.signal,
      headers: {
        'accept': '*/*',
        'user-agent': 'Mozilla/5.0'
      }
    });
    clearTimeout(timeout);

    const data: any = await fetchRes.json();

    const results = (data?.data || []).map((track: any) => ({
      id: String(track.id),
      title: track.title || '',
      artist: track.artist?.name || '',
      coverUrl:
        track.album?.cover_xl ||
        track.album?.cover_big ||
        track.album?.cover_medium ||
        track.album?.cover ||
        null,
      audioUrl: `/api/stream?id=${track.id}`,
      duration: track.duration || 210,
      durationFormatted: formatDuration(track.duration),
    }));

    artistTracksCache.set(id, { data: results, timestamp: Date.now() });

    res.json(results);
  } catch (err) {
    console.error("Artist tracks error:", err);
    res.json([]);
  }
}
