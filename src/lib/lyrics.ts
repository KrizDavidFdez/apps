import { LyricLine } from '../types';

export function cleanLyricText(str: string): string {
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
 * Computes natural, balanced singing timestamps for each word in a standard LRC lyric line.
 */
export function computeLineWords(
  rawText: string,
  lineStart: number,
  nextLineStart?: number
): { text: string; start: number; end: number }[] {
  const wordsList = rawText.split(/\s+/).filter(Boolean);
  const N = wordsList.length;
  if (N === 0) return [];

  const hasNextLine = typeof nextLineStart === 'number';
  const rawGap = hasNextLine ? Math.max(0.3, nextLineStart - lineStart) : 4.0;

  // Calculate proportional musical weight for each word based on syllables, length, and cadence
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

  const totalSyllables = wordsList.reduce((sum, w) => {
    const clean = w.replace(/[^\p{L}\p{N}]/gu, '');
    const v = (clean.match(/[aeiouyáéíóúäëïöü]/gi) || []).length;
    return sum + Math.max(1, v);
  }, 0);

  const estimatedNaturalDuration = totalSyllables * 0.35 + N * 0.12;

  let singingDuration: number;
  if (rawGap > 4.5) {
    singingDuration = Math.min(rawGap - 0.8, Math.max(1.8, Math.min(estimatedNaturalDuration * 1.1, 4.2)));
  } else {
    const breath = rawGap > 2.2 ? Math.min(0.38, rawGap * 0.1) : Math.min(0.18, rawGap * 0.06);
    singingDuration = Math.max(0.25, rawGap - breath);
  }

  let cur = lineStart;
  return wordsList.map((w, idx) => {
    const dur = (wordWeights[idx] / totalWeight) * singingDuration;
    const start = cur;
    cur += dur;
    return {
      text: w,
      start,
      end: cur,
    };
  });
}

export async function fetchLyricsFromDB(
  idOrIsrc: string,
  title?: string,
  artist?: string,
  duration?: number
): Promise<{
  lyrics: LyricLine[];
  source: string;
  isSynced: boolean;
  duration?: number;
} | null> {
  try {
    const params = new URLSearchParams();
    if (idOrIsrc) params.set('isrc', idOrIsrc);
    if (title) params.set('title', title);
    if (artist) params.set('artist', artist);
    if (duration && duration > 0) params.set('duration', String(duration));

    const response = await fetch(`/api/lyrics?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();

    if (data && Array.isArray(data.lyrics)) {
      return {
        lyrics: data.lyrics,
        source: data.source || 'LRC.red',
        isSynced: Boolean(data.isSynced),
        duration: data.duration,
      };
    }

    return null;
  } catch (err) {
    console.error('fetchLyricsFromDB error:', err);
    return null;
  }
}
