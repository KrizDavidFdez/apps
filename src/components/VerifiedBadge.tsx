import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

// Normalized list of world-famous & verified chart-topping artists
const VERIFIED_ARTISTS_SET = new Set([
  'the weeknd',
  'bad bunny',
  'rosalía',
  'rosalia',
  'the marías',
  'the marias',
  'feid',
  'karol g',
  'drake',
  'taylor swift',
  'billie eilish',
  'travis scott',
  'dua lipa',
  'bruno mars',
  'kendrick lamar',
  'ariana grande',
  'justin bieber',
  'rauw alejandro',
  'anuel aa',
  'j balvin',
  'shakira',
  'peso pluma',
  'bizarrap',
  'quevedo',
  'mora',
  'myke towers',
  'coldplay',
  'sza',
  'harry styles',
  'eminem',
  'rihanna',
  'post malone',
  'beyoncé',
  'beyonce',
  'ed sheeran',
  'olivia rodrigo',
  'lana del rey',
  'selena gomez',
  'daddy yankee',
  'maluma',
  'ozuna',
  'young miko',
  'lady gaga',
  'adele',
  'daft punk',
  'kanye west',
  'kali uchis',
  'fuerza regida',
  'carin leon',
  'junior h',
  'natanael cano',
  'dannylux',
  'jasiel nuñez',
  'jasiel nunez',
  'rels b',
  'c. tangana',
  'trueno',
  'duki',
  'nicki nicole',
  'tiago pzk',
  'maria becerra',
  'emilia',
  'milo j',
  'cris mj',
  'floyymenor',
  'jhayco',
  'sech',
  'chencho corleone',
  'farruko',
  'don omar',
  'wisin & yandel',
  'wisin',
  'yandel',
  'arcángel',
  'arcangel',
  'eladio carrión',
  'eladio carrion',
  'alvaro diaz',
  'tini',
  'sebastian yatra',
  'camilo',
  'ricky martin',
  'luis fonsi',
  'chayanne',
  'enrique iglesias',
  'maroon 5',
  'imagine dragons',
  'twenty one pilots',
  'arctic monkeys',
  'gorillaz',
  'linkin park',
  'michael jackson',
  'queen',
]);

/**
 * Checks whether an artist is a verified famous artist.
 */
export function isFamousArtist(artistName?: string | null): boolean {
  if (!artistName) return false;
  const normalized = artistName.trim().toLowerCase();
  if (VERIFIED_ARTISTS_SET.has(normalized)) return true;

  // Partial or featured checks, e.g. "Bad Bunny feat. Chencho Corleone", "The Weeknd & Playboi Carti"
  for (const famous of VERIFIED_ARTISTS_SET) {
    if (normalized.startsWith(famous) || normalized.includes(famous)) {
      return true;
    }
  }
  return false;
}

/**
 * Official Apple Music / Spotify style Verified Artist Badge.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = React.memo(() => {
  return null;
});

VerifiedBadge.displayName = 'VerifiedBadge';
