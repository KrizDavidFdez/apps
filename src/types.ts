export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string;
  downloadUrl?: string;
  duration?: number;
  durationFormatted?: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
  };
  isVerified?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  pictureUrl: string;
  isVerified?: boolean;
}

export interface AlbumItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  trackCount?: number;
  releaseDate?: string;
}

export interface LyricLine {
  text: string;
  time: number;
  agent?: string;
  singerName?: string;
  align?: 'left' | 'right' | 'center';
  words?: {
    text: string;
    start: number;
    end: number;
    hasSpace?: boolean;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl: string;
}

export type ViewMode = 'album' | 'lyrics' | 'queue';
export type PlayMode = 'normal' | 'repeat' | 'shuffle';

export interface Playlist {
  id: string;
  name: string;
  coverUrl?: string;
  createdAt: number;
  tracks: Track[];
  curator?: string;
}

export interface HistoryItem {
  id: string;
  track: Track;
  playedAt: number;
}

export interface AnimatedLetterProps {
  letter: string;
  duration: number;
  delay: number;
  currentTimeMs?: number;
}

export interface AnimatedWordProps {
  word: {
    content: string;
    startMillisecond: number;
  };
  duration: number;
  currentTimeMs?: number;
}

export interface WrappedSubLine {
  text: string;
  subIndex: number;
  totalSubLines: number;
  fullWidth: number;
  align?: 'left' | 'right' | 'center';
  agent?: string;
  singerName?: string;
  words: {
    text: string;
    start: number;
    duration: number;
    width: number;
    xOffset: number;
    hasSpace?: boolean;
  }[];
  isMusicLine?: boolean;
}

export interface ComputedLyricLine {
  index: number;
  time: number;
  agent?: string;
  singerName?: string;
  align?: 'left' | 'right' | 'center';
  artistChanged?: boolean;
  subLines: WrappedSubLine[];
  height: number;
  topOffset: number;
  charCount: number;
}


