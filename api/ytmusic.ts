import { existsSync, readFileSync } from 'node:fs';

const BASE_URL = 'https://music.youtube.com';

const FILTER_PARAMS: Record<string, string> = {
  songs: 'EgWKAQIIAWoSEAUQAxAJEAoQERAQEAQQDhAV',
  videos: 'EgWKAQIQAWoSEAUQAxAJEAoQERAQEAQQDhAV',
  albums: 'EgWKAQIYAWoSEAUQAxAJEAoQERAQEAQQDhAV',
  artists: 'EgWKAQIgAWoSEAUQAxAJEAoQERAQEAQQDhAV',
  playlists: 'EgeKAQQoADgBahIQBRADEAkQChAREBAQBBAOEBU%3D',
  community_playlists: 'EgeKAQQoAEABahIQBRADEAkQChAREBAQBBAOEBU%3D',
};


const UA_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';

export const PLAYER_CLIENTS = [
  {
    name: 'ANDROID_VR',
    id: '28',
    ua: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    client: {
      clientName: 'ANDROID_VR',
      clientVersion: '1.60.19',
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      androidSdkVersion: 32,
      osName: 'Android',
      osVersion: '12L',
    } as Record<string, any>,
  },
  {
    name: 'VISIONOS',
    id: '101',
    ua: UA_SAFARI,
    client: {
      clientName: 'VISIONOS',
      clientVersion: '1.02',
      deviceMake: 'Apple',
      deviceModel: 'RealityDevice17,1',
      osName: 'visionOS',
      osVersion: '26.5.23O471',
    } as Record<string, any>,
  },
];

let cachedContext: any = null;
let lastContextTime = 0;

/**
 * Parsea cookies desde string, archivo o auto-detección
 */
export function parseCookies(input: any = null): string {
  if (input === false || input === '') return '';
  if (input && typeof input === 'string' && input.includes('=')) return input.trim();

  const parseCookieFile = (filePath: string) => {
    try {
      return readFileSync(filePath, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && (!line.startsWith('#') || line.startsWith('#HttpOnly_')))
        .map((line) => {
          const clean = line.replace(/^#HttpOnly_/, '');
          const parts = clean.includes('\t') ? clean.split('\t') : clean.split(/\s+/);
          return parts.length >= 7 ? `${parts[5]}=${parts[6]}` : line;
        })
        .join('; ');
    } catch {
      return '';
    }
  };

  if (input && typeof input === 'string' && existsSync(input)) {
    return parseCookieFile(input);
  }

  const candidates = ['ytmusic.txt', 'ytcook.txt'];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return parseCookieFile(candidate);
  }
  return '';
}

/**
 * Obtiene la configuración Innertube (apiKey, clientVersion, visitorData)
 */
export async function getInnertubeConfig(customCookie: any = null): Promise<any> {
  const cookieHeader = parseCookies(customCookie);
  const now = Date.now();

  if (cachedContext && now - lastContextTime < 1800000 && cachedContext.cookieHeader === cookieHeader) {
    return cachedContext;
  }

  const [musicHtml, visitorData] = await Promise.all([
    fetch(BASE_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    })
      .then((r) => r.text())
      .catch(() => ''),
    fetch('https://www.youtube.com/sw.js_data')
      .then((r) => r.text())
      .then((t) => JSON.parse(t.slice(5))[0][2][0][0][13])
      .catch(() => undefined),
  ]);

  const apiKey =
    musicHtml.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/)?.[1] ||
    musicHtml.match(/AIza[0-9A-Za-z-_]{35}/)?.[0] ||
    'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';
  const clientVersion =
    musicHtml.match(/"INNERTUBE_CLIENT_VERSION":\s*"([^"]+)"/)?.[1] || '1.20261011.16.00';

  cachedContext = {
    apiKey,
    clientVersion,
    visitorData,
    cookieHeader,
    context: {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion,
        hl: 'en',
        gl: 'US',
        ...(visitorData ? { visitorData } : {}),
      },
    },
  };
  lastContextTime = now;
  return cachedContext;
}

/**
 * Extrae un videoId de una URL o string
 */
export function extractVideoId(input: any): string | null {
  if (!input) return null;
  const str = String(input).trim();

  if (str.startsWith('MPREb_') || str.startsWith('UC') || str.startsWith('VL') || str.startsWith('PL')) {
    return null;
  }

  const urlMatch = str.match(
    /(?:youtu\.be\/|music\.youtube\.com\/(?:watch\?v=|watch\?.+&v=)|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return null;
}

/**
 * Extrae un browseId de una URL o string
 */
export function extractBrowseId(input: any): string | null {
  if (!input) return null;
  const str = String(input).trim();

  const channelMatch = str.match(/(?:channel\/|browse\/|artist\/)(UC[a-zA-Z0-9_-]+|FEmusic_[a-zA-Z0-9_-]+)/);
  if (channelMatch) return channelMatch[1];

  const playlistMatch = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    const listId = playlistMatch[1];
    return listId.startsWith('VL') ? listId : `VL${listId}`;
  }
  return str;
}

async function apiRequest(endpoint: string, payload: any, options: any = {}): Promise<any> {
  const cookieOpt = options.cookie !== undefined ? options.cookie : options.cookies;
  const cfg = await getInnertubeConfig(cookieOpt);
  const url = `${BASE_URL}/youtubei/v1/${endpoint}?key=${cfg.apiKey}`;
  const bodyData = { context: cfg.context, ...payload };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
      Referer: `${BASE_URL}/`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(cfg.cookieHeader ? { Cookie: cfg.cookieHeader } : {}),
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) throw new Error(`YouTube Music API error: HTTP ${res.status}`);
  return res.json();
}

function parseFlexColumn(item: any, index: number) {
  return item?.flexColumns?.[index]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
}

function parseDurationToSeconds(durationStr: string | null | undefined): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function parseResponsiveItem(item: any): any {
  const ir = item?.musicResponsiveListItemRenderer;
  if (!ir) return null;

  const col0Runs = parseFlexColumn(ir, 0);
  const col1Runs = parseFlexColumn(ir, 1);
  const col2Runs = parseFlexColumn(ir, 2);

  const title = col0Runs[0]?.text || '';
  const firstCol1 = col1Runs[0]?.text || '';

  const artists = col1Runs
    .filter((r: any) => r.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC'))
    .map((r: any) => ({ name: r.text, id: r.navigationEndpoint?.browseEndpoint?.browseId }));

  const albumRun =
    col1Runs.find((r: any) => r.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('MPREb_')) ||
    col2Runs.find((r: any) => r.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('MPREb_'));
  const album = albumRun
    ? { name: albumRun.text, id: albumRun.navigationEndpoint?.browseEndpoint?.browseId }
    : null;

  const durationRun =
    col1Runs.find((r: any) => /^\d+:\d+$/.test(r.text)) ||
    col2Runs.find((r: any) => /^\d+:\d+$/.test(r.text)) ||
    ir.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0];
  const duration = durationRun?.text || null;

  const videoId =
    ir.playlistItemData?.videoId ||
    ir.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
      ?.watchEndpoint?.videoId ||
    col0Runs[0]?.navigationEndpoint?.watchEndpoint?.videoId;

  const browseId =
    col0Runs[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
    ir.navigationEndpoint?.browseEndpoint?.browseId;

  const thumbnails = ir.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
  const thumbnail = thumbnails.length ? thumbnails[thumbnails.length - 1].url : null;

  let itemType = 'unknown';
  if (firstCol1.toLowerCase().includes('song')) itemType = 'song';
  else if (firstCol1.toLowerCase().includes('video')) itemType = 'video';
  else if (firstCol1.toLowerCase().includes('artist')) itemType = 'artist';
  else if (firstCol1.toLowerCase().includes('album') || firstCol1.toLowerCase().includes('ep'))
    itemType = 'album';
  else if (firstCol1.toLowerCase().includes('playlist')) itemType = 'playlist';
  else if (videoId) itemType = 'song';
  else if (browseId?.startsWith('UC')) itemType = 'artist';
  else if (browseId?.startsWith('MPREb_')) itemType = 'album';
  else if (browseId?.startsWith('VL')) itemType = 'playlist';

  return {
    type: itemType,
    title,
    videoId: videoId || null,
    browseId: browseId || null,
    artists,
    album,
    duration,
    durationSeconds: parseDurationToSeconds(duration),
    thumbnail,
    thumbnails,
  };
}

/**
 * Busca en YouTube Music
 */
export async function search(query: string, options: any = {}): Promise<any> {
  if (!query || !query.trim()) throw new Error('Search query cannot be empty');

  const filter = (options.filter || 'all').toLowerCase();
  const payload: any = { query: query.trim() };
  if (FILTER_PARAMS[filter]) payload.params = FILTER_PARAMS[filter];

  const data = await apiRequest('search', payload, options);
  const sections =
    data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
      ?.contents || [];

  if (filter !== 'all') {
    const shelf = sections[0]?.musicShelfRenderer;
    const contents = shelf?.contents || [];
    return contents.map(parseResponsiveItem).filter(Boolean);
  }

  let topResult: any = null;
  const topCard = sections.find((s: any) => s.musicCardShelfRenderer)?.musicCardShelfRenderer;

  if (topCard) {
    const title = topCard.title?.runs?.[0]?.text;
    const subtitleRuns = topCard.subtitle?.runs || [];
    const fullSubtitle = subtitleRuns.map((r: any) => r.text).join('');
    const videoId =
      topCard.onTap?.watchEndpoint?.videoId ||
      topCard.buttons?.[0]?.buttonRenderer?.command?.watchEndpoint?.videoId;
    const browseId = topCard.onTap?.browseEndpoint?.browseId;
    const thumbs = topCard.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    topResult = {
      title,
      type: subtitleRuns[0]?.text || 'top',
      subtitle: fullSubtitle,
      videoId: videoId || null,
      browseId: browseId || null,
      thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : null,
      thumbnails: thumbs,
    };
  }

  const songs: any[] = [];
  const videos: any[] = [];
  const albums: any[] = [];
  const artists: any[] = [];
  const playlists: any[] = [];

  for (const s of sections) {
    if (s.itemSectionRenderer) {
      const items = s.itemSectionRenderer.contents || [];
      for (const it of items) {
        const parsed = parseResponsiveItem(it);
        if (!parsed) continue;
        if (parsed.type === 'song') songs.push(parsed);
        else if (parsed.type === 'video') videos.push(parsed);
        else if (parsed.type === 'album') albums.push(parsed);
        else if (parsed.type === 'artist') artists.push(parsed);
        else if (parsed.type === 'playlist') playlists.push(parsed);
      }
    } else if (s.musicShelfRenderer) {
      const shelfTitle = (s.musicShelfRenderer.title?.runs?.[0]?.text || '').toLowerCase();
      const items = s.musicShelfRenderer.contents || [];
      for (const it of items) {
        const parsed = parseResponsiveItem(it);
        if (!parsed) continue;
        if (shelfTitle.includes('song')) songs.push(parsed);
        else if (shelfTitle.includes('video')) videos.push(parsed);
        else if (shelfTitle.includes('album')) albums.push(parsed);
        else if (shelfTitle.includes('artist')) artists.push(parsed);
        else if (shelfTitle.includes('playlist')) playlists.push(parsed);
      }
    }
  }

  return { query: query.trim(), topResult, songs, videos, albums, artists, playlists };
}

/**
 * Busca por nombre y duración coincidente para resolver el mejor videoId lo más rápido posible
 */
export async function findBestMatchByTitleAndDuration(
  title: string,
  artist?: string,
  targetDurationSec?: number
): Promise<string | null> {
  const query = `${title} ${artist || ''}`.trim();
  if (!query) return null;

  try {
    const sRes = await search(query);

    const candidates = [
      ...(sRes.songs || []),
      ...(sRes.topResult?.videoId ? [sRes.topResult] : []),
      ...(sRes.videos || []),
    ].filter((c) => c && c.videoId);

    if (candidates.length === 0) return null;

    if (typeof targetDurationSec === 'number' && targetDurationSec > 0) {
      let bestCandidate = candidates[0];
      let minDiff = 999999;

      for (const cand of candidates) {
        const candSec = cand.durationSeconds || parseDurationToSeconds(cand.duration);
        if (candSec > 0) {
          const diff = Math.abs(candSec - targetDurationSec);
          if (diff < minDiff) {
            minDiff = diff;
            bestCandidate = cand;
            if (diff <= 4) {
              return bestCandidate.videoId;
            }
          }
        }
      }

      if (minDiff <= 15) {
        return bestCandidate.videoId;
      }
    }

    return candidates[0].videoId;
  } catch (err) {
    return null;
  }
}

/**
 * Obtiene el stream de audio de un videoId o URL
 */
export async function getAudioStream(videoIdOrUrl: string, options: any = {}): Promise<any> {
  const cookieOpt = options.cookie !== undefined ? options.cookie : options.cookies;
  let videoId = extractVideoId(videoIdOrUrl);
  let candidates: string[] = [];

  if (!videoId) {
    const sRes = await search(videoIdOrUrl, options);
    candidates = [
      sRes.topResult?.videoId,
      ...sRes.songs.map((s: any) => s.videoId),
      ...sRes.videos.map((v: any) => v.videoId),
    ].filter(Boolean);
  } else {
    candidates = [videoId];
  }

  const cfg = await getInnertubeConfig(cookieOpt);

  async function fetchStreamForId(id: string): Promise<any> {
    for (const c of PLAYER_CLIENTS) {
      try {
        const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': c.ua,
            'X-YouTube-Client-Name': c.id,
            'X-YouTube-Client-Version': c.client.clientVersion,
            // sin cookies a proposito: estos clientes fallan si las reciben
          },
          body: JSON.stringify({
            context: {
              client: {
                ...c.client,
                hl: 'en',
                gl: 'US',
                ...(cfg.visitorData ? { visitorData: cfg.visitorData } : {}),
              },
            },
            videoId: id,
            contentCheckOk: true,
            racyCheckOk: true,
          }),
        });
        if (!res.ok) {
          console.error(`[${c.name}] ${id}: HTTP ${res.status}`);
          continue;
        }
        const data: any = await res.json();
        if (data.playabilityStatus?.status !== 'OK') {
          console.error(`[${c.name}] ${id}: ${data.playabilityStatus?.status} - ${data.playabilityStatus?.reason}`);
          continue;
        }
        const afs = data.streamingData?.adaptiveFormats || [];
        const best =
          afs.find((f: any) => f.itag === 140 && f.url) ||
          afs.find((f: any) => f.itag === 251 && f.url) ||
          afs.find((f: any) => f.mimeType?.includes('audio') && f.url);
        if (!best?.url) {
          console.error(`[${c.name}] ${id}: sin URL de audio directa`);
          continue;
        }
        return {
          videoId: id,
          itag: best.itag,
          format: best.mimeType?.includes('mp4') ? 'm4a (aac)' : 'webm (opus)',
          mimeType: best.mimeType?.split(';')[0] || 'audio/mp4',
          bitrate: best.bitrate,
          audioQuality: best.audioQuality,
          contentLength: best.contentLength ? parseInt(best.contentLength, 10) : null,
          url: best.url,
          client: c.name,
          userAgent: c.ua,
        };
      } catch (e: any) {
        console.error(`[${c.name}] ${id}:`, e?.message || e);
      }
    }

    try {
      const iguro = await import('iguro-ytdl');
      const fn = iguro.default || iguro;
      if (fn?.ytmp3) {
        const result = await fn.ytmp3(`https://www.youtube.com/watch?v=${id}`);
        if (result?.status && result?.result?.url) {
          return {
            videoId: id,
            itag: 140,
            format: 'mp3',
            mimeType: 'audio/mpeg',
            bitrate: 128000,
            url: result.result.url,
          };
        }
      }
    } catch {}

    return null;
  }

  for (const id of candidates) {
    const s = await fetchStreamForId(id);
    if (s) return s;
  }

  return null;
}

/**
 * Obtiene la información completa de un track
 */
export async function getTrack(videoIdOrUrl: string, options: any = {}): Promise<any> {
  let videoId = extractVideoId(videoIdOrUrl);
  if (!videoId) {
    const sRes = await search(videoIdOrUrl, options);
    const first = Array.isArray(sRes) ? sRes[0] : sRes?.songs?.[0] || sRes?.topResult;
    if (first?.videoId) videoId = first.videoId;
  }
  if (!videoId) throw new Error('Invalid YouTube video ID or URL');

  const cookieOpt = options.cookie !== undefined ? options.cookie : options.cookies;
  const cfg = await getInnertubeConfig(cookieOpt);

  const [playerRes, audio] = await Promise.all([
    fetch(`https://www.youtube.com/youtubei/v1/player?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cfg.cookieHeader ? { Cookie: cfg.cookieHeader } : {}),
      },
      body: JSON.stringify({
        context: cfg.context,
        videoId,
      }),
    })
      .then((r) => r.json())
      .catch(() => ({})),
    getAudioStream(videoId, options),
  ]);

  const vd = playerRes.videoDetails || {};
  const lengthSeconds = parseInt(vd.lengthSeconds, 10) || 0;
  const mins = Math.floor(lengthSeconds / 60);
  const secs = String(lengthSeconds % 60).padStart(2, '0');
  const durationText = `${mins}:${secs}`;
  const thumbs = vd.thumbnail?.thumbnails || [];
  const thumbnail = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    title: vd.title || null,
    author: vd.author || null,
    durationSeconds: lengthSeconds,
    duration: durationText,
    thumbnail,
    thumbnails: thumbs,
    audio,
  };
}

/**
 * Obtiene la letra de una canción desde YouTube Music
 */
export async function getLyrics(videoIdOrUrl: string, options: any = {}): Promise<{ lyrics: string | null; source: string | null }> {
  try {
    let videoId = extractVideoId(videoIdOrUrl);
    if (!videoId) {
      const sRes = await search(videoIdOrUrl, { filter: 'songs', ...options });
      const first = Array.isArray(sRes) ? sRes[0] : sRes?.songs?.[0] || sRes?.topResult;
      if (first?.videoId) videoId = first.videoId;
    }
    if (!videoId) return { lyrics: null, source: null };

    const cookieOpt = options.cookie !== undefined ? options.cookie : options.cookies;
    const cfg = await getInnertubeConfig(cookieOpt);

    const nextRes = await fetch(`${BASE_URL}/youtubei/v1/next?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cfg.cookieHeader ? { Cookie: cfg.cookieHeader } : {}),
      },
      body: JSON.stringify({ context: cfg.context, videoId }),
    });
    if (!nextRes.ok) return { lyrics: null, source: null };
    const nextData = await nextRes.json();
    const tabs = nextData.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs || [];
    const lyricsTab = tabs.find((t: any) =>
      t.tabRenderer?.endpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_TRACK_LYRICS'
    );
    const browseId = lyricsTab?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
    if (!browseId) return { lyrics: null, source: null };

    const browseRes = await fetch(`${BASE_URL}/youtubei/v1/browse?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cfg.cookieHeader ? { Cookie: cfg.cookieHeader } : {}),
      },
      body: JSON.stringify({ context: cfg.context, browseId }),
    });
    if (!browseRes.ok) return { lyrics: null, source: null };
    const browseData = await browseRes.json();
    const shelf = browseData.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer;
    const lyricsText = shelf?.description?.runs?.map((r: any) => r.text).join('') || null;
    const source = shelf?.footer?.runs?.map((r: any) => r.text).join('') || null;

    return { lyrics: lyricsText, source };
  } catch {
    return { lyrics: null, source: null };
  }
}

export default {
  parseCookies,
  getInnertubeConfig,
  extractVideoId,
  extractBrowseId,
  search,
  findBestMatchByTitleAndDuration,
  getAudioStream,
  getTrack,
  getLyrics,
};
