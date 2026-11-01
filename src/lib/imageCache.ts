// High-performance In-Memory Cache for Images, Search queries, and Palette colors

const imageMemoryCache = new Set<string>();
const searchMemoryCache = new Map<string, any>();

/**
 * Preload and cache an image in memory so it renders instantaneously without decode lag.
 */
export function preloadImage(url?: string | null): void {
  if (!url || imageMemoryCache.has(url)) return;
  imageMemoryCache.add(url);

  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

/**
 * Preload a list of track cover images
 */
export function preloadTrackCovers(tracks: { coverUrl?: string }[]): void {
  if (!Array.isArray(tracks)) return;
  for (let i = 0; i < Math.min(tracks.length, 25); i++) {
    const url = tracks[i]?.coverUrl;
    if (url) preloadImage(url);
  }
}

/**
 * Cache for search query results to provide instant 0ms responses for repeated queries.
 */
export function getCachedSearchResults(query: string): any | null {
  const clean = query.trim().toLowerCase();
  return searchMemoryCache.get(clean) || null;
}

export function setCachedSearchResults(query: string, data: any): void {
  const clean = query.trim().toLowerCase();
  if (searchMemoryCache.size > 80) {
    const firstKey = searchMemoryCache.keys().next().value;
    if (firstKey) searchMemoryCache.delete(firstKey);
  }
  searchMemoryCache.set(clean, data);
}
