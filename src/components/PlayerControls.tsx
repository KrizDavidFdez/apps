import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  isDownloadingTrack?: boolean;
  currentTime: number;
  duration: number;
  viewMode: ViewMode;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleLyrics: () => void;
  onOpenQueue: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isKaraokeEffect?: boolean;
  onToggleKaraokeEffect?: () => void;
}

// Exact Apple Music Backward Icon (SF Symbol: backward.fill - ◀◀)
export const AppleBackwardIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Right triangle */}
    <path d="M15.4 16.85l9.1 6.07c.85.57 1.9-.04 1.9-1.05V10.13c0-1.01-1.05-1.62-1.9-1.05l-9.1 6.07c-.5.33-.5 1.37 0 1.7z" />
    {/* Left triangle */}
    <path d="M4.6 16.85l9.1 6.07c.85.57 1.9-.04 1.9-1.05V10.13c0-1.01-1.05-1.62-1.9-1.05L4.6 15.15c-.5.33-.5 1.37 0 1.7z" />
  </svg>
);

// Exact Apple Music Forward Icon (SF Symbol: forward.fill - ▶▶)
export const AppleForwardIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left triangle */}
    <path d="M16.6 15.15L7.5 9.08c-.85-.57-1.9.04-1.9 1.05v11.74c0 1.01 1.05 1.62 1.9 1.05l9.1-6.07c.5-.33.5-1.37 0-1.7z" />
    {/* Right triangle */}
    <path d="M27.4 15.15l-9.1-6.07c-.85-.57-1.9.04-1.9 1.05v11.74c0 1.01 1.05 1.62 1.9 1.05l9.1-6.07c.5-.33.5-1.37 0-1.7z" />
  </svg>
);

// Exact Apple Music Play Icon (SF Symbol: play.fill - ▶)
export const ApplePlayIcon: React.FC<{ className?: string }> = ({ className = 'w-13 h-13' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.5 7.15c0-1.25 1.38-2.02 2.45-1.37l14.7 9.08c1.02.63 1.02 2.11 0 2.74l-14.7 9.08c-1.07.65-2.45-.12-2.45-1.37V7.15z" />
  </svg>
);

// Exact Apple Music Pause Icon (SF Symbol: pause.fill - ❚❚ with rounded capsule bars)
export const ApplePauseIcon: React.FC<{ className?: string }> = ({ className = 'w-13 h-13' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="7.5" y="4.5" width="5.5" height="23" rx="2.75" />
    <rect x="19" y="4.5" width="5.5" height="23" rx="2.75" />
  </svg>
);

// Exact Apple Music Low Volume Icon (SF Symbol: speaker.fill)
export const AppleSpeakerLowIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.5 3.3c-.56-.4-1.32-.31-1.78.2L6.8 8.1H3.8c-1 0-1.8.8-1.8 1.8v4.2c0 1 .8 1.8 1.8 1.8h3l3.92 4.6c.46.51 1.22.6 1.78.2.57-.4.9-1.05.9-1.73V5.03c0-.68-.33-1.33-.9-1.73z" />
  </svg>
);

// Exact Apple Music High Volume Icon (SF Symbol: speaker.wave.3.fill)
export const AppleSpeakerHighIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11 3.3c-.56-.4-1.32-.31-1.78.2L5.3 8.1H2.5c-1 0-1.8.8-1.8 1.8v4.2c0 1 .8 1.8 1.8 1.8h2.8l3.92 4.6c.46.51 1.22.6 1.78.2.57-.4.9-1.05.9-1.73V5.03c0-.68-.33-1.33-.9-1.73z" />
    <path
      d="M14.8 9c1 1 1.5 2 1.5 3s-.5 2-1.5 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M17.5 6.5c1.8 1.5 2.8 3.4 2.8 5.5s-1 4-2.8 5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20.2 4c2.5 2.1 4 4.8 4 8s-1.5 5.9-4 8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Exact Apple Music Quotes/Lyrics Icon (SF Symbol: quote.bubble)
export const AppleQuotesIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3.5A2.5 2.5 0 002.5 6v9A2.5 2.5 0 005 17.5h2.2v2.4a.6.6 0 001.02.42L11.5 17.5H19a2.5 2.5 0 002.5-2.5V6A2.5 2.5 0 0019 3.5H5zm4.8 6.7c0 .9-.7 1.6-1.6 1.6H7.8v.4a.7.7 0 01-1.4 0v-2.2c0-1.4 1.1-2.5 2.5-2.5h.4a.7.7 0 01.7.7v1.1a.7.7 0 01-.7.7h-.4a.2.2 0 00-.2.2v.3h.5c.9 0 1.6.7 1.6 1.6zm6.2 0c0 .9-.7 1.6-1.6 1.6H14v.4a.7.7 0 01-1.4 0v-2.2c0-1.4 1.1-2.5 2.5-2.5h.4a.7.7 0 01.7.7v1.1a.7.7 0 01-.7.7h-.4a.2.2 0 00-.2.2v.3h.5c.9 0 1.6.7 1.6 1.6z"
    />
  </svg>
);

// Exact Apple Music Queue / Up Next Icon (SF Symbol: list.bullet)
export const AppleQueueIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 3 bullet dots */}
    <circle cx="4.25" cy="6.75" r="1.3" />
    <circle cx="4.25" cy="12" r="1.3" />
    <circle cx="4.25" cy="17.25" r="1.3" />
    {/* 3 horizontal rounded bars */}
    <rect x="8.25" y="5.6" width="12.5" height="2.3" rx="1.15" />
    <rect x="8.25" y="10.85" width="12.5" height="2.3" rx="1.15" />
    <rect x="8.25" y="16.1" width="12.5" height="2.3" rx="1.15" />
  </svg>
);

export const PlayerControls: React.FC<PlayerControlsProps> = React.memo(({
  isPlaying,
  currentTime,
  duration,
  viewMode,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleLyrics,
  onOpenQueue,
  audioRef,
  isKaraokeEffect,
  onToggleKaraokeEffect,
  isDownloadingTrack = false,
}) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const currentVol = isMuted ? 0 : volume;

  return (
    <div
      id="player-controls-container"
      className="relative z-30 w-full max-w-md sm:max-w-lg mx-auto px-6 sm:px-8 pb-8 pt-1 flex flex-col gap-4 select-none"
    >
      {/* 1. Progress Scrub Bar & Timestamps */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="relative flex items-center h-4 group cursor-pointer">
          <div className="w-full h-[6px] bg-white/25 rounded-full overflow-hidden transition-all backdrop-blur-sm">
            <div
              className="h-full bg-white rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            id="audio-scrub-slider"
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
          <span className="text-xs md:text-sm font-medium text-zinc-400 w-10 tabular-nums font-['SF_Pro_Display',sans-serif]">
            {formatTime(currentTime)}
          </span>

          <span className="text-xs md:text-sm font-medium text-zinc-400 w-10 tabular-nums text-right font-['SF_Pro_Display',sans-serif]">
            -{formatTime(Math.max(0, duration - currentTime))}
          </span>
        </div>
      </div>

      {/* 2. Main Transport Controls (◀◀, ❚❚ / ▶, ▶▶) - Exact Apple Music Styling */}
      <div className="flex items-center justify-center gap-14 sm:gap-20 py-2">
        {/* Skip Back (◀◀) */}
        <button
          id="skip-prev-btn"
          onClick={onPrev}
          className="text-white hover:text-white/80 active:scale-90 transition-transform p-2 flex items-center justify-center cursor-pointer"
          aria-label="Previous Track"
        >
          <AppleBackwardIcon className="w-10 h-10 sm:w-11 sm:h-11" />
        </button>

        {/* Play / Pause (❚❚ / ▶) */}
        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          disabled={isDownloadingTrack}
          className="text-white hover:text-white/80 active:scale-95 transition-transform p-2 flex items-center justify-center disabled:opacity-80 cursor-pointer"
          aria-label={isDownloadingTrack ? 'Descargando canción completa...' : isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isDownloadingTrack ? (
            <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 animate-spin text-white/90" />
          ) : (
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="flex items-center justify-center"
            >
              {isPlaying ? (
                <ApplePauseIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              ) : (
                <ApplePlayIcon className="w-12 h-12 sm:w-14 sm:h-14 translate-x-0.5" />
              )}
            </motion.div>
          )}
        </button>

        {/* Skip Forward (▶▶) */}
        <button
          id="skip-next-btn"
          onClick={onNext}
          className="text-white hover:text-white/80 active:scale-90 transition-transform p-2 flex items-center justify-center cursor-pointer"
          aria-label="Next Track"
        >
          <AppleForwardIcon className="w-10 h-10 sm:w-11 sm:h-11" />
        </button>
      </div>

      {/* 3. Apple Music Volume Capsule Slider (Exact replica: speaker + capsule bar + speaker) */}
      <div className="flex items-center gap-3 px-1 mt-2">
        <button
          onClick={toggleMute}
          className="text-white/60 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer"
          aria-label="Mute / Unmute"
        >
          <AppleSpeakerLowIcon className="w-4 h-4" />
        </button>

        {/* Thick Apple Music Capsule Track */}
        <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
          <div className="w-full h-[7px] bg-white/20 rounded-full overflow-hidden transition-all backdrop-blur-sm">
            <div
              className="h-full bg-white/75 rounded-full transition-all duration-75"
              style={{ width: `${currentVol * 100}%` }}
            />
          </div>
          <input
            id="volume-slider"
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
          className="text-white/60 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer"
          aria-label="Max Volume"
        >
          <AppleSpeakerHighIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Bottom Apple Music Action Icons (Quotes/Lyrics and Queue) */}
      <div className="flex items-center justify-between px-8 sm:px-12 pt-3">
        {/* 1. Lyrics Quotes Icon */}
        <button
          id="apple-music-lyrics-quote-btn"
          onClick={onToggleLyrics}
          className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
            viewMode === 'lyrics'
              ? 'bg-white/25 text-white shadow-lg backdrop-blur-md ring-1 ring-white/20'
              : 'text-white/60 hover:text-white'
          }`}
          title="Ver letras sincronizadas"
          aria-label="Toggle Lyrics View"
        >
          <AppleQuotesIcon className="w-6 h-6" />
        </button>

        {/* 2. Queue / Up Next Icon */}
        <button
          id="apple-music-queue-btn"
          onClick={onOpenQueue}
          className="p-2.5 rounded-xl text-white/60 hover:text-white transition-all active:scale-90 flex items-center justify-center cursor-pointer"
          title="A continuación (Cola de reproducción)"
          aria-label="Queue list"
        >
          <AppleQueueIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
});

PlayerControls.displayName = 'PlayerControls';
