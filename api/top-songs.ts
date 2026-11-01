import type { Request, Response } from 'express';

const formatDuration = (sec: number) => {
  if (!sec || isNaN(sec)) return '03:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

let cachedTopSongs: any[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(req: Request | any, res: Response | any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (cachedTopSongs.length > 0 && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return res.status(200).json(cachedTopSongs);
  }

  try {
    // Curated top search queries on LRC.red for Latin and Global hits with synchronized duet lyrics
    const searchQueries = [
      'segun quien',
      'maluma',
      'bad bunny',
      'the weeknd',
      'feid',
      'rauw alejandro',
      'peso pluma',
      'billie eilish',
      'top hits'
    ];

    const tracksMap = new Map<string, any>();

    // Priority pinned tracks with verified duet split (Maluma & Carín León, Maluma & The Weeknd)
    const pinnedTracks = [
      {
        id: 'USSD12300400',
        title: 'Según Quién',
        artist: 'Maluma, Carín León',
        coverUrl: 'https://lrc.red/s/USSD12300400.webp',
        audioUrl: '/api/stream?id=USSD12300400&title=' + encodeURIComponent('Según Quién') + '&artist=' + encodeURIComponent('Maluma, Carín León'),
        duration: 142,
        durationFormatted: '02:22',
        isVerified: true
      },
      {
        id: 'USSD12000526',
        title: 'Hawái (Remix)',
        artist: 'Maluma & The Weeknd',
        coverUrl: 'https://lrc.red/s/USSD12000526.webp',
        audioUrl: '/api/stream?id=USSD12000526&title=' + encodeURIComponent('Hawái Remix') + '&artist=' + encodeURIComponent('Maluma & The Weeknd'),
        duration: 200,
        durationFormatted: '03:20',
        isVerified: true
      }
    ];

    for (const pin of pinnedTracks) {
      tracksMap.set(pin.id, pin);
    }

    // Query LRC.red for top hits
    for (const query of searchQueries) {
      try {
        const sRes = await fetch(`https://lrc.red/search.json?q=${encodeURIComponent(query)}`, {
          headers: {
            accept: 'application/json',
            'user-agent': 'Mozilla/5.0 LightMusic/2.0'
          }
        });
        if (sRes.ok) {
          const sData: any = await sRes.json();
          if (Array.isArray(sData.hits)) {
            for (const hit of sData.hits) {
              if (hit && hit.isrc && !tracksMap.has(hit.isrc)) {
                tracksMap.set(hit.isrc, {
                  id: String(hit.isrc),
                  title: String(hit.title || 'Untitled'),
                  artist: String(hit.artist || 'Unknown Artist'),
                  coverUrl: hit.cover || `https://lrc.red/s/${hit.isrc}.webp`,
                  audioUrl: `/api/stream?id=${hit.isrc}&title=${encodeURIComponent(hit.title || '')}&artist=${encodeURIComponent(hit.artist || '')}&duration=${hit.duration || 210}`,
                  duration: Math.round(hit.duration || 210),
                  durationFormatted: formatDuration(hit.duration),
                  isVerified: true
                });
              }
            }
          }
        }
      } catch (err) {
        // Continue to next query
      }
    }

    const fetchedTracks = Array.from(tracksMap.values()).slice(0, 50);

    if (fetchedTracks.length > 0) {
      cachedTopSongs = fetchedTracks;
      lastFetchTime = Date.now();
      return res.status(200).json(fetchedTracks);
    }

    return res.status(200).json(pinnedTracks);
  } catch (err) {
    console.error('Top songs fetch error:', err);
    return res.status(200).json([]);
  }
}
