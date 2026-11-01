import type { Request, Response } from 'express';

const albumDetailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

  const albumId = (req.query?.id as string) || '';

  if (!albumId) {
    return res.status(400).json({ error: 'Missing album id' });
  }

  const cached = albumDetailsCache.get(albumId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.deezer.com/album/${albumId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: '*/*',
        'user-agent': 'Mozilla/5.0',
      },
    });
    clearTimeout(timeout);

    const album: any = await response.json();
    if (!album || album.error) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const coverUrl =
      album.cover_xl ||
      album.cover_big ||
      album.cover_medium ||
      album.cover ||
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg';

    const rawTracks = album.tracks?.data || [];
    const tracks = rawTracks.map((t: any) => ({
      id: String(t.id),
      title: t.title || '',
      artist: t.artist?.name || album.artist?.name || '',
      coverUrl,
      audioUrl: `/api/stream?id=${t.id}`,
      duration: t.duration || 180,
      durationFormatted: formatDuration(t.duration || 180),
    }));

    const result = {
      id: String(album.id),
      title: album.title || '',
      artist: album.artist?.name || '',
      coverUrl,
      releaseDate: album.release_date || '',
      trackCount: album.nb_tracks || tracks.length,
      tracks,
    };

    albumDetailsCache.set(albumId, { data: result, timestamp: Date.now() });
    return res.json(result);
  } catch (error) {
    console.error('Error fetching album details:', error);
    return res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
}
