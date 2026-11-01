/**
 * Apple Music search wrapper helper.
 * Fallback implementation using Deezer / LRC.red when direct Apple Music scraping is unavailable.
 */
export async function search(query: string, options?: { types?: string; limit?: number }): Promise<{ songs?: any[]; artists?: any[]; albums?: any[] }> {
  const types = options?.types || 'songs';
  const limit = options?.limit || 30;

  const result: { songs?: any[]; artists?: any[]; albums?: any[] } = {};

  try {
    if (types.includes('songs')) {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data: any = await resp.json();
        result.songs = (data?.data || []).map((track: any) => ({
          id: String(track.id),
          name: track.title || '',
          artist: track.artist?.name || '',
          album: track.album?.title || '',
          artwork: track.album?.cover_big || track.album?.cover_medium || '',
          durationSec: track.duration || 210,
          isrc: track.id,
        }));
      }
    }

    if (types.includes('artists')) {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data: any = await resp.json();
        result.artists = (data?.data || []).map((artist: any) => ({
          id: String(artist.id),
          name: artist.name || '',
          artwork: artist.picture_big || artist.picture_medium || null,
        }));
      }
    }

    if (types.includes('albums')) {
      const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=${limit}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data: any = await resp.json();
        result.albums = (data?.data || []).map((album: any) => ({
          id: String(album.id),
          name: album.title || '',
          artist: album.artist?.name || '',
          artwork: album.cover_big || album.cover_medium || '',
          trackCount: album.nb_tracks || 0,
        }));
      }
    }
  } catch (err) {
    console.warn('Apple music helper fallback error:', err);
  }

  return result;
}
