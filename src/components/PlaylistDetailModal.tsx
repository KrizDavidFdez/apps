import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, Trash2, Plus, Music, Search, Check } from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistDetailModalProps {
  isOpen: boolean;
  playlist: Playlist | null;
  onClose: () => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onAddTrack?: (playlistId: string, track: Track) => void;
  availableTracks?: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isDark?: boolean;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  isOpen,
  playlist,
  onClose,
  onPlayTrack,
  onRemoveTrack,
  onDeletePlaylist,
  onAddTrack,
  availableTracks = [],
  currentTrack,
  isPlaying,
  isDark = true,
}) => {
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [searchSongQuery, setSearchSongQuery] = useState('');

  if (!isOpen || !playlist) return null;

  const filteredAvailableTracks = (availableTracks || []).filter((t) => {
    const matchesSearch =
      !searchSongQuery.trim() ||
      t.title.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchSongQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const coverImage =
    playlist.coverUrl ||
    (playlist.tracks.length > 0 ? playlist.tracks[0].coverUrl : undefined);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-2xl rounded-3xl p-5 sm:p-7 border shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] ${
            isDark ? 'bg-zinc-900/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-zinc-900'
          }`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <span className="text-xs font-sf-bold text-zinc-400 uppercase tracking-wider">
              Playlist personalizada
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Playlist Info Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 py-5 shrink-0 border-b border-white/5">
            {/* Playlist Image */}
            <div className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl shrink-0 border ${
              isDark ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-black/10'
            }`}>
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={playlist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${
                  isDark ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'
                }`}>
                  <Music className="w-12 h-12 mb-2 opacity-70" />
                  <span className="text-xs font-sf-bold uppercase tracking-wider opacity-80">Sin carátula</span>
                </div>
              )}
            </div>

            {/* Meta details */}
            <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col items-center sm:items-start justify-end">
              <span className={`text-xs font-sf-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                PLAYLIST
              </span>
              <h2 className="text-2xl sm:text-3xl font-sf-bold tracking-tight truncate w-full mt-1">
                {playlist.name}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-sf-regular mt-1">
                {playlist.tracks.length} {playlist.tracks.length === 1 ? 'canción' : 'canciones'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                {playlist.tracks.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sf-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 ${
                      isDark ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Reproducir todo
                  </button>
                )}

                <button
                  onClick={() => setIsAddingSongs(!isAddingSongs)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-sf-bold transition-all cursor-pointer ${
                    isAddingSongs
                      ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                      : isDark
                      ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                      : 'bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {isAddingSongs ? 'Cerrar selector' : 'Añadir canciones'}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la playlist "${playlist.name}"?`)) {
                      onDeletePlaylist(playlist.id);
                      onClose();
                    }
                  }}
                  className="p-2.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Eliminar playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body: Songs List or Add Songs Mode */}
          <div className="flex-1 overflow-y-auto pt-4 min-h-0">
            {isAddingSongs ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-sf-bold text-sm">Buscar y agregar canciones</h4>
                  <span className="text-xs text-zinc-400">{filteredAvailableTracks.length} disponibles</span>
                </div>

                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                    isDark ? 'bg-zinc-800 border-white/10 text-white' : 'bg-zinc-100 border-black/10 text-zinc-900'
                  }`}
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchSongQuery}
                    onChange={(e) => setSearchSongQuery(e.target.value)}
                    placeholder="Buscar canción o artista para añadir..."
                    className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-zinc-500"
                  />
                </div>

                <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                  {filteredAvailableTracks.map((song, sIdx) => {
                    const alreadyInPlaylist = playlist.tracks.some((t) => t.id === song.id);
                    return (
                      <div
                        key={`${song.id}-${sIdx}`}
                        className="flex items-center justify-between py-2 px-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-sf-bold text-xs truncate">{song.title}</p>
                            <p className="font-sf-regular text-[11px] text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        {alreadyInPlaylist ? (
                          <span className="flex items-center gap-1 text-[11px] font-sf-bold text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-full">
                            <Check className="w-3 h-3" /> Añadida
                          </span>
                        ) : (
                          <button
                            onClick={() => onAddTrack(playlist.id, song)}
                            className={`flex items-center gap-1 text-[11px] font-sf-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
                              isDark
                                ? 'text-white hover:bg-white/10 border-white/20'
                                : 'text-black hover:bg-black/10 border-black/20'
                            }`}
                          >
                            <Plus className="w-3 h-3" /> Añadir
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : playlist.tracks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500">
                <Music className="w-12 h-12 mb-3 opacity-30 text-zinc-400" />
                <p className={`font-sf-bold text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Esta playlist está vacía</p>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Haz clic en &quot;Añadir canciones&quot; para guardar tus temas favoritos aquí.
                </p>
                <button
                  onClick={() => setIsAddingSongs(true)}
                  className={`mt-4 px-4 py-2 rounded-full font-sf-bold text-xs shadow-sm cursor-pointer ${
                    isDark ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white'
                  }`}
                >
                  Agregar canciones ahora
                </button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {playlist.tracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.id || 'track'}-${idx}`}
                      onClick={() => onPlayTrack(track, playlist.tracks)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                        isCurrent
                          ? isDark
                            ? 'bg-white/10 border border-white/20'
                            : 'bg-black/5 border border-black/10'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-5 text-center text-xs font-mono text-zinc-500">
                          {idx + 1}
                        </span>

                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-sm bg-zinc-800">
                          {track.coverUrl ? (
                            <img
                              src={track.coverUrl}
                              alt={track.title}
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
                          <h5
                            className={`font-sf-bold text-sm truncate ${
                              isCurrent
                                ? isDark ? 'text-white font-black' : 'text-black font-black'
                                : isDark ? 'text-white' : 'text-zinc-900'
                            }`}
                          >
                            {track.title}
                          </h5>
                          <p className="font-sf-regular text-xs text-zinc-400 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTrack(playlist.id, track.id);
                          }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Quitar de playlist"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
