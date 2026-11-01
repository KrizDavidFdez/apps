import type { Request, Response } from 'express';
import { getLyrics as getYTLyrics } from './ytmusic';

interface WordToken {
  text: string;
  start: number;
  end: number;
  hasSpace?: boolean;
}

interface FormattedLyricLine {
  text: string;
  time: number;
  align: 'left' | 'right' | 'center';
  agent: string;
  words?: WordToken[];
}

interface CachedLyrics {
  lyrics: FormattedLyricLine[];
  source: string;
  isSynced: boolean;
  duration: number;
  timestamp: number;
}

const lyricsCache = new Map<string, CachedLyrics>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cleanLyricText(str: string): string {
  let cleaned = str || '';
  if (cleaned.includes('^')) {
    cleaned = cleaned.split('^')[0];
  }
  return cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Computes natural word-level timestamps for an LRC line when word tags are not available
 */
function computeLineWords(
  rawText: string,
  lineStart: number,
  nextLineStart?: number
): WordToken[] {
  const wordsList = rawText.split(/\s+/).filter(Boolean);
  const N = wordsList.length;
  if (N === 0) return [];

  const hasNextLine = typeof nextLineStart === 'number';
  const rawGap = hasNextLine ? Math.max(0.3, nextLineStart - lineStart) : 4.0;

  const wordWeights = wordsList.map((w, idx) => {
    const clean = w.replace(/[^\p{L}\p{N}]/gu, '');
    const vowels = (clean.match(/[aeiouyáéíóúäëïöü]/gi) || []).length;
    const syllables = Math.max(1, vowels);
    let weight = syllables * 0.75 + Math.min(0.5, clean.length * 0.08);
    if (/[;,]$/.test(w)) weight += 0.22;
    if (/[.!?]$/.test(w)) weight += 0.35;
    if (idx === N - 1) weight += 0.40;
    return weight;
  });

  const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;
  const singingDuration = Math.min(rawGap, 4.5);

  let cur = lineStart;
  return wordsList.map((w, idx) => {
    const dur = (wordWeights[idx] / totalWeight) * singingDuration;
    const start = cur;
    cur += dur;
    return {
      text: w,
      start,
      end: cur,
      hasSpace: idx < N - 1,
    };
  });
}

/**
 * Parses enhanced LRC format, e.g.:
 * [00:27.40]<00:27.40>I <00:27.55>been <00:27.74>tryna <00:28.08>call <00:28.96>
 */
function parseEnhancedLrcToLines(lrcText: string): FormattedLyricLine[] {
  const lines: FormattedLyricLine[] = [];
  const rawLines = lrcText.split('\n');
  const lineTimeRegex = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g;
  const wordTimeRegex = /<(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)>([^<]*)/g;

  const toSec = (m: string, s: string) => parseInt(m, 10) * 60 + parseFloat(s);

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed || /^\[(ti|ar|al|by|offset|length):/i.test(trimmed)) continue;

    const lineTags = [...trimmed.matchAll(lineTimeRegex)];
    if (lineTags.length === 0) continue;

    const lineStart = toSec(lineTags[0][1], lineTags[0][2]);
    const content = trimmed.replace(lineTimeRegex, '').trim();

    // Check if line contains word-level tags <mm:ss.xx>
    const wordMatches = [...content.matchAll(wordTimeRegex)];
    const words: WordToken[] = [];

    if (wordMatches.length > 0) {
      for (let wIdx = 0; wIdx < wordMatches.length; wIdx++) {
        const curM = wordMatches[wIdx];
        const nextM = wordMatches[wIdx + 1];
        const wStart = toSec(curM[1], curM[2]);
        const wEnd = nextM ? toSec(nextM[1], nextM[2]) : wStart + 0.45;
        const wText = curM[3].trim();
        if (wText) {
          words.push({
            text: wText,
            start: wStart,
            end: wEnd,
            hasSpace: curM[3].endsWith(' ') || wIdx < wordMatches.length - 1,
          });
        }
      }
    }

    const cleanText = cleanLyricText(content.replace(/<\d{1,2}:\d{1,2}(?:\.\d{1,3})?>/g, '').trim());

    if (cleanText) {
      lines.push({
        text: cleanText,
        time: lineStart,
        align: 'left',
        agent: 'v1',
        words: words.length > 0 ? words : undefined,
      });
    }
  }

  lines.sort((a, b) => a.time - b.time);

  // Compute word weights if word tags were not present
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    const nxt = lines[i + 1];
    if (cur.text && !cur.words) {
      cur.words = computeLineWords(cur.text, cur.time, nxt?.time);
    }
  }

  return lines;
}

function parsePlainTextToLines(text: string, estimatedDuration = 180): FormattedLyricLine[] {
  const rawLines = text
    .split('\n')
    .map((l) => cleanLyricText(l.trim()))
    .filter((l) => l.length > 0 && !/^lyrics powered by/i.test(l) && !/^source:/i.test(l));

  if (rawLines.length === 0) return [];

  const pace = Math.min(4.5, Math.max(2.5, (estimatedDuration * 0.85) / rawLines.length));

  return rawLines.map((t, idx) => ({
    text: t,
    time: idx * pace,
    align: 'left',
    agent: 'v1',
    words: computeLineWords(t, idx * pace, (idx + 1) * pace),
  }));
}

function parseTtmlToLines(ttml: string): FormattedLyricLine[] {
  const lines: FormattedLyricLine[] = [];
  const pRegex = /<p\s+begin="([^"]+)"(?:\s+end="([^"]+)")?(?:[^>]*ttm:agent="([^"]+)")?[^>]*>(.*?)<\/p>/gi;
  let match;

  const toSeconds = (val?: string): number => {
    if (!val) return 0;
    const parts = val.trim().split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(val) || 0;
  };

  while ((match = pRegex.exec(ttml)) !== null) {
    const beginSec = toSeconds(match[1]);
    const agentVal = (match[3] || 'v1').toLowerCase().trim();
    const rawInner = match[4] || '';

    const isVoiceB = agentVal === 'b' || agentVal === 'v2';
    const align: 'left' | 'right' | 'center' = isVoiceB ? 'right' : 'left';
    const agent = isVoiceB ? 'v2' : 'v1';

    const spanRegex = /<span\s+begin="([^"]+)"(?:\s+end="([^"]+)")?[^>]*>(.*?)<\/span>/gi;
    const words: WordToken[] = [];
    let spanMatch;

    while ((spanMatch = spanRegex.exec(rawInner)) !== null) {
      const sStart = toSeconds(spanMatch[1]);
      const sEnd = toSeconds(spanMatch[2]) || sStart + 0.35;
      const sText = spanMatch[3].replace(/<[^>]+>/g, '').trim();
      if (sText) {
        words.push({
          text: sText,
          start: sStart,
          end: sEnd,
          hasSpace: true,
        });
      }
    }

    const fullText = cleanLyricText(rawInner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (fullText) {
      lines.push({
        text: fullText,
        time: beginSec,
        align,
        agent,
        words: words.length > 0 ? words : undefined,
      });
    }
  }

  return lines;
}

/**
 * Normalizes songData from lrc.red (.song.json) into FormattedLyricLine[]
 */
function formatLrcRedSongData(songData: any): FormattedLyricLine[] {
  if (Array.isArray(songData?.lyrics?.lines) && songData.lyrics.lines.length > 0) {
    return songData.lyrics.lines.map((line: any, idx: number, arr: any[]) => {
      const rawVoice = (line.voice || line.agent || 'a').toLowerCase().trim();
      const isVoiceB = rawVoice === 'b' || rawVoice === 'v2' || rawVoice === '2' || rawVoice === 'right';
      const align: 'left' | 'right' | 'center' = isVoiceB ? 'right' : 'left';
      const agent = isVoiceB ? 'v2' : 'v1';

      const words: WordToken[] = [];
      if (Array.isArray(line.words)) {
        for (const group of line.words) {
          if (Array.isArray(group)) {
            group.forEach((syl: any, sIdx: number) => {
              const start = typeof syl.begin === 'number' ? syl.begin : parseFloat(syl.begin) || 0;
              const end = typeof syl.end === 'number' ? syl.end : parseFloat(syl.end) || start + 0.35;
              words.push({
                text: String(syl.text || ''),
                start,
                end,
                hasSpace: sIdx === group.length - 1,
              });
            });
          } else if (group && typeof group === 'object') {
            const start = typeof group.begin === 'number' ? group.begin : parseFloat(group.begin) || 0;
            const end = typeof group.end === 'number' ? group.end : parseFloat(group.end) || start + 0.35;
            words.push({
              text: String(group.text || ''),
              start,
              end,
              hasSpace: true,
            });
          }
        }
      }

      const time = typeof line.begin === 'number' ? line.begin : parseFloat(line.begin) || 0;
      const cleanText = cleanLyricText(line.text || '');

      return {
        text: cleanText,
        time,
        align,
        agent,
        words: words.length > 0 ? words : computeLineWords(cleanText, time, arr[idx + 1]?.begin),
      };
    });
  }

  if (typeof songData?.source === 'string' && songData.source.includes('<p')) {
    return parseTtmlToLines(songData.source);
  }

  return [];
}

export default async function handler(req: Request | any, res: Response | any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const isrcParam = String(req.query?.isrc || req.query?.id || '').trim();
  const rawTitle = String(req.query?.title || '').trim();
  const rawArtist = String(req.query?.artist || '').trim();
  const qParam = String(req.query?.q || '').trim();
  const durationParam = Number(req.query?.duration || 0);

  // Clean title & artist for optimal database matching
  const cleanTitle = (rawTitle || qParam)
    .replace(/\s*[\(\[](feat|ft|with|con)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*[\(\[](official|audio|video|remastered|lyric|deluxe|version)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*-\s*(feat|ft|with|con).*$/gi, '')
    .replace(/\s*-\s*(official|audio|video|remastered).*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const primaryArtist = rawArtist
    .split(/[,&/x]/i)[0]
    .replace(/\s*(feat|ft|with|con)\.?.*$/gi, '')
    .trim();

  const cacheKey = `${cleanTitle || rawTitle}-${primaryArtist || rawArtist}`.toLowerCase();
  if (!cacheKey.trim()) {
    return res.status(400).json({ error: 'Title or artist required' });
  }

  // 1. Check in-memory cache
  const cached = lyricsCache.get(cacheKey) || (isrcParam ? lyricsCache.get(isrcParam.toLowerCase()) : null);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached);
  }

  try {
    // -------------------------------------------------------------
    // EXCLUSIVE PROVIDER: LRC.red (Apple Music TTML / Word-Synced Lyrics)
    // -------------------------------------------------------------

    // 1) Direct ISRC query if standard 12-char ISRC or ID
    const isStandardIsrc =
      /^[A-Za-z]{2}[A-Za-z0-9]{3}[0-9]{7}$/i.test(isrcParam) ||
      (/^[A-Za-z0-9_-]{10,15}$/.test(isrcParam) && !/^\d+$/.test(isrcParam));

    if (isStandardIsrc) {
      try {
        const directRes = await fetch(`https://lrc.red/s/${isrcParam.toUpperCase()}.song.json`, {
          headers: { accept: 'application/json', 'user-agent': 'AppleMusic/3.0' },
        });
        if (directRes.ok) {
          const sJson = await directRes.json();
          const lines = formatLrcRedSongData(sJson);
          if (lines.length > 0) {
            const result: CachedLyrics = {
              lyrics: lines,
              source: 'LRC.red (Apple Music)',
              isSynced: true,
              duration: sJson.duration || durationParam || 0,
              timestamp: Date.now(),
            };
            lyricsCache.set(cacheKey, result);
            return res.json(result);
          }
        }
      } catch {}
    }

    // 2) Multi-tier Search Queries against LRC.red
    const searchTerms = [
      `${cleanTitle} ${primaryArtist}`.trim(),
      `${rawTitle} ${primaryArtist}`.trim(),
      `${cleanTitle} ${rawArtist}`.trim(),
      `${rawTitle} ${rawArtist}`.trim(),
      cleanTitle,
      rawTitle,
      qParam,
    ].filter((val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx);

    for (const term of searchTerms) {
      try {
        const sRes = await fetch(`https://lrc.red/search.json?q=${encodeURIComponent(term)}`, {
          headers: { accept: 'application/json', 'user-agent': 'AppleMusic/3.0' },
        });

        if (!sRes.ok) continue;

        const sJson: any = await sRes.json();
        const hits: any[] = Array.isArray(sJson.hits) ? sJson.hits : [];
        if (hits.length === 0) continue;

        // Rank hits: match title, artist and duration closeness
        let bestHit = hits[0];
        if (hits.length > 1) {
          let bestScore = -1;
          const targetTitleLower = (cleanTitle || rawTitle).toLowerCase();
          const targetArtistLower = (primaryArtist || rawArtist).toLowerCase();

          for (const hit of hits) {
            let score = 0;
            const hitTitle = (hit.title || '').toLowerCase();
            const hitArtist = (hit.artist || '').toLowerCase();

            if (hitTitle === targetTitleLower) score += 50;
            else if (hitTitle.includes(targetTitleLower) || targetTitleLower.includes(hitTitle)) score += 25;

            if (hitArtist === targetArtistLower) score += 40;
            else if (hitArtist.includes(targetArtistLower) || targetArtistLower.includes(hitArtist)) score += 20;

            if (durationParam > 0 && hit.duration > 0) {
              const diff = Math.abs(hit.duration - durationParam);
              if (diff <= 5) score += 30;
              else if (diff <= 15) score += 15;
            }

            if (score > bestScore) {
              bestScore = score;
              bestHit = hit;
            }
          }
        }

        const isrc = bestHit?.isrc;
        if (!isrc) continue;

        // Try .song.json first (rich word tokens)
        try {
          const songRes = await fetch(`https://lrc.red/s/${isrc}.song.json`, {
            headers: { accept: 'application/json', 'user-agent': 'AppleMusic/3.0' },
          });
          if (songRes.ok) {
            const songData = await songRes.json();
            const lines = formatLrcRedSongData(songData);
            if (lines.length > 0) {
              const result: CachedLyrics = {
                lyrics: lines,
                source: 'LRC.red (TTML Syllable)',
                isSynced: true,
                duration: songData.duration || bestHit.duration || durationParam || 0,
                timestamp: Date.now(),
              };
              lyricsCache.set(cacheKey, result);
              return res.json(result);
            }
          }
        } catch {}

        // Fallback: Try .lrc (enhanced word-level LRC)
        try {
          const lrcRes = await fetch(`https://lrc.red/s/${isrc}.lrc`, {
            headers: { 'user-agent': 'AppleMusic/3.0' },
          });
          if (lrcRes.ok) {
            const lrcText = await lrcRes.text();
            const lines = parseEnhancedLrcToLines(lrcText);
            if (lines.length > 0) {
              const result: CachedLyrics = {
                lyrics: lines,
                source: 'LRC.red (Enhanced LRC)',
                isSynced: true,
                duration: bestHit.duration || durationParam || 0,
                timestamp: Date.now(),
              };
              lyricsCache.set(cacheKey, result);
              return res.json(result);
            }
          }
        } catch {}

        // Fallback: Try .ttml
        try {
          const ttmlRes = await fetch(`https://lrc.red/s/${isrc}.ttml`, {
            headers: { 'user-agent': 'AppleMusic/3.0' },
          });
          if (ttmlRes.ok) {
            const ttmlText = await ttmlRes.text();
            const lines = parseTtmlToLines(ttmlText);
            if (lines.length > 0) {
              const result: CachedLyrics = {
                lyrics: lines,
                source: 'LRC.red (TTML)',
                isSynced: true,
                duration: bestHit.duration || durationParam || 0,
                timestamp: Date.now(),
              };
              lyricsCache.set(cacheKey, result);
              return res.json(result);
            }
          }
        } catch {}
      } catch (err) {
        // Try next search term
      }
    }

    // Secondary fallback: YouTube Music Official / Lyrist if LRC.red didn't have it
    try {
      const ytQuery = `${cleanTitle} ${primaryArtist}`.trim();
      const ytResult = await getYTLyrics(ytQuery);
      if (ytResult?.lyrics) {
        const lines = parsePlainTextToLines(ytResult.lyrics, durationParam || 180);
        if (lines.length > 0) {
          const result: CachedLyrics = {
            lyrics: lines,
            source: 'YouTube Music Lyrics',
            isSynced: false,
            duration: durationParam || 180,
            timestamp: Date.now(),
          };
          lyricsCache.set(cacheKey, result);
          return res.json(result);
        }
      }
    } catch {}

    try {
      const lyristUrl = `https://lyrist.veran.ch/api/${encodeURIComponent(cleanTitle)}/${encodeURIComponent(primaryArtist)}`;
      const lyRes = await fetch(lyristUrl, { headers: { 'User-Agent': 'AppleMusic/3.0' } });
      if (lyRes.ok) {
        const lyData: any = await lyRes.json();
        if (lyData?.lyrics) {
          const lines = parsePlainTextToLines(lyData.lyrics, durationParam || 180);
          if (lines.length > 0) {
            const result: CachedLyrics = {
              lyrics: lines,
              source: 'Lyrist',
              isSynced: false,
              duration: durationParam || 180,
              timestamp: Date.now(),
            };
            lyricsCache.set(cacheKey, result);
            return res.json(result);
          }
        }
      }
    } catch {}

    return res.status(404).json({
      error: 'No se encontraron letras para esta canción',
    });
  } catch (err) {
    console.error('Lyrics handler error:', err);
    return res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
}
