import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListMusic, Play, X, Music } from 'lucide-react';
import { Track } from '../types';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrack,
  onSelectTrack,
}) => {
  // Limitar exactamente a 3 canciones a partir de la canción en reproducción
  const visibleTracks = useMemo(() => {
    if (!queue || queue.length === 0) return [];
    if (!currentTrack) return queue.slice(0, 3);

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) {
      return queue.slice(0, 3);
    }

    // Incluye la canción actual + las siguientes para un total de exactamente 3
    const after = queue.slice(currentIndex, currentIndex + 3);
    if (after.length < 3 && queue.length > after.length) {
      const needed = 3 - after.length;
      const wrap = queue.slice(0, Math.min(currentIndex, needed));
      return [...after, ...wrap];
    }
    return after;
  }, [queue, currentTrack]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl text-white max-h-[75vh] flex flex-col font-['SF_Pro_Display',-apple-system,sans-serif]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-white/70" />
                <h3 className="font-bold text-base">A continuación</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 flex flex-col gap-2 no-scrollbar pr-1">
              {visibleTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => {
                      onSelectTrack(track);
                      onClose();
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-white/20 border border-white/20 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover shadow-sm shrink-0 bg-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl shadow-sm shrink-0 bg-white/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate text-white">{track.title}</div>
                      <div className="text-xs text-white/60 truncate">{track.artist}</div>
                    </div>
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                    ) : (
                      <Play className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
