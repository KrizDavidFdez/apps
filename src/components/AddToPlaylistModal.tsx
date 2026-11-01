import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { Playlist, Track } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onAddTrackToPlaylist?: (playlistId: string, track: Track) => void;
  onAddToPlaylist?: (playlistId: string, track: Track) => void;
  onOpenCreatePlaylist?: () => void;
  onCreateNewPlaylist?: () => void;
  isDark?: boolean;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onAddTrackToPlaylist,
  onAddToPlaylist,
  onOpenCreatePlaylist,
  onCreateNewPlaylist,
  isDark = true,
}) => {
  if (!isOpen || !track) return null;

  const handleAdd = (playlistId: string) => {
    const addFn = onAddTrackToPlaylist || onAddToPlaylist;
    if (typeof addFn === 'function') {
      addFn(playlistId, track);
    }
    onClose();
  };

  const handleOpenCreate = () => {
    onClose();
    const openCreateFn = onOpenCreatePlaylist || onCreateNewPlaylist;
    if (typeof openCreateFn === 'function') {
      openCreateFn();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl overflow-hidden ${
            isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-black/10 text-zinc-900'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div>
              <h3 className="font-sf-bold text-base">Añadir a Playlist</h3>
              <p className="text-xs text-zinc-400 font-sf-regular truncate max-w-[220px]">
                {track.title} • {track.artist}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Playlist CTA */}
          <button
            onClick={handleOpenCreate}
            className={`w-full mt-3.5 mb-2 py-2.5 px-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 font-sf-bold text-xs transition-all cursor-pointer ${
              isDark
                ? 'border-white/30 hover:border-white bg-white/5 hover:bg-white/10 text-white'
                : 'border-black/30 hover:border-black bg-black/5 hover:bg-black/10 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            Crear nueva playlist
          </button>

          {/* Playlists List */}
          <div className="flex flex-col divide-y divide-white/5 max-h-64 overflow-y-auto mt-1">
            {playlists.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No tienes playlists creadas todavía.
              </div>
            ) : (
              playlists.map((pl, idx) => {
                const isAlreadyIn = pl.tracks.some((t) => t.id === track.id);
                return (
                  <button
                    key={`${pl.id}-${idx}`}
                    onClick={() => {
                      if (!isAlreadyIn) {
                        handleAdd(pl.id);
                      } else {
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors text-left w-full cursor-pointer ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm border ${
                        isDark ? 'bg-zinc-800 border-white/10' : 'bg-zinc-100 border-black/10'
                      }`}>
                        {pl.coverUrl ? (
                          <img
                            src={pl.coverUrl}
                            alt={pl.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-sf-bold text-xs truncate ${isDark ? 'text-white' : 'text-black'}`}>{pl.name}</p>
                        <p className="font-sf-regular text-[11px] text-zinc-400">
                          {pl.tracks.length} {pl.tracks.length === 1 ? 'canción' : 'canciones'}
                        </p>
                      </div>
                    </div>

                    {isAlreadyIn ? (
                      <span className="flex items-center gap-1 text-[11px] font-sf-bold text-emerald-500 shrink-0">
                        <Check className="w-3.5 h-3.5" /> En lista
                      </span>
                    ) : (
                      <span className={`text-xs font-sf-bold shrink-0 ${
                        isDark ? 'text-white hover:underline' : 'text-black hover:underline'
                      }`}>
                        + Añadir
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
