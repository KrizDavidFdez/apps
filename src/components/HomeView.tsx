import React, { useRef, useState, useMemo } from 'react';
import {
  Home,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Search,
  LayoutGrid,
  FolderHeart,
  Mic,
  MoreHorizontal,
  ChevronRight,
  Music,
  Disc3,
  ListMusic,
  Sparkles,
  Sun,
  Moon,
  Loader2,
  X,
  Plus,
  ListPlus,
  Clock,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, Artist, UserProfile, Playlist, HistoryItem, AlbumItem } from '../types';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { PlaylistView } from './PlaylistView';
import { AppleMusicHomeFeed } from './AppleMusicHomeFeed';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { PLAYLISTS_ACTUALIZADAS } from '../data/appleMusicFeed';

interface HomeViewProps {
  tracks: Track[];
  recommendedTrack: Track | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onOpenPlayer: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Track[];
  artistResults: Artist[];
  albumResults?: AlbumItem[];
  isSearching: boolean;
  onSelectArtist: (artist: Artist) => void;
  favoriteTracks: Track[];
  onToggleFavorite: (track: Track) => void;
  currentUser: UserProfile;
  onUpdateUserName: (name: string) => void;
  onUpdateUserPhoto: (photoUrl: string) => void;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, coverUrl?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddTrackToPlaylist: (playlistId: string, track: Track) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  recentHistory: HistoryItem[];
}

type NavTab = 'home' | 'library' | 'search';
type LibraryFilter = 'playlists' | 'artists' | 'albums';
type SearchCategoryFilter = 'artists' | 'playlists' | 'albums' | 'podcasts';

// Top recognized artists with high-definition official Deezer portraits & verified status
const FAMOUS_ARTISTS: Artist[] = [
  {
    id: 'art-weeknd',
    name: 'The Weeknd',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/f2cc019398f6d892697a298a0cce0804/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-badbunny',
    name: 'Bad Bunny',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/92da64b971e5446a6f113fa4395b2827/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-rosalia',
    name: 'ROSALÍA',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/417a8c3d8031d7e2e389d36151fa26e2/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-marias',
    name: 'The Marías',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/81df2f6f14dd06c116c2bb475f4d1ef5/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-feid',
    name: 'Feid',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/7338e3e4a3c1032900898555e76a66b9/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-relsb',
    name: 'Rels B',
    pictureUrl: 'https://cdn-images.dzcdn.net/images/artist/d504648fd4842cfa7c89d9f835dac4e8/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
  {
    id: 'art-karolg',
    name: 'KAROL G',
    pictureUrl: 'https://e-cdns-images.dzcdn.net/images/artist/c176378e9063bdcfd2a3d026c4832598/500x500-000000-80-0-0.jpg',
    isVerified: true,
  },
];

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  tracks,
  recommendedTrack,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenPlayer,
  searchQuery,
  onSearchChange,
  searchResults,
  artistResults,
  albumResults = [],
  isSearching,
  onSelectArtist,
  favoriteTracks,
  onToggleFavorite,
  currentUser,
  onUpdateUserName,
  onUpdateUserPhoto,
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  recentHistory,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('playlists');
  const [searchCategory, setSearchCategory] = useState<SearchCategoryFilter>('artists');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(currentUser.name);
  const [editingPhotoValue, setEditingPhotoValue] = useState(currentUser.photoUrl || '');
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Playlist & History State
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedDirectPlaylist, setSelectedDirectPlaylist] = useState<Playlist | null>(null);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null);

  const handleSelectAlbumItem = async (alb: AlbumItem) => {
    try {
      setLoadingAlbumId(alb.id);
      const res = await fetch(`/api/album-tracks?id=${alb.id}`);
      const data = await res.json();
      if (data && data.tracks && data.tracks.length > 0) {
        const albumPlaylist: Playlist = {
          id: `album-${alb.id}`,
          name: data.title || alb.title,
          coverUrl: data.coverUrl || alb.coverUrl,
          createdAt: Date.now(),
          tracks: data.tracks,
          curator: data.artist || alb.artist,
        };
        setSelectedDirectPlaylist(albumPlaylist);
      } else {
        const fallbackPlaylist: Playlist = {
          id: `album-${alb.id}`,
          name: alb.title,
          coverUrl: alb.coverUrl,
          createdAt: Date.now(),
          tracks: [],
          curator: alb.artist,
        };
        setSelectedDirectPlaylist(fallbackPlaylist);
      }
    } catch (err) {
      console.error('Error fetching album tracks:', err);
    } finally {
      setLoadingAlbumId(null);
    }
  };

  const selectedPlaylist = useMemo(() => {
    if (selectedDirectPlaylist) return selectedDirectPlaylist;
    if (!selectedPlaylistId) return null;
    const userPl = playlists.find((p) => p.id === selectedPlaylistId);
    if (userPl) return userPl;
    const curatedPl = PLAYLISTS_ACTUALIZADAS.find((p) => p.id === selectedPlaylistId);
    if (curatedPl) return curatedPl;
    return null;
  }, [playlists, selectedPlaylistId, selectedDirectPlaylist]);

  // Relative time formatter for Volver a escuchar
  const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Math.max(0, Date.now() - timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Recientemente';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 7)} sem`;
  };

  const FALLBACK_COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg';

  // Populated recent items: takes real history, and supplements with recent tracks if list is short
  const recentDisplayItems = useMemo(() => {
    const items: { track: Track; playedAt: number }[] = recentHistory.map((item) => ({
      ...item,
      track: {
        ...item.track,
        coverUrl: item.track.coverUrl || FALLBACK_COVER,
      },
    }));
    const existingIds = new Set(items.map((i) => i.track.id));
    const fallbackOffsets = [
      1000 * 60 * 25, // Hace 25 min
      1000 * 60 * 60 * 2, // Hace 2 horas
      1000 * 60 * 60 * 6, // Hace 6 horas
      1000 * 60 * 60 * 24, // Ayer
      1000 * 60 * 60 * 48, // Hace 2 días
      1000 * 60 * 60 * 96, // Hace 4 días
      1000 * 60 * 60 * 144, // Hace 6 días
    ];

    let offsetIdx = 0;
    for (const t of tracks) {
      if (items.length >= 8) break;
      if (!existingIds.has(t.id)) {
        items.push({
          track: {
            ...t,
            coverUrl: t.coverUrl || FALLBACK_COVER,
          },
          playedAt: Date.now() - fallbackOffsets[offsetIdx % fallbackOffsets.length],
        });
        existingIds.add(t.id);
        offsetIdx++;
      }
    }
    return items;
  }, [recentHistory, tracks]);

  const resizeImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 180;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataUrl(file);
      setEditingPhotoValue(resized);
      onUpdateUserPhoto(resized);
    } catch (err) {
      console.error('Error loading photo file:', err);
    }
  };

  const handleSaveProfile = () => {
    if (editingNameValue.trim()) {
      onUpdateUserName(editingNameValue.trim());
    }
    if (editingPhotoValue !== currentUser.photoUrl) {
      onUpdateUserPhoto(editingPhotoValue);
    }
    setShowProfileModal(false);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeHero = recommendedTrack || tracks[0] || null;
  const isHeroPlaying = currentTrack?.id === activeHero?.id && isPlaying;

  const isHeroFavorite = Boolean(
    activeHero && favoriteTracks.some((t) => t.id === activeHero.id || t.title === activeHero.title)
  );

  const displayedFavorites = favoriteTracks.filter((t) => t && t.id && t.title);

  const handleSelectGenre = (genreQuery: string) => {
    onSearchChange(genreQuery);
    setActiveTab('search');
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const handleSelectArtistCard = (artist: Artist) => {
    onSelectArtist(artist);
    onSearchChange(artist.name);
    setActiveTab('search');
  };

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`relative w-full h-full flex flex-col font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] select-none overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      {/* ══════════════════════════════════════════════════════════════
          TOP APPLE MUSIC HEADER WITH STATUS BAR & PROFILE (LIQUID GLASS)
         ══════════════════════════════════════════════════════════════ */}
      <header
        className={`shrink-0 z-30 px-5 sm:px-8 pt-4 pb-3 flex items-center justify-between transition-colors duration-200 relative overflow-hidden ${
          isDark
            ? 'apple-liquid-glass-subtle text-white'
            : 'apple-liquid-glass-subtle-light text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight capitalize font-['SF_Pro_Display',sans-serif] drop-shadow-sm">
            {activeTab === 'home' && 'Home'}
            {activeTab === 'library' && 'Library'}
            {activeTab === 'search' && 'Search'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isDark
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => {
              setEditingNameValue(currentUser.name);
              setEditingPhotoValue(currentUser.photoUrl || '');
              setShowProfileModal(true);
            }}
            className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all cursor-pointer group ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15'
                : 'bg-black/5 hover:bg-black/10 border-black/10'
            }`}
            title="Editar perfil"
            aria-label="Perfil de usuario"
          >
            <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shadow-sm ${
              isDark ? 'bg-white text-black' : 'bg-black text-white'
            }`}>
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-black">{currentUser.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span
              className={`text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] ${
                isDark ? 'text-white/90' : 'text-black/90'
              }`}
            >
              {currentUser.name}
            </span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          MAIN SCROLLABLE CONTENT BODY
         ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 sm:pb-28 px-5 sm:px-8 pt-4">
        {selectedPlaylist ? (
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={() => {
              setSelectedPlaylistId(null);
              setSelectedDirectPlaylist(null);
            }}
            onPlayTrack={onPlayTrack}
            onRemoveTrack={onRemoveTrackFromPlaylist}
            onDeletePlaylist={(id) => {
              onDeletePlaylist(id);
              setSelectedPlaylistId(null);
              setSelectedDirectPlaylist(null);
            }}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isDark={isDark}
          />
        ) : (
          <>
            {/* ────────────────────────────────────────────────────────────
                TAB 1: BROWSE / HOME (EXACT APPLE MUSIC EXPERIENCE)
               ──────────────────────────────────────────────────────────── */}
            {activeTab === 'home' && (
              <AppleMusicHomeFeed
                onPlayTrack={onPlayTrack}
                onOpenPlayer={onOpenPlayer}
                onToggleFavorite={onToggleFavorite}
                favoriteTracks={favoriteTracks}
                onOpenAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                isDark={isDark}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlists={playlists}
                onSelectPlaylist={(plOrId) => {
                  if (typeof plOrId === 'string') {
                    setSelectedPlaylistId(plOrId);
                    setSelectedDirectPlaylist(null);
                  } else {
                    setSelectedDirectPlaylist(plOrId);
                    setSelectedPlaylistId(null);
                  }
                }}
                recentDisplayItems={recentDisplayItems}
                formatRelativeTime={formatRelativeTime}
                tracks={tracks}
              />
            )}

        {/* ────────────────────────────────────────────────────────────
            TAB 2: LIBRARY (IDEAL 2: CURATED COMMUNITY LIBRARY)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'library' && (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Filter Pills (Playlists / Artists) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['playlists', 'artists'] as LibraryFilter[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLibraryFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                    libraryFilter === tab
                      ? 'bg-zinc-800 text-white dark:bg-white dark:text-black shadow-sm'
                      : isDark
                      ? 'bg-zinc-900 text-white/60 hover:text-white border border-white/10'
                      : 'bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-black/5'
                  }`}
                >
                  {tab === 'playlists' ? 'Playlist' : 'Artistas'}
                </button>
              ))}
            </div>

            {/* PLAYLIST */}
            {(libraryFilter === 'playlists') && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Playlist
                  </h3>
                  <button
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-white text-black hover:bg-zinc-200 border-white'
                        : 'bg-black text-white hover:bg-zinc-800 border-black'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Playlist
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {playlists.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                      <p className="text-sm font-semibold">No tienes playlists creadas aún.</p>
                      <p className="text-xs mt-1">Crea una playlist con el botón de arriba.</p>
                    </div>
                  ) : (
                    playlists.map((pl) => {
                      const hasCover = Boolean(pl.coverUrl);
                      return (
                        <div
                          key={`lib-${pl.id}`}
                          onClick={() => setSelectedPlaylistId(pl.id)}
                          className={`rounded-2xl p-3 border transition-all cursor-pointer flex flex-col gap-2 ${
                            isDark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10' : 'bg-white hover:bg-zinc-50 border-black/10 shadow-sm'
                          }`}
                        >
                          <div className={`w-full aspect-square rounded-xl overflow-hidden shadow-sm relative ${
                            isDark ? 'bg-zinc-900' : 'bg-zinc-100'
                          }`}>
                            {hasCover ? (
                              <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${
                                isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                <Music className="w-8 h-8 mb-1 opacity-60" />
                                <span className="text-[11px] font-bold line-clamp-1">{pl.name}</span>
                              </div>
                            )}
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                              {pl.tracks.length}
                            </span>
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                              {pl.name}
                            </h4>
                            <p className="text-xs text-zinc-500 truncate font-medium">
                              {pl.tracks.length} {pl.tracks.length === 1 ? 'canción' : 'canciones'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* ARTISTAS */}
            {(libraryFilter === 'artists' || true) && (
              <section className={libraryFilter === 'artists' ? '' : 'mt-4'}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Artistas
                  </h3>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {FAMOUS_ARTISTS.map((art, index) => (
                    <div
                      key={`${art.id}-${index}`}
                      onClick={() => handleSelectArtistCard(art)}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <div className="relative">
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-transparent shadow-md transition-all ${
                          isDark ? 'group-hover:border-white' : 'group-hover:border-black'
                        }`}>
                          <img src={art.pictureUrl} alt={art.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1 max-w-[100px]">
                        <span className={`text-xs font-bold text-center truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {art.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            TAB 4: SEARCH (IDEAL 2: SEARCH TAB WITH REAL ENGINE)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-5 max-w-5xl mx-auto">
            {/* Search input field with microphone */}
            <div
              className={`relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/90 border-white/10 text-white focus-within:border-[#fa2d48]'
                  : 'bg-white border-black/10 text-zinc-900 focus-within:border-[#fa2d48] shadow-sm'
              }`}
            >
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search artists, songs, lyrics, and genres"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Mic className="w-5 h-5 text-zinc-400 shrink-0 cursor-pointer" />
              )}
            </div>

            {/* CONDITIONAL: IF SEARCH QUERY IS ACTIVE -> RENDER SEARCH RESULTS */}
            {searchQuery.trim() ? (
              <div className="flex flex-col gap-5">
                {/* Search Loading Indicator */}
                {isSearching && (
                  <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
                    <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
                    <span>Searching for &quot;{searchQuery}&quot;...</span>
                  </div>
                )}

                {/* Artists Result Row */}
                {artistResults.length > 0 && (
                  <section>
                    <h3 className={`text-xs font-bold tracking-wider uppercase mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Artists
                    </h3>
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
                      {artistResults.map((art, index) => (
                        <div
                          key={`${art.id}-${index}`}
                          onClick={() => handleSelectArtistCard(art)}
                          className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                        >
                          <div className="relative">
                            <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-transparent shadow-md transition-all flex items-center justify-center ${
                              isDark ? 'bg-zinc-800 group-hover:border-white' : 'bg-zinc-200 group-hover:border-black'
                            }`}>
                              {art.pictureUrl ? (
                                <img src={art.pictureUrl} alt={art.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-bold">{(art.name || 'A').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1 max-w-[85px]">
                            <span className={`text-xs font-bold text-center truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                              {art.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Albums Result Row */}
                {albumResults && albumResults.length > 0 && (
                  <section>
                    <h3 className={`text-xs font-bold tracking-wider uppercase mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Álbumes ({albumResults.length})
                    </h3>
                    <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
                      {albumResults.map((alb, index) => (
                        <div
                          key={`${alb.id}-${index}`}
                          onClick={() => handleSelectAlbumItem(alb)}
                          className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
                        >
                          <div
                            className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                              isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                            }`}
                          >
                            <img
                              src={alb.coverUrl || FALLBACK_COVER}
                              alt={alb.title}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                                }`}
                              >
                                {loadingAlbumId === alb.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4
                              className={`font-sf-bold text-sm truncate ${
                                isDark ? 'text-white' : 'text-zinc-900'
                              }`}
                            >
                              {alb.title}
                            </h4>
                            <p className="text-xs text-zinc-500 truncate font-sf-regular mt-0.5">
                              {alb.artist}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Song Results List */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Songs ({searchResults.length})
                    </h3>
                    {searchResults.length > 0 && (
                      <button
                        onClick={() => onPlayTrack(searchResults[0], searchResults)}
                        className={`text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Play All
                      </button>
                    )}
                  </div>

                  {searchResults.length === 0 && artistResults.length === 0 && (!albumResults || albumResults.length === 0) && !isSearching ? (
                    <div className="py-12 text-center text-zinc-500">
                      <p className="text-base font-semibold">No results found for &quot;{searchQuery}&quot;</p>
                      <p className="text-xs mt-1">Try searching for an artist like The Weeknd, Bad Bunny, or The Marías</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5">
                      {searchResults.map((song, index) => {
                        const isCurrent = currentTrack?.id === song.id;
                        const isFav = favoriteTracks.some((f) => f.id === song.id || f.title === song.title);

                        return (
                          <div
                            key={`${song.id}-${index}`}
                            onClick={() => onPlayTrack(song, searchResults)}
                            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer group ${
                              isCurrent
                                ? isDark
                                  ? 'bg-white/10 ring-1 ring-white/20'
                                  : 'bg-black/5 ring-1 ring-black/15'
                                : isDark
                                ? 'hover:bg-white/5'
                                : 'hover:bg-black/5'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                <img
                                  src={song.coverUrl || FALLBACK_COVER}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                />
                                <div
                                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                                    isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}
                                >
                                  {isCurrent && isPlaying ? (
                                    <Pause className="w-4 h-4 text-white fill-current" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4
                                  className={`font-bold text-sm truncate ${
                                    isCurrent
                                      ? isDark ? 'text-white font-black' : 'text-black font-black'
                                      : isDark
                                      ? 'text-white group-hover:text-white'
                                      : 'text-zinc-900'
                                  }`}
                                >
                                  {song.title}
                                </h4>
                                <p className="text-xs text-zinc-500 truncate font-medium mt-0.5">
                                  <span className="truncate">{song.artist}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                                {song.durationFormatted || (song.duration ? formatTime(song.duration) : '03:30')}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackToAddToPlaylist(song);
                                }}
                                className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                aria-label="Añadir a playlist"
                                title="Añadir a playlist"
                              >
                                <ListPlus className="w-4 h-4" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(song);
                                }}
                                className={`p-2 transition-colors cursor-pointer ${
                                  isFav
                                    ? isDark ? 'text-white' : 'text-black'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                                aria-label="Favorite"
                              >
                                <Heart
                                  className="w-4 h-4"
                                  fill={isFav ? (isDark ? '#ffffff' : '#000000') : 'none'}
                                  stroke={isFav ? (isDark ? '#ffffff' : '#000000') : 'currentColor'}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* DEFAULT SEARCH VIEW: MATCHING SCREENSHOT (Trending searches, circular categories, featured searches) */
              <>
                {/* TRENDING COMMUNITY SEARCHES PILLS */}
                <section>
                  <h3 className={`text-xs font-bold tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Trending community searches
                  </h3>

                  <div className="flex flex-col gap-2">
                    {[
                      'Bad Bunny',
                      'The Weeknd',
                      'The Marías',
                      'Rosalía',
                      'Feid',
                    ].map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        onClick={() => {
                          handleSelectGenre(item);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-white/10'
                            : 'bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 border-black/5'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM APPLE MUSIC TAB BAR (Home, Library, Search) (LIQUID GLASS)
         ══════════════════════════════════════════════════════════════ */}
      <nav
        className={`shrink-0 z-30 px-3 sm:px-6 py-2 flex items-center justify-around transition-colors duration-200 relative overflow-hidden ${
          isDark
            ? 'apple-liquid-glass-subtle'
            : 'apple-liquid-glass-subtle-light'
        }`}
      >
        {/* 1. Home */}
        <button
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'home'
              ? isDark
                ? 'text-white font-extrabold bg-white/10 shadow-sm border border-white/15'
                : 'text-black font-extrabold bg-black/5 shadow-sm border border-black/10'
              : isDark
              ? 'text-zinc-400 hover:text-white hover:bg-white/5'
              : 'text-zinc-500 hover:text-black hover:bg-black/5'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Library */}
        <button
          onClick={() => handleTabChange('library')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'library'
              ? isDark
                ? 'text-white font-extrabold bg-white/10 shadow-sm border border-white/15'
                : 'text-black font-extrabold bg-black/5 shadow-sm border border-black/10'
              : isDark
              ? 'text-zinc-400 hover:text-white hover:bg-white/5'
              : 'text-zinc-500 hover:text-black hover:bg-black/5'
          }`}
        >
          <FolderHeart className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Library</span>
        </button>

        {/* 3. Search */}
        <button
          onClick={() => handleTabChange('search')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'search'
              ? isDark
                ? 'text-white font-extrabold bg-white/10 shadow-sm border border-white/15'
                : 'text-black font-extrabold bg-black/5 shadow-sm border border-black/10'
              : isDark
              ? 'text-zinc-400 hover:text-white hover:bg-white/5'
              : 'text-zinc-500 hover:text-black hover:bg-black/5'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          PROFILE & SETTINGS MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-black/10 text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Perfil de usuario</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                {/* Hidden File Input for Image Selection */}
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handlePhotoFileChange}
                />

                {/* Interactive Avatar with Camera Overlay */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                  title="Haz clic para cambiar tu foto"
                >
                  <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl border-2 transition-all relative ${
                    isDark ? 'bg-zinc-800 border-white/20 text-white group-hover:border-white' : 'bg-zinc-200 border-black/20 text-zinc-900 group-hover:border-black'
                  }`}>
                    {editingPhotoValue ? (
                      <img src={editingPhotoValue} alt={editingNameValue} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black">{(editingNameValue || 'D').charAt(0).toUpperCase()}</span>
                    )}
                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white drop-shadow-md" />
                      <span className="text-[10px] font-bold text-white mt-1">Cambiar</span>
                    </div>
                  </div>

                  {/* Camera Action Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      photoInputRef.current?.click();
                    }}
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg border-2 border-zinc-900 cursor-pointer transition-all active:scale-95"
                    title="Subir foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Photo Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark ? 'border-white/20 hover:bg-white/10 text-white' : 'border-black/20 hover:bg-black/5 text-black'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir foto
                  </button>
                  {editingPhotoValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhotoValue('');
                        onUpdateUserPhoto('');
                      }}
                      className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nombre del perfil
                  </label>
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    placeholder="Tu nombre"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none ${
                      isDark
                        ? 'bg-zinc-800 border-white/10 text-white focus:border-white'
                        : 'bg-zinc-100 border-black/10 text-zinc-900 focus:border-black'
                    }`}
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer mt-2 ${
                    isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          PLAYLIST MANAGEMENT MODALS
         ══════════════════════════════════════════════════════════════ */}
      {/* 1. Create Playlist Modal with Custom Image */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={onCreatePlaylist}
        onCreatePlaylist={onCreatePlaylist}
        isDark={isDark}
      />

      {/* 2. Add to Playlist Modal */}
      <AddToPlaylistModal
        track={trackToAddToPlaylist}
        playlists={playlists}
        isOpen={!!trackToAddToPlaylist}
        onClose={() => setTrackToAddToPlaylist(null)}
        onAddToPlaylist={onAddTrackToPlaylist}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
        onCreateNewPlaylist={() => {
          setIsCreatePlaylistOpen(true);
        }}
        onOpenCreatePlaylist={() => {
          setIsCreatePlaylistOpen(true);
        }}
        isDark={isDark}
      />
    </div>
  );
});

HomeView.displayName = 'HomeView';
