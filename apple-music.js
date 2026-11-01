#!/usr/bin/env node
/**
 * apple-music.js — Single-file ESM wrapper + CLI for music.apple.com
 *
 * Node.js ≥ 18  |  Zero dependency
 *
 * CLI:
 *   node apple-music.js search "query"
 *   node apple-music.js song <id>
 *   node apple-music.js album <id>
 *   node apple-music.js artist <id>
 *   node apple-music.js playlist <id>
 *   node apple-music.js charts
 *   node apple-music.js home
 *   node apple-music.js suggest "query"
 *   node apple-music.js token
 *
 * Library:
 *   import { search, getSong, charts, resolve } from "./apple-music.js";
 */

let cachedToken = null;
let tokenExpiresAt = 0;

function decodeJwt(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function extractToken(text) {
  const m = text.match(/(eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

async function findJsBundleUrl() {
  const res = await fetch('https://music.apple.com/us/browse', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch music.apple.com: ${res.status}`);
  const html = await res.text();

  const scriptMatch =
    html.match(/src="(\/assets\/index[^"]+\.js)"/) ||
    html.match(/src="(\/assets\/[^"]*index[^"]*\.js)"/) ||
    html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);

  if (scriptMatch) {
    const src = scriptMatch[1];
    return src.startsWith('http') ? src : `https://music.apple.com${src}`;
  }

  const all = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const candidate = all.find((s) => /index|main|app/i.test(s));
  if (candidate) return candidate.startsWith('http') ? candidate : `https://music.apple.com${candidate}`;
  throw new Error('JS bundle not found on music.apple.com');
}

export async function fetchToken({ force = false } = {}) {
  if (!force && cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const jsUrl = await findJsBundleUrl();
  const res = await fetch(jsUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch JS bundle: ${res.status}`);

  const token = extractToken(await res.text());
  if (!token) throw new Error('Token not found in JS bundle');

  const decoded = decodeJwt(token);
  if (!decoded) throw new Error('Invalid JWT token');

  cachedToken = token;
  tokenExpiresAt = (decoded.exp || Math.floor(Date.now() / 1000) + 3600) * 1000;
  return token;
}

const BASE = 'https://amp-api.music.apple.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function request(path, { params = {}, headers = {}, method = 'GET', body } = {}) {
  let token = cachedToken;
  if (!token || Date.now() >= tokenExpiresAt - 60_000) {
    token = await fetchToken();
  }

  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Origin: 'https://music.apple.com',
      'User-Agent': UA,
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await fetchToken({ force: true });
    return request(path, { params, headers, method, body });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apple Music API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export function formatArtworkUrl(artwork, opts = {}) {
  if (!artwork?.url) return null;
  let url = artwork.url;
  const w = opts.width || opts.size || artwork.width || 600;
  const h = opts.height || opts.size || artwork.height || 600;
  if (opts.format) {
    const i = url.lastIndexOf('.');
    if (i !== -1) url = url.slice(0, i + 1) + opts.format;
  }
  return url.replace('{w}', String(w)).replace('{h}', String(h));
}

export function simplify(item, artworkSize = 600) {
  if (!item) return item;
  const a = item.attributes || {};
  const type = item.type || '';
  const base = {
    id: item.id,
    type: type.replace(/s$/, '') || type,
    name: a.name || null,
    url: a.url || null,
    artwork: a.artwork ? formatArtworkUrl(a.artwork, { size: artworkSize }) : null,
  };

  if (type === 'songs' || type === 'song') {
    return {
      ...base,
      artist: a.artistName || null,
      album: a.albumName || null,
      durationSec: a.durationInMillis ? Math.round(a.durationInMillis / 1000) : null,
      releaseDate: a.releaseDate || null,
      isrc: a.isrc || null,
      genres: a.genreNames || [],
      trackNumber: a.trackNumber ?? null,
      discNumber: a.discNumber ?? null,
    };
  }
  if (type === 'albums' || type === 'album') {
    return {
      ...base,
      artist: a.artistName || null,
      trackCount: a.trackCount ?? null,
      releaseDate: a.releaseDate || null,
      upc: a.upc || null,
      genres: a.genreNames || [],
      recordLabel: a.recordLabel || null,
    };
  }
  if (type === 'artists' || type === 'artist') {
    return {
      ...base,
      genres: a.genreNames || [],
    };
  }
  if (type === 'playlists' || type === 'playlist') {
    return {
      ...base,
      curator: a.curatorName || null,
      description: a.description?.short || a.description?.standard || null,
      trackCount: a.trackCount ?? null,
      lastModified: a.lastModifiedDate || null,
    };
  }
  return {
    ...base,
    artist: a.artistName || a.curatorName || null,
    durationSec: a.durationInMillis ? Math.round(a.durationInMillis / 1000) : null,
    releaseDate: a.releaseDate || null,
  };
}

export async function search(term, options = {}) {
  const {
    country = 'us',
    types = 'songs,albums,artists,playlists',
    limit = 25,
    includeTop = true,
    lang = 'en-US',
  } = options;

  const params = { term, types, limit, l: lang, platform: 'web' };
  if (includeTop) params.with = 'serverBubbles';

  const json = await request(`/v1/catalog/${country}/search`, { params });
  if (!json.results) return json;

  const keyMap = { song: 'songs', album: 'albums', artist: 'artists', playlist: 'playlists', top: 'top' };
  const results = {};
  for (const [key, val] of Object.entries(json.results)) {
    const k = keyMap[key] || key;
    results[k] = (val.data || val).map((x) => simplify(x));
  }
  return results;
}

export async function suggestions(term, options = {}) {
  const {
    country = 'us',
    limit = 10,
    lang = 'en-US',
    types = 'songs,albums,artists,playlists',
  } = options;
  const json = await request(`/v1/catalog/${country}/search/suggestions`, {
    params: {
      term,
      types,
      kinds: 'terms,topResults',
      limit,
      l: lang,
      platform: 'web',
    },
  });
  return json.results?.suggestions || json;
}

export async function get(type, id, options = {}) {
  const { country = 'us', include, lang = 'en-US' } = options;
  const params = { l: lang };
  if (include) params.include = Array.isArray(include) ? include.join(',') : include;
  const json = await request(`/v1/catalog/${country}/${type}/${id}`, { params });
  const item = json.data?.[0] || json;
  if (options.raw) return item;
  const simple = simplify(item);
  const tracks = item.relationships?.tracks?.data;
  if (tracks?.length) {
    simple.tracks = tracks.map((t) => simplify(t));
  }
  return simple;
}

export async function getSong(id, options = {}) {
  return get('songs', id, { include: options.include || 'artists,albums', ...options });
}

export async function getAlbum(id, options = {}) {
  return get('albums', id, { include: options.include || 'artists,tracks', ...options });
}

export async function getArtist(id, options = {}) {
  return get('artists', id, { include: options.include || 'albums', ...options });
}

export async function getPlaylist(id, options = {}) {
  return get('playlists', id, { include: options.include || 'tracks', ...options });
}

export async function charts(options = {}) {
  const {
    country = 'us',
    types = 'songs,albums,playlists',
    limit = 20,
    genre,
    chart,
  } = options;

  const params = { types, limit };
  if (genre) params.genre = genre;
  if (chart) params.chart = chart;

  const json = await request(`/v1/catalog/${country}/charts`, { params });
  const results = {};
  for (const [key, chartsArr] of Object.entries(json.results || {})) {
    results[key] = (chartsArr || []).map((c) => ({
      name: c.name,
      chart: c.chart,
      href: c.href,
      next: c.next,
      data: (c.data || []).map((x) => simplify(x)),
    }));
  }
  return results;
}

export async function home(options = {}) {
  const { country = 'us', limit = 20 } = options;
  const c = await charts({ country, types: 'songs,albums,playlists', limit });
  return {
    country,
    topSongs: c.songs?.[0]?.data || [],
    topAlbums: c.albums?.[0]?.data || [],
    topPlaylists: c.playlists?.[0]?.data || [],
  };
}

export default {
  fetchToken,
  request,
  formatArtworkUrl,
  simplify,
  search,
  suggestions,
  get,
  getSong,
  getAlbum,
  getArtist,
  getPlaylist,
  charts,
  home,
};

// CLI execution handling
if (process.argv[1] && process.argv[1].endsWith('apple-music.js')) {
  const cmd = process.argv[2];
  const arg = process.argv[3];

  (async () => {
    try {
      if (cmd === 'search') {
        const res = await search(arg || '');
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'song') {
        const res = await getSong(arg);
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'album') {
        const res = await getAlbum(arg);
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'artist') {
        const res = await getArtist(arg);
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'playlist') {
        const res = await getPlaylist(arg);
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'charts') {
        const res = await charts();
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'home') {
        const res = await home();
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'suggest') {
        const res = await suggestions(arg || '');
        console.log(JSON.stringify(res, null, 2));
      } else if (cmd === 'token') {
        const t = await fetchToken();
        console.log(t);
      } else {
        console.log('Usage: node apple-music.js <search|song|album|artist|playlist|charts|home|suggest|token> [argument]');
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
