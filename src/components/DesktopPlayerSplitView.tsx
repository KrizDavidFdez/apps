import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Check, Share2, Star, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, LyricLine, ViewMode } from '../types';
import { LyricsView } from './LyricsView';
import {
  AppleBackwardIcon,
  AppleForwardIcon,
  ApplePlayIcon,
  ApplePauseIcon,
  AppleSpeakerLowIcon,
  AppleSpeakerHighIcon,
  AppleQuotesIcon,
  AppleQueueIcon,
} from './PlayerControls';

// Apple Music Shuffle Icon
export const AppleShuffleIcon: React.FC<{ className?: string; active?: boolean }> = ({
  className = 'w-5 h-5',
  active = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

// Apple Music Repeat Icon
export const AppleRepeatIcon: React.FC<{ className?: string; mode?: 'off' | 'all' | 'one' }> = ({
  className = 'w-5 h-5',
  mode = 'off',
}) => (
  <div className="relative flex items-center justify-center">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
    {mode === 'one' && (
      <span className="absolute text-[8px] font-black leading-none top-[6px] text-white">1</span>
    )}
  </div>
);

interface DesktopPlayerSplitViewProps {
  currentTrack: Track;
  isPlaying: boolean;
  isDownloadingTrack?: boolean;
  currentTime: number;
  duration: number;
  isFavorite: boolean;
  lyrics: LyricLine[];
  isSynced: boolean;
  activeLyricIndex: number;
  isIntroInstrumental: boolean;
  isLoadingLyrics: boolean;
  isKaraokeEffect: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleFavorite: () => void;
  onAddToPlaylist: () => void;
  onOpenQueue: () => void;
  onToggleKaraokeEffect: () => void;
  onToggleLyrics: () => void;
  onClose: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  viewMode: ViewMode;
}

export const DesktopPlayerSplitView: React.FC<DesktopPlayerSplitViewProps> = ({
  currentTrack,
  isPlaying,
  isDownloadingTrack = false,
  currentTime,
  duration,
  isFavorite,
  lyrics,
  isSynced,
  activeLyricIndex,
  isIntroInstrumental,
  isLoadingLyrics,
  isKaraokeEffect,
  audioRef,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleFavorite,
  onAddToPlaylist,
  onOpenQueue,
  onToggleLyrics,
  onClose,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  viewMode,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const playerCardRef = useRef<HTMLDivElement>(null);
  const [playerHeight, setPlayerHeight] = useState<number>(0);

  useEffect(() => {
    const el = playerCardRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (el) {
        const h = el.offsetHeight || el.getBoundingClientRect().height;
        if (h > 0) {
          setPlayerHeight(h);
        }
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [currentTrack]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 0.8);
    } else {
      if (audioRef.current) audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentTrack.title,
          text: `Escuchando ${currentTrack.title} de ${currentTrack.artist}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${currentTrack.title} - ${currentTrack.artist}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const currentVol = isMuted ? 0 : volume;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative z-20 select-none font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* 1. Top iPad / Desktop Grab Bar Header */}
      <div className="w-full pt-3 pb-1 flex items-center justify-center relative shrink-0 z-30">
        <button
          onClick={onClose}
          className="w-14 h-5 flex items-center justify-center group cursor-pointer"
          aria-label="Minimizar reproductor"
        >
          <div className="w-10 h-1.5 bg-white/35 group-hover:bg-white/60 rounded-full transition-colors" />
        </button>
      </div>

      {/* 2. Main 2-Column Split Content */}
      <div className="flex-1 w-full min-h-0 flex flex-row items-center justify-center px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-2 md:py-4 gap-4 sm:gap-6 md:gap-10 lg:gap-16 xl:gap-20 overflow-hidden relative">
        {/* LEFT COLUMN: Cohesive Centered Player Card */}
        <div className="w-[45%] lg:w-[40%] xl:w-[38%] max-w-[420px] flex flex-col items-center justify-center shrink-0 z-20">
          <div
            ref={playerCardRef}
            className="w-full flex flex-col items-center gap-3.5 sm:gap-4 md:gap-5"
          >
            {/* Big Square Album Artwork */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-white/10 relative group">
              <img
                src={currentTrack.coverUrl || 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/fa/6f/9efa6fe0-5ce8-3f55-7ed6-24cda7d77505/196874447369.jpg/600x600bb.jpg'}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>

            {/* Track Info + Star & More Options row */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] flex items-center justify-between px-0.5">
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-white/60 tracking-tight leading-snug truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Star and More Actions */}
              <div className="flex items-center gap-2 shrink-0 relative">
                {/* Star Favorite Button */}
                <button
                  onClick={onToggleFavorite}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all flex items-center justify-center text-white backdrop-blur-md cursor-pointer"
                  aria-label="Favorito"
                >
                  <Star
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200"
                    fill={isFavorite ? '#ffffff' : 'none'}
                    stroke="#ffffff"
                    strokeWidth={isFavorite ? 0 : 2}
                  />
                </button>

                {/* More Options Button */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all flex items-center justify-center text-white backdrop-blur-md cursor-pointer"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      className="absolute right-0 top-11 w-52 py-1.5 bg-zinc-900/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl z-50 flex flex-col text-sm text-white overflow-hidden"
                    >
                      <button
                        onClick={handleShare}
                        className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 opacity-70" />
                          <span>Compartir canción</span>
                        </div>
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                      </button>
                      {(currentTrack.downloadUrl || currentTrack.audioUrl) && (
                        <a
                          href={
                            currentTrack.downloadUrl ||
                            `${currentTrack.audioUrl}&download=1&filename=${encodeURIComponent(
                              `${currentTrack.artist} - ${currentTrack.title}.mp3`
                            )}`
                          }
                          download={`${currentTrack.artist} - ${currentTrack.title}.mp3`}
                          className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center gap-2 cursor-pointer text-white"
                          onClick={() => setShowMenu(false)}
                        >
                          <Download className="w-4 h-4 opacity-70" />
                          <span>Descargar MP3</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onAddToPlaylist();
                        }}
                        className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Añadir a una playlist</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress Scrub Bar */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] flex flex-col gap-1">
              <div className="relative flex items-center h-3.5 group cursor-pointer">
                <div className="w-full h-[5px] bg-white/25 rounded-full overflow-hidden transition-all backdrop-blur-sm">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Seek track position"
                />
              </div>

              {/* Timestamps */}
              <div className="flex justify-between items-center px-0.5">
                <span className="text-xs font-medium text-white/50 tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs font-medium text-white/50 tabular-nums text-right">
                  -{formatTime(Math.max(0, duration - currentTime))}
                </span>
              </div>
            </div>

            {/* Playback Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] flex items-center justify-between px-1">
              {/* Shuffle */}
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                  isShuffle ? 'text-pink-400' : 'text-white/40 hover:text-white'
                }`}
                title={isShuffle ? 'Aleatorio activado' : 'Aleatorio desactivado'}
                aria-label="Shuffle"
              >
                <AppleShuffleIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" active={isShuffle} />
              </button>

              {/* Skip Back */}
              <button
                onClick={onPrev}
                className="text-white hover:text-white/80 active:scale-90 transition-transform p-1.5 flex items-center justify-center cursor-pointer"
                aria-label="Previous Track"
              >
                <AppleBackwardIcon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={onTogglePlay}
                disabled={isDownloadingTrack}
                className="text-white hover:text-white/80 active:scale-95 transition-transform p-1.5 flex items-center justify-center disabled:opacity-80 cursor-pointer"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isDownloadingTrack ? (
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-white/90" />
                ) : (
                  <motion.div
                    key={isPlaying ? 'pause' : 'play'}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <ApplePauseIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13" />
                    ) : (
                      <ApplePlayIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 translate-x-0.5" />
                    )}
                  </motion.div>
                )}
              </button>

              {/* Skip Forward */}
              <button
                onClick={onNext}
                className="text-white hover:text-white/80 active:scale-90 transition-transform p-1.5 flex items-center justify-center cursor-pointer"
                aria-label="Next Track"
              >
                <AppleForwardIcon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </button>

              {/* Repeat */}
              <button
                onClick={onToggleRepeat}
                className={`p-1.5 transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                  repeatMode !== 'off' ? 'text-pink-400' : 'text-white/40 hover:text-white'
                }`}
                title={`Repetición: ${repeatMode}`}
                aria-label="Repeat"
              >
                <AppleRepeatIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" mode={repeatMode} />
              </button>
            </div>

            {/* Volume Slider Row */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] flex items-center gap-2.5 px-0.5">
              <button
                onClick={toggleMute}
                className="text-white/50 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer"
                aria-label="Mute / Unmute"
              >
                <AppleSpeakerLowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="relative flex-1 flex items-center h-3.5 group cursor-pointer">
                <div className="w-full h-[5px] bg-white/20 rounded-full overflow-hidden transition-all backdrop-blur-sm">
                  <div
                    className="h-full bg-white/80 rounded-full transition-all duration-75"
                    style={{ width: `${currentVol * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={currentVol}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume Slider"
                />
              </div>

              <button
                onClick={() => handleVolumeChange(1)}
                className="text-white/50 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer"
                aria-label="Max Volume"
              >
                <AppleSpeakerHighIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Synchronized Lyrics Stream - matches player card height */}
        <div className="flex-1 min-w-0 relative z-10 flex flex-col justify-center items-stretch">
          {/* Lyrics Canvas Stream Container */}
          <div
            className="w-full relative overflow-hidden"
            style={{
              height: playerHeight > 0 ? `${playerHeight}px` : '520px',
              maxHeight: '100%',
            }}
          >
            <LyricsView
              lyrics={lyrics}
              isSynced={isSynced}
              activeLyricIndex={activeLyricIndex}
              isIntroInstrumental={isIntroInstrumental}
              onSeek={onSeek}
              isLoading={isLoadingLyrics}
              isControlsHidden={true}
              currentTime={currentTime}
              isKaraokeEffect={isKaraokeEffect}
              audioRef={audioRef}
            />
          </div>
        </div>

        {/* Bottom Right Floating Action Icons (Quotes and Queue) */}
        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 md:bottom-6 md:right-8 lg:bottom-8 lg:right-12 flex items-center gap-2.5 sm:gap-3 z-30">
          <button
            onClick={onToggleLyrics}
            className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
              viewMode === 'lyrics'
                ? 'bg-white/25 text-white shadow-lg backdrop-blur-md ring-1 ring-white/20'
                : 'text-white/50 hover:text-white'
            }`}
            title="Ver letras sincronizadas"
            aria-label="Toggle Lyrics View"
          >
            <AppleQuotesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={onOpenQueue}
            className="p-2 sm:p-2.5 rounded-xl text-white/50 hover:text-white transition-all active:scale-90 flex items-center justify-center cursor-pointer"
            title="A continuación (Cola de reproducción)"
            aria-label="Queue list"
          >
            <AppleQueueIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
