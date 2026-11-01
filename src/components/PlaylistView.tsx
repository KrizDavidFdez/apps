import React from 'react';
import { ChevronLeft, Play, Pause, Shuffle, Trash2, Music } from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistViewProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isDark: boolean;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  onBack,
  onPlayTrack,
  onRemoveTrack,
  onDeletePlaylist,
  currentTrack,
  isPlaying,
  isDark,
}) => {
  const hasCover = Boolean(playlist.coverUrl);

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShuffle = () => {
    if (playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className={`flex items-center gap-1 text-sm font-sf-bold px-3 py-1.5 rounded-full transition-all cursor-pointer border ${
            isDark
              ? 'bg-zinc-900 text-white hover:bg-zinc-800 border-white/10'
              : 'bg-zinc-100 text-black hover:bg-zinc-200 border-black/10'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm(`¿Seguro que deseas eliminar la playlist "${playlist.name}"?`)) {
              onDeletePlaylist(playlist.id);
            }
          }}
          className={`p-2 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-red-500 hover:bg-red-500/10`}
          title="Eliminar playlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Playlist Header (Apple Music Layout) */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-2 pb-4">
        {/* Artwork */}
        <div
          className={`w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl shrink-0 border relative ${
            isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
          }`}
        >
          {hasCover ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${
                isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              <Music className="w-16 h-16 mb-2 opacity-50" />
              <span className="text-xs font-sf-bold uppercase tracking-wider opacity-70">
                Mi Playlist
              </span>
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <span className="text-xs font-sf-bold uppercase tracking-wider text-zinc-500 block mb-1">
            {playlist.curator ? 'ÁLBUM' : 'PLAYLIST'}
          </span>
          <h1
            className={`text-2xl sm:text-4xl font-black tracking-tight truncate leading-tight ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            {playlist.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-sf-regular mt-1">
            {playlist.curator ? playlist.curator : 'Creada por ti'} • {playlist.tracks.length}{' '}
            {playlist.tracks.length === 1 ? 'canción' : 'canciones'}
          </p>

          {/* Action Buttons: Play & Shuffle */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
            <button
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-sf-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Reproducir</span>
            </button>

            <button
              onClick={handleShuffle}
              disabled={playlist.tracks.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sf-bold text-sm border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 border-white/15'
                  : 'bg-zinc-100 text-black hover:bg-zinc-200 border-black/15'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>Aleatorio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Songs List (ONLY user's added songs) */}
      <div className="mt-2">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-sf-bold uppercase tracking-wider text-zinc-500">
          <span>Canciones agregadas ({playlist.tracks.length})</span>
          <span className="hidden sm:inline">Duración</span>
        </div>

        {playlist.tracks.length === 0 ? (
          <div
            className={`p-10 rounded-2xl border text-center my-4 ${
              isDark ? 'bg-zinc-950 border-white/10 text-zinc-400' : 'bg-zinc-50 border-black/10 text-zinc-600'
            }`}
          >
            <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <h3
              className={`text-base font-sf-bold mb-1 ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Esta playlist no tiene canciones aún
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Para agregar canciones a esta playlist, pulsa el botón de tres puntos (···) o el icono de añadir en cualquier canción de la app.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track, playlist.tracks)}
                  className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all cursor-pointer group ${
                    isCurrent
                      ? isDark
                        ? 'bg-white/10 ring-1 ring-white/20'
                        : 'bg-black/5 ring-1 ring-black/15'
                      : isDark
                      ? 'hover:bg-white/5'
                      : 'hover:bg-black/5'
                  }`}
                >
                  {/* Left: Index number + Artwork + Title + Artist */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-6 text-center text-xs font-mono text-zinc-500 shrink-0">
                      {idx + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm bg-zinc-800">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
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
                        className={`font-sf-bold text-sm truncate ${
                          isCurrent
                            ? isDark
                              ? 'text-white font-black'
                              : 'text-black font-black'
                            : isDark
                            ? 'text-white group-hover:text-white'
                            : 'text-zinc-900'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate font-sf-regular mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration + Remove track button */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                      {track.durationFormatted || '03:30'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(playlist.id, track.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Quitar de la playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
