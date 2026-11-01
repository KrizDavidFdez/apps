import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Play,
  Pause,
  MoreHorizontal,
  Plus,
  Heart,
  Clock,
  Music,
  X,
  Share2,
  ListPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, Playlist } from '../types';
import {
  FEED_BANNERS,
  MEJORES_CANCIONES_NUEVAS,
  NUEVO_ESTA_SEMANA,
  LANZAMIENTOS_RECIENTES,
  PLAYLISTS_ACTUALIZADAS,
  ALBUMES_DESTACADOS,
  EXITOS_DEL_MOMENTO,
  TODO_EL_MUNDO,
  FeedBanner,
  FeedAlbum,
  FeedPlaylist,
} from '../data/appleMusicFeed';

interface AppleMusicHomeFeedProps {
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onOpenPlayer: () => void;
  onToggleFavorite: (track: Track) => void;
  favoriteTracks: Track[];
  onOpenAddToPlaylist: (track: Track) => void;
  isDark: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: Playlist[];
  onSelectPlaylist: (playlistOrId: string | Playlist) => void;
  recentDisplayItems: { track: Track; playedAt: number }[];
  formatRelativeTime: (timestamp: number) => string;
  tracks?: Track[];
}

export const AppleMusicHomeFeed: React.FC<AppleMusicHomeFeedProps> = React.memo(({
  onPlayTrack,
  onOpenPlayer,
  onToggleFavorite,
  favoriteTracks,
  onOpenAddToPlaylist,
  isDark,
  currentTrack,
  isPlaying,
  playlists,
  onSelectPlaylist,
  recentDisplayItems,
  formatRelativeTime,
  tracks = [],
}) => {
  // Track selected for the three-dots (···) options menu
  const [activeMenuTrack, setActiveMenuTrack] = useState<Track | null>(null);

  // Shuffle artist albums on every page load/mount
  const [shuffledNuevoSemana, setShuffledNuevoSemana] = useState<FeedAlbum[]>(NUEVO_ESTA_SEMANA);
  const [shuffledLanzamientos, setShuffledLanzamientos] = useState<FeedAlbum[]>(LANZAMIENTOS_RECIENTES);

  useEffect(() => {
    setShuffledNuevoSemana([...NUEVO_ESTA_SEMANA].sort(() => Math.random() - 0.5));
    setShuffledLanzamientos([...LANZAMIENTOS_RECIENTES].sort(() => Math.random() - 0.5));
  }, []);

  const isFav = (track: Track) =>
    favoriteTracks.some((t) => t.id === track.id || t.title === track.title);

  // Helper to play an album or playlist card
  const handlePlayCard = (title: string, artist: string, coverUrl: string) => {
    const syntheticTrack: Track = {
      id: `card-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      artist,
      coverUrl,
      duration: 210,
      durationFormatted: '03:30',
    };
    onPlayTrack(syntheticTrack);
    onOpenPlayer();
  };

  const handleSelectAlbum = (album: FeedAlbum) => {
    let specificTitles: string[] = [];

    const upperTitle = album.title.toUpperCase();

    if (album.id === 'sem-1' || upperTitle.includes('2026') || upperTitle.includes('ÉXITOS')) {
      specificTitles = [
        'Bzrp Music Sessions #60 (2026)', 'Miko Flow 2026', 'Fuego Cruzado', 'Eclipse Total',
        'Miami Vice 2026', 'Modo Avión', 'Neon Club', 'Polaris', 'Estrella Fugaz',
        'Éxitos 2026 (Outro)', 'Bonus Track 2026'
      ];
    } else if (album.id === 'sem-2' || upperTitle.includes('NOCHES')) {
      specificTitles = [
        'Noches de Verano (Intro)', 'Arena y Sol', 'Islas Canarias 2026', 'Playita Club',
        'Bajo la Luna', 'Caribe Mix', 'Brisas del Mar', 'Madrid - Tenerife', 'Madrugada',
        'Noches de Verano (Outro)'
      ];
    } else if (album.id === 'sem-3' || upperTitle.includes('REVIVO')) {
      specificTitles = [
        "Livin' la Vida Loca (ReVivo)", 'La Mordidita', "Vente Pa' Ca", 'María (Remix)',
        'Disparo Al Corazón', 'Fiebre', 'Pies Descalzos', 'Adrenalina', 'Perdóname', 'ReVivo Outro'
      ];
    } else if (album.id === 'sem-4' || upperTitle.includes('VERANO')) {
      specificTitles = [
        'Moscow Mule', 'Después de la Playa', 'Me Porto Bonito', 'Tití Me Preguntó',
        'Un Ratito', 'Café con Ron', 'Ojitos Lindos', 'Efecto', 'El Apagón',
        'Otro Atardecer', 'Tarot', 'Party'
      ];
    } else if (album.id === 'sem-5' || upperTitle.includes('AFTER HOURS')) {
      specificTitles = [
        'Alone Again', 'Too Late', 'Hardest To Love', 'Scared To Live', 'Snowchild',
        'Escape From LA', 'Heartless', 'Faith', 'Blinding Lights', 'In Your Eyes', 'Save Your Tears'
      ];
    } else {
      specificTitles = [
        `${album.title} (Intro)`, 'Pista Uno', 'Melodía Urbana', 'Ritmo de Medianoche',
        'Reflejos', 'Atardecer', 'Noche Estrellada', 'Frecuencia', 'Interludio', 'Bonus Track'
      ];
    }

    const albumTracks: Track[] = specificTitles.map((title, idx) => ({
      id: `album-trk-${album.id}-${idx}`,
      title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      audioUrl: MEJORES_CANCIONES_NUEVAS[idx % MEJORES_CANCIONES_NUEVAS.length].audioUrl,
      duration: 180 + (idx * 12) % 60,
      durationFormatted: `03:${15 + (idx * 3) % 40}`,
    }));

    const albumPlaylist: Playlist = {
      id: `album-${album.id}`,
      name: album.title,
      coverUrl: album.coverUrl,
      createdAt: Date.now(),
      tracks: albumTracks,
      curator: album.artist,
    };
    onSelectPlaylist(albumPlaylist);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* ══════════════════════════════════════════════════════════════
          1. TOP FEATURED CAROUSEL BANNERS (from screenshot)
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
          {FEED_BANNERS.map((banner, index) => {
            const isThisPlaying = currentTrack?.title === banner.track.title && isPlaying;

            return (
              <div
                key={`${banner.id}-${index}`}
                className="w-[85vw] sm:w-[540px] shrink-0 snap-start flex flex-col group cursor-pointer"
                onClick={() => {
                  onPlayTrack(banner.track);
                  onOpenPlayer();
                }}
              >
                {/* Header text above banner image */}
                <div className="mb-2">
                  <span className="text-[11px] font-sf-bold tracking-wider uppercase text-zinc-400">
                    {banner.kicker}
                  </span>
                  <h2
                    className={`text-xl sm:text-2xl font-black tracking-tight leading-tight truncate ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {banner.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-sf-regular text-zinc-500 truncate">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Banner Card */}
                <div
                  className={`relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border transition-transform duration-300 group-hover:scale-[1.01] ${
                    isDark ? 'border-white/15 bg-zinc-900' : 'border-black/10 bg-zinc-100'
                  }`}
                >
                  <img
                    src={banner.coverUrl}
                    alt={banner.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Dark gradient overlay for caption readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-white/95 font-sf-regular line-clamp-2 drop-shadow-sm max-w-[90%]">
                      {banner.caption}
                    </p>
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-md group-hover:bg-white group-hover:text-black transition-all">
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. LAS MEJORES CANCIONES NUEVAS (from screenshot: 2 cols x 4 rows)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Las mejores canciones nuevas
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* 2-column or horizontal scroll container with 4 rows each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {MEJORES_CANCIONES_NUEVAS.map((track, index) => {
            const isCurrent = currentTrack?.title === track.title;

            return (
              <div
                key={`${track.id}-${index}`}
                onClick={() => onPlayTrack(track, MEJORES_CANCIONES_NUEVAS)}
                className={`flex items-center justify-between py-2 px-2.5 rounded-xl transition-all cursor-pointer group ${
                  isCurrent
                    ? isDark
                      ? 'bg-white/10 ring-1 ring-white/20'
                      : 'bg-black/5 ring-1 ring-black/15'
                    : isDark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-black/5'
                }`}
              >
                {/* Artwork + Title + Artist */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm bg-zinc-800">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback && track.coverUrl) {
                          target.dataset.fallback = 'true';
                          target.src = `/api/cover-proxy?url=${encodeURIComponent(track.coverUrl)}`;
                        }
                      }}
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
                      className={`font-sf-bold text-sm truncate leading-snug ${
                        isCurrent
                          ? isDark
                            ? 'text-white font-black'
                            : 'text-black font-black'
                          : isDark
                          ? 'text-white'
                          : 'text-zinc-900'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="font-sf-regular text-xs text-zinc-500 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Right Options: Three Dots (···) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuTrack(track);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer ml-2"
                  title="Más opciones"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. NUEVO ESTA SEMANA (from screenshot: horizontal albums)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Nuevo esta semana
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
          {MEJORES_CANCIONES_NUEVAS.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={`${track.id}-${index}`}
                onClick={() => {
                  onPlayTrack(track, MEJORES_CANCIONES_NUEVAS);
                  onOpenPlayer();
                }}
                className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
              >
                <div
                  className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                    isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                  }`}
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        isDark ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    className={`font-sf-bold text-xs sm:text-sm truncate ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. LANZAMIENTOS RECIENTES (from screenshot: horizontal albums)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Lanzamientos recientes
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
          {shuffledLanzamientos.map((album, index) => (
            <div
              key={`${album.id}-${index}`}
              onClick={() => handleSelectAlbum(album)}
              className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
            >
              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                }`}
              >
                <img
                  src={album.coverUrl}
                  alt={album.title}
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
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h4
                  className={`font-sf-bold text-xs sm:text-sm truncate ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {album.title}
                </h4>
                <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. ÁLBUMES DE ARTISTAS
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Álbumes de artistas
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
          {ALBUMES_DESTACADOS.map((album, index) => (
            <div
              key={`${album.id}-${index}`}
              onClick={() => handleSelectAlbum(album)}
              className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
            >
              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                }`}
              >
                <img
                  src={album.coverUrl}
                  alt={album.title}
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
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h4
                  className={`font-sf-bold text-xs sm:text-sm truncate ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {album.title}
                </h4>
                <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. ÁLBUMES DESTACADOS (Real titles and artwork)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Álbumes destacados
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
          {ALBUMES_DESTACADOS.map((album, index) => (
            <div
              key={`${album.id}-dest-${index}`}
              onClick={() => handleSelectAlbum(album)}
              className="w-40 sm:w-48 shrink-0 flex flex-col gap-2 cursor-pointer group"
            >
              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                }`}
              >
                <img
                  src={album.coverUrl}
                  alt={album.title}
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
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h4
                  className={`font-sf-bold text-xs sm:text-sm truncate ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {album.title}
                </h4>
                <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. ÉXITOS DEL MOMENTO (from screenshot: 2 cols x 4 rows)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Éxitos del momento
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {EXITOS_DEL_MOMENTO.map((track, index) => {
            const isCurrent = currentTrack?.title === track.title;

            return (
              <div
                key={`${track.id}-${index}`}
                onClick={() => onPlayTrack(track, EXITOS_DEL_MOMENTO)}
                className={`flex items-center justify-between py-2 px-2.5 rounded-xl transition-all cursor-pointer group ${
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
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm bg-zinc-800">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback && track.coverUrl) {
                          target.dataset.fallback = 'true';
                          target.src = `/api/cover-proxy?url=${encodeURIComponent(track.coverUrl)}`;
                        }
                      }}
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
                      className={`font-sf-bold text-sm truncate leading-snug ${
                        isCurrent
                          ? isDark
                            ? 'text-white font-black'
                            : 'text-black font-black'
                          : isDark
                          ? 'text-white'
                          : 'text-zinc-900'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="font-sf-regular text-xs text-zinc-500 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuTrack(track);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer ml-2"
                  title="Más opciones"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. TODO EL MUNDO ESTÁ ESCUCHANDO... (from screenshot: albums)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Todo el mundo está escuchando...
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
          {TODO_EL_MUNDO.map((album, index) => (
            <div
              key={`${album.id}-${index}`}
              onClick={() => handlePlayCard(album.title, album.artist, album.coverUrl)}
              className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
            >
              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                }`}
              >
                <img
                  src={album.coverUrl}
                  alt={album.title}
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
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4
                    className={`font-sf-bold text-xs sm:text-sm truncate ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    {album.title}
                  </h4>
                  {album.explicit && (
                    <span className="px-1 py-0.2 rounded bg-zinc-400 text-black text-[9px] font-black leading-none">
                      E
                    </span>
                  )}
                </div>
                <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9. MIS PLAYLIST (Seamlessly preserved for user access)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Mis Playlist
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
          <span className="text-xs font-sf-regular text-zinc-500">
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
          </span>
        </div>

        {playlists.length === 0 ? (
          <div
            className={`p-6 rounded-2xl border text-center ${
              isDark ? 'bg-zinc-950 border-white/10 text-zinc-400' : 'bg-zinc-50 border-black/10 text-zinc-600'
            }`}
          >
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-sf-bold">No tienes playlists creadas</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Crea playlists desde la pestaña Biblioteca o añade canciones desde cualquier menú.
            </p>
          </div>
        ) : (
          <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
            {playlists.map((pl, index) => {
              const hasCover = Boolean(pl.coverUrl);

              return (
                <div
                  key={`${pl.id}-${index}`}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className="w-36 sm:w-44 shrink-0 flex flex-col gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                      isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                    }`}
                  >
                    {hasCover ? (
                      <img
                        src={pl.coverUrl}
                        alt={pl.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${
                          isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <Music className="w-10 h-10 mb-1.5 opacity-60" />
                        <span className="text-[11px] font-sf-bold line-clamp-1">{pl.name}</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-sf-bold">
                      {pl.tracks.length} {pl.tracks.length === 1 ? 'canción' : 'canciones'}
                    </div>
                  </div>

                  <div>
                    <h4
                      className={`font-sf-bold text-xs sm:text-sm truncate ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {pl.name}
                    </h4>
                    <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                      Playlist personal
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          10. VOLVER A ESCUCHAR (Optimized, lazy loading, motion animations)
         ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3
              className={`text-lg sm:text-xl font-sf-bold tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Volver a escuchar
            </h3>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors" />
          </div>
          <span className="text-xs font-sf-regular text-zinc-500">Historial reciente</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {recentDisplayItems.map((item, idx) => {
            const isCurrent = currentTrack?.id === item.track.id;
            const timeLabel = formatRelativeTime(item.playedAt);

            return (
              <motion.div
                key={`${item.track.id}-${idx}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.25) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPlayTrack(item.track, recentDisplayItems.map((i) => i.track))}
                className={`flex flex-col gap-2 cursor-pointer group rounded-2xl p-2 transition-all ${
                  isCurrent
                    ? isDark
                      ? 'bg-white/10 ring-1 ring-white/30'
                      : 'bg-black/5 ring-1 ring-black/20'
                    : isDark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-black/5'
                }`}
              >
                <div
                  className={`w-full aspect-square rounded-2xl overflow-hidden shadow-md relative group-hover:scale-102 transition-transform border ${
                    isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
                  }`}
                >
                  <img
                    src={item.track.coverUrl}
                    alt={item.track.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />

                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        isDark ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-sf-bold flex items-center gap-1 shadow-sm">
                    <Clock className="w-2.5 h-2.5 opacity-80" />
                    <span>{timeLabel}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddToPlaylist(item.track);
                    }}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md ${
                      isDark
                        ? 'bg-black/80 text-white hover:bg-white hover:text-black'
                        : 'bg-white/90 text-black hover:bg-black hover:text-white'
                    }`}
                    title="Añadir a playlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <h4
                    className={`font-sf-bold text-xs sm:text-sm truncate ${
                      isCurrent
                        ? isDark
                          ? 'text-white font-black'
                          : 'text-black font-black'
                        : isDark
                        ? 'text-white'
                        : 'text-black'
                    }`}
                  >
                    {item.track.title}
                  </h4>
                  <p className="font-sf-regular text-[11px] text-zinc-500 truncate mt-0.5">
                    {item.track.artist}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          OPTIONS ACTION SHEET FOR THREE-DOTS (···)
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeMenuTrack && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveMenuTrack(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl ${
                isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-black/10 text-zinc-900'
              }`}
            >
              {/* Song summary Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {activeMenuTrack.coverUrl ? (
                    <img
                      src={activeMenuTrack.coverUrl}
                      alt={activeMenuTrack.title}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 shadow-sm shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sf-bold text-sm truncate">{activeMenuTrack.title}</h4>
                    <p className="text-xs text-zinc-500 truncate">{activeMenuTrack.artist}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMenuTrack(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1 py-3">
                <button
                  onClick={() => {
                    onPlayTrack(activeMenuTrack);
                    onOpenPlayer();
                    setActiveMenuTrack(null);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors cursor-pointer text-sm font-sf-bold ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>Reproducir canción</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAddToPlaylist(activeMenuTrack);
                    setActiveMenuTrack(null);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors cursor-pointer text-sm font-sf-bold ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Añadir a una playlist</span>
                </button>

                <button
                  onClick={() => {
                    onToggleFavorite(activeMenuTrack);
                    setActiveMenuTrack(null);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors cursor-pointer text-sm font-sf-bold ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={isFav(activeMenuTrack) ? '#ffffff' : 'none'}
                    stroke={isDark ? '#ffffff' : '#000000'}
                  />
                  <span>
                    {isFav(activeMenuTrack) ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
