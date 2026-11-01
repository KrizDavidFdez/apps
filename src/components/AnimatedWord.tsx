import React, { useEffect, useState } from 'react';
import { AnimatedLetterProps, AnimatedWordProps } from '../types';

/**
 * Equivalent to Reanimated's Easing.out(Easing.exp)
 */
export function easeOutExp(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

/**
 * Smooth cosine S-curve (zero initial velocity jerk, zero landing velocity jerk)
 * for liquid Apple Music letter-by-letter levitation.
 */
export function easeInOutSine(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

/**
 * Computes the exact opacity, smooth vertical levitation (translateY), and subtle vocal scale pulse
 * for a letter at a given timestamp:
 * - opacity: 0.48 -> 1.0 with Easing.out(Easing.exp)
 * - translateY: 0 -> -maxLiftPx with smooth cosine S-curve + active vocal wave crest
 * - scale: 1.0 -> 1.034 -> 1.0 vocal swell as the letter is actively sung
 */
export function computeAnimatedLetterStyle(
  currentTimeMs: number,
  delayMs: number,
  durationMs: number,
  maxLiftPx: number = 3.0
): { opacity: number; translateY: number; scale: number; glow: number } {
  const safeDuration = Math.max(1, durationMs);
  const elapsed = currentTimeMs - delayMs;
  const progress = Math.max(0, Math.min(1, elapsed / safeDuration));
  const waveCrest = Math.sin(progress * Math.PI);

  return {
    opacity: 0.48 + 0.52 * easeOutExp(progress),
    translateY: -maxLiftPx * easeInOutSine(progress) - maxLiftPx * 0.16 * waveCrest,
    scale: 1 + 0.024 * waveCrest,
    glow: easeInOutSine(progress),
  };
}

export const AnimatedLetter: React.FC<AnimatedLetterProps> = ({
  letter,
  duration,
  delay,
  currentTimeMs,
}) => {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (typeof currentTimeMs === 'number') return;
    const timer = setTimeout(() => {
      setTriggered(true);
    }, Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [delay, currentTimeMs]);

  if (typeof currentTimeMs === 'number') {
    const { opacity, translateY } = computeAnimatedLetterStyle(currentTimeMs, delay, duration);
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize: 28,
          fontWeight: 800,
          color: '#ffffff',
          opacity,
          transform: `translateY(${translateY}px)`,
          willChange: 'transform, opacity',
        }}
      >
        {letter === ' ' ? '\u00A0' : letter}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 28,
        fontWeight: 800,
        color: '#ffffff',
        opacity: triggered ? 1 : 0.5,
        transform: `translateY(${triggered ? -2 : 0}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms linear`,
        willChange: 'transform, opacity',
      }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  );
};

export const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  duration,
  currentTimeMs,
}) => {
  const letters = word.content.split('');
  const count = Math.max(1, letters.length);
  const letterDuration = duration / count;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
      {letters.map((letter, index) => (
        <AnimatedLetter
          key={`${letter}-${index}`}
          letter={letter}
          delay={word.startMillisecond + index * letterDuration}
          duration={letterDuration}
          currentTimeMs={currentTimeMs}
        />
      ))}
    </div>
  );
};

export default AnimatedWord;
