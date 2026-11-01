import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Loader2 } from 'lucide-react';
import { Track, Artist, LyricLine, ViewMode, UserProfile, Playlist, HistoryItem, AlbumItem } from './types';
import { fetchLyricsFromDB } from './lib/lyrics';
import { LiquidBackground } from './components/LiquidBackground';
import { PlayerHeader } from './components/PlayerHeader';
import { LyricsView } from './components/LyricsView';
import { AlbumView } from './components/AlbumView';
import { PlayerControls } from './components/PlayerControls';
import { QueueModal } from './components/QueueModal';
import { HomeView } from './components/HomeView';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { DesktopPlayerSplitView } from './components/DesktopPlayerSplitView';
import { AirplayModal } from './components/AirplayModal';

const DEFAULT_USER: UserProfile = {
  id: 'user-1',
  name: 'Darling',
  photoUrl: '',
};

const FALLBACK_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg';

export default function App() {
  // Single User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('app_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            id: parsed.id || 'user-1',
            name: parsed.name && parsed.name !== 'Mi Perfil' ? parsed.name : 'Darling',
            photoUrl: parsed.photoUrl || '',
          };
        }
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // User-Specific Favorites Tracks State
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('user_favorite_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t) => t && typeof t === 'object' && typeof t.id === 'string' && typeof t.title === 'string'
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // User Custom Playlists (no unsolicited unsplash stock photos)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('user_custom_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strip any unwanted unsplash demo photos
          return parsed.map((p: Playlist) => ({
            ...p,
            coverUrl: p.coverUrl && p.coverUrl.includes('unsplash.com') ? '' : p.coverUrl,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Player-initiated playlist modals
  const [playerAddToPlaylistTrack, setPlayerAddToPlaylistTrack] = useState<Track | null>(null);
  const [isPlayerCreatePlaylistOpen, setIsPlayerCreatePlaylistOpen] = useState(false);

  // Recently Played History (Listening History)
  const [recentlyPlayed, setRecentlyPlayed] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('user_recently_played_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const handleCreatePlaylist = (name: string, coverUrl?: string) => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim() || 'Mi Playlist',
      coverUrl: coverUrl || '',
      createdAt: Date.now(),
      tracks: [],
    };
    setPlaylists((prev) => {
      const updated = [newPlaylist, ...prev];
      try {
        localStorage.setItem('user_custom_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((pl) => pl.id !== id);
      try {
        localStorage.setItem('user_custom_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Track) => {
    const cleanTrack: Track = {
      id: String(track.id),
      title: String(track.title || ''),
      artist: String(track.artist || ''),
      coverUrl: String(track.coverUrl || ''),
      audioUrl: track.audioUrl ? String(track.audioUrl) : undefined,
      duration: typeof track.duration === 'number' ? track.duration : 0,
      durationFormatted: track.durationFormatted ? String(track.durationFormatted) : undefined,
    };
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some((t) => t.id === cleanTrack.id)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, cleanTrack],
          coverUrl: pl.coverUrl || cleanTrack.coverUrl,
        };
      });
      try {
        localStorage.setItem('user_custom_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.id !== trackId),
        };
      });
      try {
        localStorage.setItem('user_custom_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Listened Artists for Dynamic Recommendation
  const [listenedArtists, setListenedArtists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('app_listened_artists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Recommended Track: Dynamically generated from listened artists or top hits
  const [recommendedTrack, setRecommendedTrack] = useState<Track | null>(null);

  // Search & List State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [albumResults, setAlbumResults] = useState<AlbumItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const HAWAI_REMIX_TRACK: Track = {
    id: 'USSD12300400',
    title: 'Según Quién',
    artist: 'Maluma, Carín León',
    coverUrl: 'https://lrc.red/s/USSD12300400.webp',
    duration: 142,
    durationFormatted: '02:22',
    isVerified: true,
  };

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([HAWAI_REMIX_TRACK]);

  // Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(HAWAI_REMIX_TRACK);
  const [queue, setQueue] = useState<Track[]>([HAWAI_REMIX_TRACK]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('lyrics');

  // Modals & Download State
  const [isDownloadingTrack, setIsDownloadingTrack] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [areLyricsControlsHidden, setAreLyricsControlsHidden] = useState(false);

  // Lyrics State
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isSynced, setIsSynced] = useState(true);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isKaraokeEffect, setIsKaraokeEffect] = useState<boolean>(true);

  // Playback mode states (Shuffle & Repeat)
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isAirplayOpen, setIsAirplayOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RACE CONDITION & AUDIO STALE PREVENTION REFS
  const activeRequestIdRef = useRef(0);
  const currentTrackIdRef = useRef<string | null>(null);

  // Profile functions
  const handleUpdateUserName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = { ...currentUser, name: trimmed };
    setCurrentUser(updated);
    try {
      localStorage.setItem('app_user_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save user profile to localStorage', e);
    }
  };

  const handleUpdateUserPhoto = (photoUrl: string) => {
    const updated = { ...currentUser, photoUrl };
    setCurrentUser(updated);
    try {
      localStorage.setItem('app_user_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save user profile to localStorage', e);
    }
  };

  // Toggle Favorite
  const toggleFavorite = (trackToToggle?: any) => {
    const isTrack =
      trackToToggle &&
      typeof trackToToggle === 'object' &&
      'id' in trackToToggle &&
      'title' in trackToToggle &&
      typeof trackToToggle.title === 'string' &&
      !('nativeEvent' in trackToToggle) &&
      !('target' in trackToToggle);

    const sourceTrack = isTrack ? trackToToggle : currentTrack;
    if (!sourceTrack || !sourceTrack.id || !sourceTrack.title) return;

    const cleanTrack: Track = {
      id: String(sourceTrack.id),
      title: String(sourceTrack.title || ''),
      artist: String(sourceTrack.artist || ''),
      coverUrl: String(sourceTrack.coverUrl || ''),
      audioUrl: sourceTrack.audioUrl ? String(sourceTrack.audioUrl) : undefined,
      duration: typeof sourceTrack.duration === 'number' ? sourceTrack.duration : 0,
      durationFormatted: sourceTrack.durationFormatted ? String(sourceTrack.durationFormatted) : undefined,
    };

    setFavorites((prev) => {
      const exists = prev.some(
        (t) => t && (t.id === cleanTrack.id || (t.title === cleanTrack.title && t.artist === cleanTrack.artist))
      );
      let updated: Track[];
      if (exists) {
        updated = prev.filter(
          (t) => t && !(t.id === cleanTrack.id || (t.title === cleanTrack.title && t.artist === cleanTrack.artist))
        );
      } else {
        updated = [cleanTrack, ...prev];
      }

      try {
        const payload = updated.map((t) => ({
          id: String(t.id),
          title: String(t.title || ''),
          artist: String(t.artist || ''),
          coverUrl: String(t.coverUrl || ''),
          audioUrl: t.audioUrl ? String(t.audioUrl) : undefined,
          duration: typeof t.duration === 'number' ? t.duration : 0,
          durationFormatted: t.durationFormatted ? String(t.durationFormatted) : undefined,
        }));
        localStorage.setItem('user_favorite_tracks', JSON.stringify(payload));
      } catch (err) {
        console.warn('Failed to serialize favorites:', err);
      }

      return updated;
    });
  };

  const isCurrentFavorite = Boolean(
    currentTrack &&
      favorites.some(
        (t) => t.id === currentTrack.id || (t.title === currentTrack.title && t.artist === currentTrack.artist)
      )
  );

  // Dynamic recommendation fetcher based on listened artists
  const fetchRecommendationForArtists = useCallback((artists: string[], fallbackList: Track[]) => {
    if (artists.length > 0) {
      // Pick a random artist from listened artists list
      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      fetch(`/api/search?q=${encodeURIComponent(randomArtist)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            // Select one of the top hits of this listened artist
            const topHits = data.slice(0, 8);
            const chosen = topHits[Math.floor(Math.random() * topHits.length)];
            setRecommendedTrack(chosen);
          } else if (fallbackList.length > 0) {
            const randomIndex = Math.floor(Math.random() * fallbackList.length);
            setRecommendedTrack(fallbackList[randomIndex] || fallbackList[0]);
          }
        })
        .catch(() => {
          if (fallbackList.length > 0) {
            const randomIndex = Math.floor(Math.random() * fallbackList.length);
            setRecommendedTrack(fallbackList[randomIndex] || fallbackList[0]);
          }
        });
    } else if (fallbackList.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallbackList.length);
      setRecommendedTrack(fallbackList[randomIndex] || fallbackList[0]);
    }
  }, []);

  // Fetch top songs dynamically from backend
  useEffect(() => {
    fetch('/api/top-songs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const listWithHawai = [
            HAWAI_REMIX_TRACK,
            ...data.filter((t: any) => t.id !== HAWAI_REMIX_TRACK.id && t.title !== HAWAI_REMIX_TRACK.title),
          ];
          setTrendingTracks(listWithHawai);
          setQueue(listWithHawai);

          // If user has listened artists, recommend from their top songs; otherwise recommend from trending
          fetchRecommendationForArtists(listenedArtists, listWithHawai);

          if (!currentTrack) {
            setCurrentTrack(HAWAI_REMIX_TRACK);
            currentTrackIdRef.current = HAWAI_REMIX_TRACK.id;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load top songs:', err);
      });
  }, [fetchRecommendationForArtists]);

  // Handle URL song parameters for Direct Shared URLs
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get('track');
      const songTitle = urlParams.get('title');
      const songArtist = urlParams.get('artist');

      if (trackId || songTitle) {
        const q = songArtist && songTitle ? `${songArtist} ${songTitle}` : (songTitle || trackId || '');
        fetch(`/api/search?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((resTracks) => {
            if (Array.isArray(resTracks) && resTracks.length > 0) {
              playTrack(resTracks[0]);
              setIsPlayerOpen(true);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignored
    }
  }, []);

  // Preload lyrics for initial track
  useEffect(() => {
    if (currentTrack) {
      fetchLyricsFromDB(currentTrack.id, currentTrack.title, currentTrack.artist).then((res) => {
        if (res && res.lyrics.length > 0) {
          setLyrics(res.lyrics);
          setIsSynced(res.isSynced);
        }
      });
    }
  }, []);

  // Live Search handler with instant 120ms debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(() => {
      Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/search-artists?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/search-albums?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).catch(() => []),
      ])
        .then(([tracks, artists, albums]) => {
          if (Array.isArray(tracks)) setSearchResults(tracks);
          if (Array.isArray(artists)) setArtistResults(artists);
          if (Array.isArray(albums)) setAlbumResults(albums);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 120);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Detect 30-second preview clips
  const is30sPreview = (url?: string): boolean => {
    if (!url) return false;
    const l = url.toLowerCase();
    return (
      l.includes('itunes.apple.com') ||
      l.includes('audiopreview') ||
      l.includes('mzstatic.com') ||
      (l.includes('deezer') && l.includes('preview'))
    );
  };

  // Play track: instantly load and play audio in parallel with lyrics, with robust fallback
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    const requestId = ++activeRequestIdRef.current;
    currentTrackIdRef.current = track.id;

    // Track listened artist progressively
    const artistName = track.artist?.trim();
    if (artistName && artistName.toLowerCase() !== 'unknown artist') {
      setListenedArtists((prev) => {
        const filtered = prev.filter((a) => a.toLowerCase() !== artistName.toLowerCase());
        const updated = [artistName, ...filtered].slice(0, 15);
        try {
          localStorage.setItem(`user_listened_artists_${currentUser.id}`, JSON.stringify(updated));
          localStorage.setItem('app_listened_artists', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    setCurrentTrack(track);
    setViewMode('album');
    setAreLyricsControlsHidden(false);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else {
      if (searchResults.length > 0 && searchResults.some((t) => t.id === track.id)) {
        setQueue(searchResults);
      } else {
        setQueue((prevQueue) => {
          if (prevQueue.some((t) => t.id === track.id)) return prevQueue;
          return [...prevQueue, track];
        });
      }
    }
    setCurrentTime(0);
    if (track.duration && track.duration > 0) {
      setDuration(track.duration);
    }
    setIsPlayerOpen(true);
    setIsDownloadingTrack(true);
    setIsPlaying(false);
    setLyrics([]);
    setIsSynced(false);
    setIsLoadingLyrics(true);

    // Record to recently played history
    setRecentlyPlayed((prev) => {
      const cleanTrack: Track = {
        id: String(track.id),
        title: String(track.title || ''),
        artist: String(track.artist || ''),
        coverUrl: String(track.coverUrl || ''),
        audioUrl: track.audioUrl ? String(track.audioUrl) : undefined,
        duration: typeof track.duration === 'number' ? track.duration : 0,
        durationFormatted: track.durationFormatted ? String(track.durationFormatted) : undefined,
      };
      const filtered = prev.filter((item) => item.track.id !== cleanTrack.id);
      const newItem: HistoryItem = {
        id: `${cleanTrack.id}-${Date.now()}`,
        track: cleanTrack,
        playedAt: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('user_recently_played_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Immediately stop old audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    // Fetch lyrics in background (non-blocking)
    fetchLyricsFromDB(track.id, track.title, track.artist, track.duration)
      .then((result) => {
        if (requestId !== activeRequestIdRef.current || currentTrackIdRef.current !== track.id) return;
        if (result && result.lyrics.length > 0) {
          setLyrics(result.lyrics);
          setIsSynced(result.isSynced);
          if (result.duration && result.duration > 0) {
            setDuration(result.duration);
            setCurrentTrack((prev) => prev && prev.id === track.id ? { ...prev, duration: result.duration! } : prev);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (requestId === activeRequestIdRef.current) setIsLoadingLyrics(false);
      });

    // Helper for playing stream fallback
    const playStreamFallback = (exactDuration = track.duration || 0, isRetry = false) => {
      const targetQuery = isRetry ? `${track.artist} ${track.title} audio oficial` : `${track.artist} ${track.title} audio`;
      const durParam = exactDuration ? `&duration=${exactDuration}` : '';
      const trackParams = `id=${encodeURIComponent(track.id)}&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&q=${encodeURIComponent(targetQuery)}${durParam}`;

      fetch(`/api/yt-audio?${trackParams}`)
        .then((res) => res.json())
        .then((data) => {
          if (requestId !== activeRequestIdRef.current || currentTrackIdRef.current !== track.id) return;

          const rawAudioUrl = data?.result?.downloadUrl || data?.result?.url;

          if (!rawAudioUrl && !isRetry) {
            playStreamFallback(exactDuration, true);
            return;
          }

          // URL directa de googlevideo: el <audio> la reproduce y hace seek (Range) por su cuenta
          const audioUrl = rawAudioUrl || null;
          const downloadUrl = rawAudioUrl || null;
          const durationVal = data?.result?.duration || exactDuration || track.duration || 0;

          if (durationVal > 0) {
            setDuration(durationVal);
          }

          setCurrentTrack((prev) =>
            prev && prev.id === track.id
              ? {
                  ...prev,
                  audioUrl,
                  downloadUrl,
                  duration: durationVal || prev.duration,
                }
              : prev
          );

          if (audioRef.current && audioUrl) {
            audioRef.current.src = audioUrl;
            audioRef.current.load();
            audioRef.current.play().then(() => {
              if (requestId === activeRequestIdRef.current) {
                setIsPlaying(true);
                setIsDownloadingTrack(false);
              }
            }).catch(() => {
              if (requestId === activeRequestIdRef.current) {
                setIsPlaying(false);
                setIsDownloadingTrack(false);
              }
            });
          } else {
            setIsPlaying(false);
            setIsDownloadingTrack(false);
          }
        })
        .catch(() => {
          if (requestId !== activeRequestIdRef.current || currentTrackIdRef.current !== track.id) return;
          setIsPlaying(false);
          setIsDownloadingTrack(false);
        });
    };

    const isApiEndpoint = (url: string) =>
      url.startsWith('/api/stream') ||
      url.startsWith('/api/yt-audio') ||
      url.startsWith('/api/audio');

    const directAudioUrl = track.audioUrl && !is30sPreview(track.audioUrl) && !isApiEndpoint(track.audioUrl) ? track.audioUrl : null;

    if (directAudioUrl && audioRef.current) {
      audioRef.current.src = directAudioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        if (requestId === activeRequestIdRef.current) {
          setIsPlaying(true);
          setIsDownloadingTrack(false);
        }
      }).catch(() => {
        playStreamFallback();
      });
    } else {
      playStreamFallback();
    }
  };

  const selectArtist = (artist: Artist) => {
    setIsSearching(true);
    fetch(`/api/artist-tracks?id=${encodeURIComponent(artist.id)}`)
      .then((res) => res.json())
      .then((tracks) => {
        if (Array.isArray(tracks) && tracks.length > 0) {
          setSearchResults(tracks);
        }
        setIsSearching(false);
      })
      .catch(() => {
        setIsSearching(false);
      });
  };

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current.src) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        } else if (currentTrack) {
          playTrack(currentTrack);
        }
      }
    }
  };

  const playNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentTrack) return;

    if (repeatMode === 'one') {
      handleSeek(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }

    let effectiveQueue = queue;
    if (effectiveQueue.length === 0) {
      effectiveQueue = trendingTracks.length > 0 ? trendingTracks : [currentTrack];
      setQueue(effectiveQueue);
    }

    let currentIndex = effectiveQueue.findIndex((t) => t.id === currentTrack.id);

    if (currentIndex === -1) {
      if (searchResults.length > 0 && searchResults.some((t) => t.id === currentTrack.id)) {
        effectiveQueue = searchResults;
        setQueue(searchResults);
        currentIndex = searchResults.findIndex((t) => t.id === currentTrack.id);
      } else if (trendingTracks.length > 0 && trendingTracks.some((t) => t.id === currentTrack.id)) {
        effectiveQueue = trendingTracks;
        setQueue(trendingTracks);
        currentIndex = trendingTracks.findIndex((t) => t.id === currentTrack.id);
      } else {
        effectiveQueue = [...effectiveQueue, currentTrack];
        setQueue(effectiveQueue);
        currentIndex = effectiveQueue.length - 1;
      }
    }

    if (isShuffle && effectiveQueue.length > 1) {
      let randIdx = Math.floor(Math.random() * effectiveQueue.length);
      if (randIdx === currentIndex) {
        randIdx = (currentIndex + 1) % effectiveQueue.length;
      }
      playTrack(effectiveQueue[randIdx], effectiveQueue);
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= effectiveQueue.length) {
      // End of current queue reached: pull more tracks from trending if available
      const unplayed = trendingTracks.filter((t) => !effectiveQueue.some((q) => q.id === t.id));
      if (unplayed.length > 0) {
        const expanded = [...effectiveQueue, ...unplayed];
        setQueue(expanded);
        playTrack(expanded[nextIndex], expanded);
        return;
      }
      // Wrap around so playback continues continuously (never stops)
      nextIndex = 0;
    }

    const nextTrack = effectiveQueue[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack, effectiveQueue);
    }
  };

  const playPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentTrack || queue.length === 0) return;

    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = queue[(currentIndex - 1 + queue.length) % queue.length];
    playTrack(prevTrack);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleLyricsView = () => {
    setViewMode((prev) => {
      const next = prev === 'lyrics' ? 'album' : 'lyrics';
      setAreLyricsControlsHidden(false);
      return next;
    });
  };

  // High-performance audio time tracking for UI scrubber & lyrics
  // Only runs when the player modal is active to prevent redundant re-renders of the home feed
  useEffect(() => {
    if (isPlayerOpen && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isPlayerOpen]);

  useEffect(() => {
    if (!isPlaying || !isPlayerOpen) return;
    let animId: number;
    let lastUiUpdate = 0;

    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const now = performance.now();
        // Update React state at ~4 FPS (250ms), ideal for seconds display & scrubber while saving mobile main thread
        if (now - lastUiUpdate >= 250) {
          lastUiUpdate = now;
          setCurrentTime(audioRef.current.currentTime);
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPlayerOpen]);

  // Active lyric index calculation
  const activeLyricIndex = useMemo(() => {
    if (!isSynced || lyrics.length === 0) return -1;
    const checkTime = currentTime + 0.02;

    for (let idx = lyrics.length - 1; idx >= 0; idx--) {
      if (checkTime >= lyrics[idx].time) {
        return idx;
      }
    }

    return -1;
  }, [lyrics, currentTime, isSynced]);

  const isIntroInstrumental = useMemo(() => {
    return isSynced && lyrics.length > 0 && currentTime < (lyrics[0]?.time ?? 0) - 0.08;
  }, [isSynced, lyrics, currentTime]);

  // MediaSession API integration
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: currentTrack.coverUrl ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
  }, [currentTrack, queue]);

  const handleOpenPlayer = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    setIsPlayerOpen(true);
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-black text-white overflow-hidden flex flex-col font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] relative select-none">
      {/* 1. Main Home View */}
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <HomeView
          tracks={trendingTracks}
          recommendedTrack={recommendedTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={playTrack}
          onOpenPlayer={handleOpenPlayer}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          artistResults={artistResults}
          albumResults={albumResults}
          isSearching={isSearching}
          onSelectArtist={selectArtist}
          favoriteTracks={favorites}
          onToggleFavorite={toggleFavorite}
          currentUser={currentUser}
          onUpdateUserName={handleUpdateUserName}
          onUpdateUserPhoto={handleUpdateUserPhoto}
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onAddTrackToPlaylist={handleAddTrackToPlaylist}
          onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
          recentHistory={recentlyPlayed}
        />
      </div>

      {/* 2. Floating Mini Player Bar (When player is minimized) */}
      <AnimatePresence>
        {currentTrack && !isPlayerOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={handleOpenPlayer}
            className="fixed bottom-15 sm:bottom-16 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-40 hover:bg-zinc-900 transition-all text-white font-['SF_Pro_Display',sans-serif]"
          >
            <img
              src={currentTrack.coverUrl || FALLBACK_COVER}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm truncate text-white leading-tight font-['SF_Pro_Display',sans-serif]">
                {currentTrack.title}
              </h4>
              <p className="text-zinc-300 text-xs font-black truncate leading-tight mt-0.5 font-['SF_Pro_Display',sans-serif]">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-2.5 text-white hover:scale-110 active:scale-95 transition-all"
              aria-label="Play/Pause"
            >
              {isPlaying ? (
                <div className="w-5 h-5 flex items-center justify-center font-black">❚❚</div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center font-black">▶</div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Full Screen Apple Music Player with Fluid Background & Synchronized Lyrics */}
      <AnimatePresence>
        {isPlayerOpen && currentTrack && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
          >
            {/* Fluid Ambient Mesh Background with live cover motion */}
            <LiquidBackground currentTrack={currentTrack} />

            {/* A. DESKTOP & TABLET VIEW (md: and above) - Exact Apple Music Split View */}
            <div className="hidden md:flex flex-1 w-full h-full min-h-0 overflow-hidden relative z-20">
              <DesktopPlayerSplitView
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                isDownloadingTrack={isDownloadingTrack}
                currentTime={currentTime}
                duration={duration}
                isFavorite={isCurrentFavorite}
                lyrics={lyrics}
                isSynced={isSynced}
                activeLyricIndex={activeLyricIndex}
                isIntroInstrumental={isIntroInstrumental}
                isLoadingLyrics={isLoadingLyrics}
                isKaraokeEffect={isKaraokeEffect}
                audioRef={audioRef}
                onTogglePlay={togglePlayPause}
                onNext={playNext}
                onPrev={playPrev}
                onSeek={handleSeek}
                onToggleFavorite={() => toggleFavorite()}
                onAddToPlaylist={() => setPlayerAddToPlaylistTrack(currentTrack)}
                onOpenQueue={() => setIsQueueOpen(true)}
                onToggleKaraokeEffect={() => setIsKaraokeEffect((prev) => !prev)}
                onToggleLyrics={toggleLyricsView}
                onClose={() => setIsPlayerOpen(false)}
                isShuffle={isShuffle}
                onToggleShuffle={() => setIsShuffle((prev) => !prev)}
                repeatMode={repeatMode}
                onToggleRepeat={() => {
                  setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
                }}
                viewMode={viewMode}
              />
            </div>

            {/* B. MOBILE VIEW (< md) - Classic Vertical Apple Music iOS View */}
            <div className="flex md:hidden flex-col w-full h-full min-h-0 overflow-hidden relative z-20">
              {/* Apple Music Header */}
              <div className="relative z-20 w-full shrink-0">
                <PlayerHeader
                  currentTrack={currentTrack}
                  viewMode={viewMode}
                  onClose={() => setIsPlayerOpen(false)}
                  isFavorite={isCurrentFavorite}
                  onToggleFavorite={() => toggleFavorite()}
                  onAddToPlaylist={() => setPlayerAddToPlaylistTrack(currentTrack)}
                />
              </div>

              {/* Main Stage: Alternates between Album View and Lyrics View */}
              <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden min-h-0 w-full">
                {viewMode === 'lyrics' ? (
                  <motion.div
                    key="lyrics-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 w-full h-full overflow-hidden flex flex-col"
                  >
                    <LyricsView
                      lyrics={lyrics}
                      isSynced={isSynced}
                      activeLyricIndex={activeLyricIndex}
                      isIntroInstrumental={isIntroInstrumental}
                      onSeek={handleSeek}
                      isLoading={isLoadingLyrics}
                      isControlsHidden={areLyricsControlsHidden}
                      onToggleControls={() => setAreLyricsControlsHidden((prev) => !prev)}
                      currentTime={currentTime}
                      isKaraokeEffect={isKaraokeEffect}
                      audioRef={audioRef}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="album-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 w-full h-full overflow-hidden flex flex-col justify-center"
                  >
                    <AlbumView
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      isFavorite={isCurrentFavorite}
                      onToggleFavorite={() => toggleFavorite()}
                      onAddToPlaylist={() => setPlayerAddToPlaylistTrack(currentTrack)}
                    />
                  </motion.div>
                )}

                {/* Apple Music Player Controls */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: areLyricsControlsHidden && viewMode === 'lyrics' ? 0 : 1,
                    pointerEvents: areLyricsControlsHidden && viewMode === 'lyrics' ? 'none' : 'auto',
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className={`w-full z-30 shrink-0 ${
                    viewMode === 'lyrics' ? 'absolute bottom-0 left-0 right-0' : 'relative'
                  }`}
                >
                  <PlayerControls
                    isPlaying={isPlaying}
                    isDownloadingTrack={isDownloadingTrack}
                    currentTime={currentTime}
                    duration={duration}
                    viewMode={viewMode}
                    onTogglePlay={togglePlayPause}
                    onNext={playNext}
                    onPrev={playPrev}
                    onSeek={handleSeek}
                    onToggleLyrics={toggleLyricsView}
                    onOpenQueue={() => setIsQueueOpen(true)}
                    audioRef={audioRef}
                    isKaraokeEffect={isKaraokeEffect}
                    onToggleKaraokeEffect={() => setIsKaraokeEffect((prev) => !prev)}
                  />
                </motion.div>
              </div>
            </div>

            {/* Modal for AirPlay */}
            <AirplayModal
              isOpen={isAirplayOpen}
              onClose={() => setIsAirplayOpen(false)}
              audioRef={audioRef}
              currentTrack={currentTrack}
            />

            {/* Modal for Queue */}
            <QueueModal
              isOpen={isQueueOpen}
              onClose={() => setIsQueueOpen(false)}
              queue={queue}
              currentTrack={currentTrack}
              onSelectTrack={(t) => playTrack(t)}
            />

            {/* Modals for Player Playlist Creation and Adding */}
            <AddToPlaylistModal
              track={playerAddToPlaylistTrack}
              playlists={playlists}
              isOpen={!!playerAddToPlaylistTrack}
              onClose={() => setPlayerAddToPlaylistTrack(null)}
              onAddToPlaylist={handleAddTrackToPlaylist}
              onCreateNewPlaylist={() => {
                setPlayerAddToPlaylistTrack(null);
                setIsPlayerCreatePlaylistOpen(true);
              }}
              isDark={true}
            />

            <CreatePlaylistModal
              isOpen={isPlayerCreatePlaylistOpen}
              onClose={() => setIsPlayerCreatePlaylistOpen(false)}
              onCreatePlaylist={(name, coverUrl) => {
                handleCreatePlaylist(name, coverUrl);
                setIsPlayerCreatePlaylistOpen(false);
              }}
              isDark={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        autoPlay
        preload="auto"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const mediaDuration = audioRef.current.duration;
            if (currentTrack?.duration && currentTrack.duration > 0) {
              setDuration(currentTrack.duration);
            } else if (mediaDuration && !isNaN(mediaDuration)) {
              setDuration(mediaDuration);
            }
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current && !audioRef.current.seeking) {
            const cur = audioRef.current.currentTime;
            if (isPlayerOpen) {
              setCurrentTime(cur);
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          playNext();
        }}
        onError={() => {
          setIsPlaying(false);
          setIsDownloadingTrack(false);
        }}
      />
    </div>
  );
}
