import React, { useEffect, useRef, useCallback } from 'react';
import { LyricLine } from '../types';
import { computeLineWords } from '../lib/lyrics';
import { computeAnimatedLetterStyle } from './AnimatedWord';

interface LyricsViewProps {
  lyrics: LyricLine[];
  isSynced: boolean;
  activeLyricIndex: number;
  isIntroInstrumental?: boolean;
  onSeek: (time: number) => void;
  isLoading?: boolean;
  isControlsHidden?: boolean;
  onToggleControls?: () => void;
  currentTime?: number;
  isKaraokeEffect?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

interface LetterTokenInfo {
  letter: string;
  x: number;
  width: number;
  delayMs: number;
  durationMs: number;
}

interface WordTokenInfo {
  text: string;
  start: number;
  end: number;
  startX: number;
  endX: number;
  width: number;
  letters: LetterTokenInfo[];
}

interface WrappedSubLine {
  text: string;
  subIndex: number;
  totalSubLines: number;
  fullWidth: number;
  words: WordTokenInfo[];
  align?: 'left' | 'right' | 'center';
  agent?: string;
  singerName?: string;
  isMusicLine?: boolean;
  blurTier1Canvas?: HTMLCanvasElement;
  blurTier2Canvas?: HTMLCanvasElement;
  blurTier3Canvas?: HTMLCanvasElement;
  blurPadX?: number;
  blurPadTop?: number;
  blurLogicalW?: number;
  blurLogicalH?: number;
}

interface ComputedLyricLine {
  index: number;
  time: number;
  subLines: WrappedSubLine[];
  height: number;
  topOffset: number;
  charCount: number;
  align?: 'left' | 'right' | 'center';
  agent?: string;
  singerName?: string;
  artistChanged?: boolean;
}

function cleanLyricText(text: string): string {
  let cleaned = text || '';
  if (cleaned.includes('^')) {
    cleaned = cleaned.split('^')[0];
  }
  return cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const LyricsView: React.FC<LyricsViewProps> = React.memo(({
  lyrics,
  isSynced,
  activeLyricIndex,
  isIntroInstrumental = false,
  onSeek,
  isLoading,
  isControlsHidden = false,
  onToggleControls,
  currentTime = 0,
  isKaraokeEffect = false,
  audioRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State refs for animation loop
  const stateRef = useRef({
    lyrics,
    isSynced,
    activeLyricIndex,
    isIntroInstrumental,
    currentTime,
    isKaraokeEffect,
    isControlsHidden,
    // Elastic spring scroll parameters
    scrollY: 0,
    targetScrollY: 0,
    prevTargetScrollY: 0,
    scrollVelocity: 0,
    lineScrollY: [] as number[],
    lineScrollVel: [] as number[],
    currentActiveIndex: -1,
    // Elastic verse transition state
    lastTransitionTime: 0,
    // Microsecond audio clock tracking for 100% fluid, zero-lag karaoke
    lastAudioRawTime: 0,
    lastAudioSyncPerfTime: 0,
    interpolatedAudioTime: 0,
    // Per-line continuous animation factors (0.0 to 1.0) for active line scale & focus
    lineFactors: [] as number[],
    // Smooth line alpha transitions
    lineAlphas: [] as number[],
    // Smooth per-line depth-of-field blur (in px)
    lineBlurs: [] as number[],
    // User touch interaction
    isUserDragging: false,
    userScrollTimeout: null as NodeJS.Timeout | null,
    dragStartY: 0,
    dragStartScrollY: 0,
    hasMovedDuringDrag: false,
    // Layout and metrics
    computedLines: [] as ComputedLyricLine[],
    width: 0,
    height: 0,
    baseFontSize: 36,
    lineHeight: 48,
    textX: 36,
    needsLayoutRecompute: true,
  });

  // Keep stateRef in sync with props without causing unnecessary effect runs
  stateRef.current.lyrics = lyrics;
  stateRef.current.isSynced = isSynced;
  stateRef.current.activeLyricIndex = activeLyricIndex;
  stateRef.current.isIntroInstrumental = isIntroInstrumental;
  stateRef.current.currentTime = currentTime;
  stateRef.current.isKaraokeEffect = isKaraokeEffect;
  stateRef.current.isControlsHidden = isControlsHidden;

  useEffect(() => {
    stateRef.current.needsLayoutRecompute = true;
    stateRef.current.currentActiveIndex = -1;
    stateRef.current.scrollY = 0;
    stateRef.current.targetScrollY = 0;
    stateRef.current.prevTargetScrollY = 0;
    stateRef.current.scrollVelocity = 0;
    stateRef.current.lineScrollY = [];
    stateRef.current.lineScrollVel = [];
    stateRef.current.lineBlurs = [];
    stateRef.current.lastTransitionTime = 0;
    stateRef.current.lastAudioRawTime = 0;
    stateRef.current.lastAudioSyncPerfTime = 0;
    stateRef.current.interpolatedAudioTime = 0;
  }, [lyrics]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    const sfProBoldFont = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      stateRef.current.width = width;
      stateRef.current.height = height;

      // Apple Music iOS reference typography & sizing
      const isMobile = width < 640;
      const baseFontSize = isMobile
        ? Math.round(Math.min(33, Math.max(29, width * 0.08)))
        : width < 1024
          ? 36
          : 40;
      stateRef.current.baseFontSize = baseFontSize;
      stateRef.current.lineHeight = Math.round(baseFontSize * 1.22);
      const maxTextWidth = Math.min(width - (isMobile ? 56 : 80), 720);
      stateRef.current.textX = isMobile ? 28 : Math.max(36, (width - maxTextWidth) / 2);

      stateRef.current.needsLayoutRecompute = true;
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);
    updateSize();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        updateSize();
      });
    }

    // Fast, cached line layout computation
    const recomputeLayout = () => {
      const state = stateRef.current;
      const { width, lyrics, baseFontSize, lineHeight } = state;
      if (width === 0 || !lyrics || lyrics.length === 0) {
        state.computedLines = [];
        state.lineAlphas = [];
        state.lineFactors = [];
        state.lineScrollY = [];
        state.lineScrollVel = [];
        state.lineBlurs = [];
        state.needsLayoutRecompute = false;
        return;
      }

      const isMobile = width < 640;
      const maxTextWidth = Math.min(width - (isMobile ? 56 : 80), 720);
      const lineSpacing = isMobile ? 28 : 34;
      const hasDuetLines = lyrics.some((l) => l.align === 'right' || (l.agent && l.agent !== 'v1'));
      // In duet songs, wrap each singer's lines leaving distinct breathing room on the opposite side
      const lineWrapLimit = hasDuetLines
        ? (isMobile ? Math.min(maxTextWidth * 0.85, 460) : Math.min(maxTextWidth * 0.78, 580))
        : maxTextWidth;

      ctx.save();
      ctx.font = `700 ${baseFontSize}px ${sfProBoldFont}`;

      const computed: ComputedLyricLine[] = [];
      const topPadding = isMobile ? 36 : 48;
      let currentOffset = topPadding;

      // Prepend an intro music line if the song has an instrumental intro before the first sung verse
      const firstLineTime = lyrics[0]?.time ?? 0;
      if (isSynced && (firstLineTime > 1.6 || isIntroInstrumental)) {
        const lineTotalHeight = lineHeight;
        computed.push({
          index: 0,
          time: 0,
          subLines: [{
            text: '♪',
            subIndex: 0,
            totalSubLines: 1,
            fullWidth: 100,
            words: [],
            isMusicLine: true,
          }],
          height: lineTotalHeight,
          topOffset: currentOffset,
          charCount: 1,
        });
        currentOffset += lineTotalHeight + lineSpacing;
      }

      for (let i = 0; i < lyrics.length; i++) {
        const item = lyrics[i];
        const rawText = cleanLyricText(item.text);
        const isMusic = rawText === '♪' || rawText === '♫' || item.text === '♪' || item.text === '♫';

        if (!rawText && !isMusic) {
          continue;
        }

        if (isMusic) {
          const lineTotalHeight = lineHeight;
          computed.push({
            index: computed.length,
            time: item.time,
            subLines: [{
              text: '♪',
              subIndex: 0,
              totalSubLines: 1,
              fullWidth: 100,
              words: [],
              isMusicLine: true,
            }],
            height: lineTotalHeight,
            topOffset: currentOffset,
            charCount: 1,
          });
          currentOffset += lineTotalHeight + lineSpacing;
          continue;
        }

        const lineStart = item.time;
        const nextLineStart = lyrics[i + 1]?.time;
        const hasNextLine = typeof nextLineStart === 'number';

        const hasExactWords = Boolean(item.words && item.words.length > 0);
        const subLines: WrappedSubLine[] = [];

        if (hasExactWords) {
          const rawTokens = item.words!.map((w, wIdx) => {
            const nextStart = item.words![wIdx + 1]?.start;
            const dur = w.end && w.end > w.start
              ? w.end - w.start
              : (nextStart && nextStart > w.start
                ? nextStart - w.start
                : (hasNextLine && nextLineStart > w.start ? Math.min(0.8, nextLineStart - w.start) : 0.5));
            return {
              content: cleanLyricText(w.text),
              start: w.start,
              duration: Math.max(0.04, dur),
              hasSpace: w.hasSpace ?? true,
            };
          });

          // Group consecutive tokens that lack trailing whitespace into cohesive words (e.g. que + das + te = quedaste)
          interface WordUnit {
            fullWordText: string;
            hasTrailingSpace: boolean;
            tokens: {
              content: string;
              start: number;
              duration: number;
            }[];
          }

          const wordUnits: WordUnit[] = [];
          let curUnit: WordUnit | null = null;

          for (let tIdx = 0; tIdx < rawTokens.length; tIdx++) {
            const tok = rawTokens[tIdx];
            if (!curUnit) {
              curUnit = {
                fullWordText: tok.content,
                hasTrailingSpace: tok.hasSpace,
                tokens: [tok],
              };
            } else {
              if (!curUnit.hasTrailingSpace) {
                curUnit.fullWordText += tok.content;
                curUnit.tokens.push(tok);
                curUnit.hasTrailingSpace = tok.hasSpace;
              } else {
                wordUnits.push(curUnit);
                curUnit = {
                  fullWordText: tok.content,
                  hasTrailingSpace: tok.hasSpace,
                  tokens: [tok],
                };
              }
            }
          }
          if (curUnit) {
            wordUnits.push(curUnit);
          }

          // Wrap cohesive word units into sublines based on maxTextWidth
          const subLinesUnits: WordUnit[][] = [];
          let curLineUnits: WordUnit[] = [];
          let curLineText = '';

          for (const unit of wordUnits) {
            const testText = curLineText ? `${curLineText} ${unit.fullWordText}` : unit.fullWordText;
            const testW = ctx.measureText(testText).width;
            if (testW > lineWrapLimit && curLineUnits.length > 0) {
              subLinesUnits.push(curLineUnits);
              curLineUnits = [unit];
              curLineText = unit.fullWordText;
            } else {
              curLineUnits.push(unit);
              curLineText = testText;
            }
          }
          if (curLineUnits.length > 0) {
            subLinesUnits.push(curLineUnits);
          }

          const spaceWidth = ctx.measureText(' ').width;
          const totalSub = subLinesUnits.length;

          for (let sIdx = 0; sIdx < totalSub; sIdx++) {
            const sUnits = subLinesUnits[sIdx];
            let curX = 0;
            const wordsInfo: WordTokenInfo[] = [];

            for (let uIdx = 0; uIdx < sUnits.length; uIdx++) {
              const unit = sUnits[uIdx];
              const unitStartX = curX;
              const fullWordW = ctx.measureText(unit.fullWordText).width;

              // Map each syllable/token and its individual letters to exact subpixel boundaries within the unified word
              let accumulatedChars = '';
              for (let tIdx = 0; tIdx < unit.tokens.length; tIdx++) {
                const tok = unit.tokens[tIdx];
                const startOffset = ctx.measureText(accumulatedChars).width;

                const rawLetters = tok.content.split('');
                const letterCount = Math.max(1, rawLetters.length);
                const wordStartMs = tok.start * 1000;
                const wordDurationMs = tok.duration * 1000;
                const stepMs = wordDurationMs / letterCount;
                // Smooth overlapping levitation window (300ms-520ms) so letters float up gently letter-by-letter
                const letterAnimDurationMs = Math.min(520, Math.max(300, stepMs * 2.2));
                const tokenLetters: LetterTokenInfo[] = [];

                for (let lIdx = 0; lIdx < rawLetters.length; lIdx++) {
                  const ch = rawLetters[lIdx];
                  accumulatedChars += ch;
                  const charEndOffset = ctx.measureText(accumulatedChars).width;
                  const chWidth = ctx.measureText(ch).width;
                  const kernedStartOffset = Math.max(0, charEndOffset - chWidth);

                  tokenLetters.push({
                    letter: ch,
                    x: unitStartX + kernedStartOffset,
                    width: chWidth,
                    delayMs: wordStartMs + lIdx * stepMs,
                    durationMs: letterAnimDurationMs,
                  });
                }

                const endOffset = tIdx === unit.tokens.length - 1
                  ? fullWordW
                  : ctx.measureText(accumulatedChars).width;

                const tokenStartX = unitStartX + startOffset;
                const tokenEndX = unitStartX + endOffset;

                wordsInfo.push({
                  text: tok.content,
                  start: tok.start,
                  end: tok.start + tok.duration,
                  startX: tokenStartX,
                  endX: tokenEndX,
                  width: tokenEndX - tokenStartX,
                  letters: tokenLetters,
                });
              }

              curX = unitStartX + fullWordW + spaceWidth;
            }

            const text = sUnits.map((u) => u.fullWordText).join(' ');
            subLines.push({
              text,
              subIndex: sIdx,
              totalSubLines: totalSub,
              fullWidth: Math.max(0, curX - spaceWidth),
              words: wordsInfo,
              align: item.align || 'left',
              agent: item.agent,
              singerName: item.singerName,
              isMusicLine: false,
            });
          }
        } else {
          // Standard Line: No exact word timestamps -> use clean line wrapping with empty words (normal animation)
          const wordsList = rawText.split(/\s+/).filter(Boolean);
          const rawSubLines: string[] = [];
          let curSub = '';

          for (const w of wordsList) {
            const testSub = curSub ? `${curSub} ${w}` : w;
            if (ctx.measureText(testSub).width > lineWrapLimit && curSub) {
              rawSubLines.push(curSub);
              curSub = w;
            } else {
              curSub = testSub;
            }
          }
          if (curSub) {
            rawSubLines.push(curSub);
          }
          if (rawSubLines.length === 0 && rawText) {
            rawSubLines.push(rawText);
          }

          const totalSub = Math.max(1, rawSubLines.length);
          for (let sIdx = 0; sIdx < totalSub; sIdx++) {
            const sText = rawSubLines[sIdx] || rawText;
            subLines.push({
              text: sText,
              subIndex: sIdx,
              totalSubLines: totalSub,
              fullWidth: ctx.measureText(sText).width,
              words: [],
              align: item.align || 'left',
              agent: item.agent,
              singerName: item.singerName,
              isMusicLine: false,
            });
          }
        }

        const lineAlign = item.align || 'left';
        const lineAgent = item.agent;
        const lineSinger = item.singerName;

        // Visual separation when artist changes (Apple Music Duet layout)
        const prevLine = computed[computed.length - 1];
        const isFirstSungLine = computed.length === 0 || (computed.length === 1 && computed[0].subLines[0]?.isMusicLine);
        const prevAlign = prevLine?.align || 'left';
        const prevAgent = prevLine?.agent;

        const isArtistChange = !isFirstSungLine && !isMusic && Boolean(
          prevLine && !prevLine.subLines[0]?.isMusicLine &&
          ((lineAgent && prevAgent && lineAgent !== prevAgent) ||
           (lineAlign !== prevAlign))
        );

        if (isArtistChange) {
          // Extra visual breathing room / gap when artist switches (Apple Music duet separation)
          currentOffset += isMobile ? 26 : 38;
        }

        const lineTotalHeight = subLines.length * lineHeight;

        computed.push({
          index: computed.length,
          time: item.time,
          subLines,
          height: lineTotalHeight,
          topOffset: currentOffset,
          charCount: rawText.length,
          align: lineAlign,
          agent: lineAgent,
          singerName: lineSinger,
          artistChanged: isArtistChange,
        });

        currentOffset += lineTotalHeight + lineSpacing;
      }

      ctx.restore();
      state.computedLines = computed;
      state.lineAlphas = [];
      state.lineFactors = new Array(computed.length).fill(0);
      state.lineScrollY = new Array(computed.length).fill(state.scrollY);
      state.lineScrollVel = new Array(computed.length).fill(0);
      state.lineBlurs = [];
      state.needsLayoutRecompute = false;
    };

    // Shared scratch canvases & 19-tap 1D Gaussian kernel for baking 3 progressive multi-layer 2D Gaussian blur tiers per subline
    const scratchSharp = document.createElement('canvas');
    const scratchHoriz = document.createElement('canvas');
    const GAUSS_RADIUS = 9;
    const GAUSS_SIGMA_K = 4.2;
    const rawGaussWeights: number[] = [];
    let rawGaussSum = 0;
    for (let k = -GAUSS_RADIUS; k <= GAUSS_RADIUS; k++) {
      const w = Math.exp(-(k * k) / (2 * GAUSS_SIGMA_K * GAUSS_SIGMA_K));
      rawGaussWeights.push(w);
      rawGaussSum += w;
    }

    const ensureSubLineBlurSprites = (subObj: WrappedSubLine, fontSize: number) => {
      if (subObj.blurTier1Canvas && subObj.blurTier2Canvas && subObj.blurTier3Canvas) return;

      const blurDpr = Math.min(window.devicePixelRatio || 1, 2);
      const padX = Math.ceil(fontSize * 0.56);
      const padTop = Math.ceil(fontSize * 1.35);
      const padBottom = Math.ceil(fontSize * 0.75);
      const logicalW = Math.max(16, Math.ceil(subObj.fullWidth) + padX * 2);
      const logicalH = padTop + padBottom;
      const physW = Math.ceil(logicalW * blurDpr);
      const physH = Math.ceil(logicalH * blurDpr);

      if (scratchSharp.width < physW) scratchSharp.width = physW;
      if (scratchSharp.height < physH) scratchSharp.height = physH;
      if (scratchHoriz.width < physW) scratchHoriz.width = physW;
      if (scratchHoriz.height < physH) scratchHoriz.height = physH;

      const sCtx = scratchSharp.getContext('2d');
      const hCtx = scratchHoriz.getContext('2d');
      if (!sCtx || !hCtx) return;

      sCtx.setTransform(1, 0, 0, 1, 0, 0);
      sCtx.clearRect(0, 0, physW, physH);
      sCtx.scale(blurDpr, blurDpr);
      sCtx.font = `700 ${fontSize}px ${sfProBoldFont}`;
      sCtx.textAlign = 'left';
      sCtx.textBaseline = 'alphabetic';
      sCtx.fillStyle = '#ffffff';
      sCtx.fillText(subObj.text, padX, padTop);

      const bakeConvolvedTier = (sigmaPx: number, energyBoost: number): HTMLCanvasElement => {
        const passGain = Math.sqrt(energyBoost) / rawGaussSum;
        const stepPhysPx = (sigmaPx / GAUSS_SIGMA_K) * blurDpr;

        // Pass 1: Horizontal 19-tap Gaussian convolution
        hCtx.setTransform(1, 0, 0, 1, 0, 0);
        hCtx.globalCompositeOperation = 'source-over';
        hCtx.clearRect(0, 0, physW, physH);
        hCtx.globalCompositeOperation = 'lighter';
        for (let idx = 0; idx < rawGaussWeights.length; idx++) {
          const k = idx - GAUSS_RADIUS;
          hCtx.globalAlpha = Math.min(1, rawGaussWeights[idx] * passGain);
          hCtx.drawImage(scratchSharp, 0, 0, physW, physH, k * stepPhysPx, 0, physW, physH);
        }

        // Pass 2: Vertical 19-tap Gaussian convolution
        const outCanvas = document.createElement('canvas');
        outCanvas.width = physW;
        outCanvas.height = physH;
        const outCtx = outCanvas.getContext('2d');
        if (outCtx) {
          outCtx.globalCompositeOperation = 'lighter';
          for (let idx = 0; idx < rawGaussWeights.length; idx++) {
            const k = idx - GAUSS_RADIUS;
            outCtx.globalAlpha = Math.min(1, rawGaussWeights[idx] * passGain);
            outCtx.drawImage(scratchHoriz, 0, 0, physW, physH, 0, k * stepPhysPx, physW, physH);
          }
        }
        return outCanvas;
      };

      // Tier 1: softly blurred (next lyric)
      subObj.blurTier1Canvas = bakeConvolvedTier(fontSize * 0.052, 1.15);
      // Tier 2: medium blur (mid-distance lyrics)
      subObj.blurTier2Canvas = bakeConvolvedTier(fontSize * 0.098, 1.25);
      // Tier 3: deep indistinct blur (further lyrics)
      subObj.blurTier3Canvas = bakeConvolvedTier(fontSize * 0.158, 1.38);
      subObj.blurPadX = padX;
      subObj.blurPadTop = padTop;
      subObj.blurLogicalW = logicalW;
      subObj.blurLogicalH = logicalH;
    };

    // Render loop running with elastic physics, verse exit hide, & fluid karaoke
    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      const {
        width,
        height,
        lyrics,
        isSynced,
        isIntroInstrumental,
        isKaraokeEffect,
        isControlsHidden,
        baseFontSize,
        lineHeight,
        textX,
      } = state;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (state.needsLayoutRecompute) {
        recomputeLayout();
      }

      ctx.clearRect(0, 0, width, height);

      if (!lyrics || lyrics.length === 0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `700 20px ${sfProBoldFont}`;
        ctx.fillText("Sin letras disponibles", width / 2, height * 0.35);
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Continuous high-precision audio clock tracking: 100% fluid, strictly monotonic, zero-lag at 60Hz/90Hz/120Hz
      let playbackTime = state.currentTime || 0;
      if (audioRef?.current) {
        const audio = audioRef.current;
        const rawTime = audio.currentTime;
        const isPlaying = !audio.paused && !audio.seeking && audio.readyState >= 2;

        if (isPlaying) {
          const rate = audio.playbackRate || 1.0;
          const isInitial = state.lastAudioSyncPerfTime === 0;
          const isUserSeek = Math.abs(rawTime - state.interpolatedAudioTime) > 0.35;

          if (isInitial || isUserSeek) {
            state.lastAudioRawTime = rawTime;
            state.lastAudioSyncPerfTime = now;
            state.interpolatedAudioTime = rawTime;
          } else {
            if (rawTime !== state.lastAudioRawTime) {
              state.lastAudioRawTime = rawTime;
              state.lastAudioSyncPerfTime = now;
            }
            const elapsed = Math.max(0, (now - state.lastAudioSyncPerfTime) / 1000);
            state.interpolatedAudioTime = state.lastAudioRawTime + elapsed * rate;
          }
          playbackTime = state.interpolatedAudioTime;
        } else {
          state.interpolatedAudioTime = rawTime;
          state.lastAudioRawTime = rawTime;
          state.lastAudioSyncPerfTime = 0;
          playbackTime = rawTime;
        }
      }

      const computedLines = state.computedLines;

      // Calculate active verse synchronized with playback (tight 20ms lead-in, reverse lookup on computedLines)
      let currentActiveIdx = -1;
      if (isSynced && computedLines.length > 0) {
        const activeCheckTime = playbackTime + 0.02;
        for (let idx = computedLines.length - 1; idx >= 0; idx--) {
          if (activeCheckTime >= computedLines[idx].time) {
            currentActiveIdx = idx;
            break;
          }
        }
      }

      // 1. Detect verse change: trigger fluid staggered wave slide for upcoming verses
      if (currentActiveIdx !== state.currentActiveIndex) {
        const prevActiveIdx = state.currentActiveIndex;
        if (prevActiveIdx >= 0 && prevActiveIdx < computedLines.length && prevActiveIdx < currentActiveIdx) {
          // Prevent the departing active verse from flashing bright white (1.0) while sliding up to the top slot
          state.lineAlphas[prevActiveIdx] = Math.min(state.lineAlphas[prevActiveIdx] ?? 0.34, 0.34);
          state.lineBlurs[prevActiveIdx] = Math.max(state.lineBlurs[prevActiveIdx] ?? 0, 1.15);
        }
        state.currentActiveIndex = currentActiveIdx;
        state.lastTransitionTime = now;

        if (!state.isUserDragging) {
          let newTargetScroll = 0;
          if (currentActiveIdx > 0 && currentActiveIdx < computedLines.length) {
            const activeLine = computedLines[currentActiveIdx];
            const isMobile = width < 640;
            const topPadding = isMobile ? 36 : 48;
            const lineSpacing = isMobile ? 24 : 32;
            // Keep the last subline of the immediately preceding verse visible in the top slot above the active verse
            const activeSlotY = topPadding + lineHeight + lineSpacing * 0.85;
            newTargetScroll = Math.max(0, activeLine.topOffset - activeSlotY);

            // Clamp within bounds
            const lastLine = computedLines[computedLines.length - 1];
            const maxScroll = lastLine ? Math.max(0, lastLine.topOffset + lastLine.height - height * 0.35) : 0;
            newTargetScroll = Math.min(maxScroll, newTargetScroll);
          } else if (currentActiveIdx === 0) {
            newTargetScroll = 0;
          }

          state.prevTargetScrollY = state.targetScrollY;
          state.targetScrollY = newTargetScroll;
        }
      }

      // 2. Compute critically damped staggered wave physics matching the reference video slide
      if (!state.isUserDragging) {
        const dist = state.targetScrollY - state.scrollY;
        if (Math.abs(dist) < 0.05 && Math.abs(state.scrollVelocity) < 0.05) {
          state.scrollY = state.targetScrollY;
          state.scrollVelocity = 0;
        } else {
          const springK = 74;
          const dampingC = 2 * Math.sqrt(springK); // Silky ~520ms Apple Music glide, zero bounce
          const accel = dist * springK - state.scrollVelocity * dampingC;
          state.scrollVelocity += accel * dt;
          state.scrollY += state.scrollVelocity * dt;
        }

        // Per-line staggered wave cascade: each line below begins sliding 46ms after the line above it
        const elapsedSinceTransition = state.lastTransitionTime > 0 ? now - state.lastTransitionTime : 9999;
        for (let i = 0; i < computedLines.length; i++) {
          const curY = state.lineScrollY[i] ?? state.scrollY;
          const curVel = state.lineScrollVel[i] ?? 0;
          const stagger = isSynced && currentActiveIdx >= 0 ? Math.max(0, Math.min(6, i - currentActiveIdx)) : 0;
          const staggerDelayMs = stagger * 46;

          const effectiveTargetY =
            elapsedSinceTransition < staggerDelayMs ? state.prevTargetScrollY : state.targetScrollY;

          const lineDist = effectiveTargetY - curY;
          if (Math.abs(lineDist) < 0.05 && Math.abs(curVel) < 0.05 && effectiveTargetY === state.targetScrollY) {
            state.lineScrollY[i] = state.targetScrollY;
            state.lineScrollVel[i] = 0;
          } else {
            const k = Math.max(56, 76 - stagger * 3.5);
            const c = 2 * Math.sqrt(k); // Strictly critically damped: silky wave peel without bounce
            const a = lineDist * k - curVel * c;
            const nextVel = curVel + a * dt;
            state.lineScrollVel[i] = nextVel;
            state.lineScrollY[i] = curY + nextVel * dt;
          }
        }
      } else {
        for (let i = 0; i < computedLines.length; i++) {
          state.lineScrollY[i] = state.scrollY;
          state.lineScrollVel[i] = 0;
        }
      }

      const scrollY = state.scrollY;

      // 3. Update active line focus factors
      for (let i = 0; i < computedLines.length; i++) {
        const isTargetActive = currentActiveIdx === i;
        const target = isTargetActive ? 1.0 : 0.0;
        const current = state.lineFactors[i] ?? 0;
        state.lineFactors[i] = current + (target - current) * (1 - Math.exp(-dt * 9.5));
      }

      const animType: string = isKaraokeEffect ? 'karaoke-fill' : 'standard';
      // Unsung words inside the ACTIVE verse: translucent white matching Apple Music iOS reference
      const ACTIVE_UNSUNG_ALPHA = 0.36;

      // 4. Update per-line alpha crossfade & progressive depth-of-field blur matching reference image:
      // - Active line (diff === 0): sharp (0px blur), alpha 1.0 (sung = 1.0, unsung = 0.36)
      // - Preceding line (diff === -1): stays visible in top slot, softly dimmed (alpha 0.24) & blurred (2.4px)
      // - Older lines (diff <= -2): fade out to 0.0
      // - Upcoming lines (diff >= 1): warm, consistent translucent white opacity hierarchy (0.34 -> 0.18) & progressive blur
      for (let i = 0; i < computedLines.length; i++) {
        let targetAlpha = 0.34;
        let targetBlur = 0.0;

        if (isSynced) {
          const diff = i - currentActiveIdx;
          if (diff === 0) {
            targetAlpha = 1.0;
            targetBlur = 0.0;
          } else if (diff === -1) {
            targetAlpha = 0.24;
            targetBlur = 1.55;
          } else if (diff < -1) {
            targetAlpha = 0.0;
            targetBlur = 2.8;
          } else if (diff === 1) {
            targetAlpha = 0.34;
            targetBlur = 1.0;
          } else if (diff === 2) {
            targetAlpha = 0.29;
            targetBlur = 1.55;
          } else if (diff === 3) {
            targetAlpha = 0.24;
            targetBlur = 2.05;
          } else if (diff === 4) {
            targetAlpha = 0.19;
            targetBlur = 2.55;
          } else if (diff === 5) {
            targetAlpha = 0.14;
            targetBlur = 2.85;
          } else {
            targetAlpha = 0.10;
            targetBlur = 3.0;
          }
        }

        const currentAlpha = state.lineAlphas[i] ?? targetAlpha;
        const fadeSpeed = i < currentActiveIdx ? 9.5 : 8.5;
        state.lineAlphas[i] = currentAlpha + (targetAlpha - currentAlpha) * (1 - Math.exp(-dt * fadeSpeed));

        const currentBlur = state.lineBlurs[i] ?? targetBlur;
        state.lineBlurs[i] = currentBlur + (targetBlur - currentBlur) * (1 - Math.exp(-dt * 8.5));
      }

      // 5. Render All Lyrics Lines with depth-of-field blur, letter levitation & horizontal sweep
      for (let i = 0; i < computedLines.length; i++) {
        const compLine = computedLines[i];
        const lineAlpha = state.lineAlphas[i] ?? 0.34;
        const lineBlur = state.lineBlurs[i] ?? 0;
        const lineFactor = state.lineFactors[i] ?? 0;

        // Skip completely faded lines
        if (lineAlpha < 0.01) {
          continue;
        }

        const effectiveScrollY = state.lineScrollY[i] ?? scrollY;
        const lineY = compLine.topOffset - effectiveScrollY;

        // Culling: skip completely off-screen lines
        if (lineY + compLine.height < -120 || lineY > height + 120) {
          continue;
        }

        const isActive = isSynced && currentActiveIdx === compLine.index;
        const currentSize = baseFontSize;
        // Smoothly transition unsung words from upcoming alpha (0.34) to active unsung alpha (0.36) as the line slides into focus
        const currentActiveUnsungAlpha = 0.34 + (ACTIVE_UNSUNG_ALPHA - 0.34) * lineFactor;

        for (let sIdx = 0; sIdx < compLine.subLines.length; sIdx++) {
          const subObj = compLine.subLines[sIdx];
          const subStr = subObj.text;
          const lineAlign = compLine.align || subObj.align || 'left';
          let subX = textX;
          if (lineAlign === 'right') {
            subX = (width - textX) - subObj.fullWidth;
          } else if (lineAlign === 'center') {
            subX = Math.round((width - subObj.fullWidth) / 2);
          }
          const subY = lineY + sIdx * lineHeight + currentSize;

          if (subObj.isMusicLine) {
            // Apple Music 3-dot instrumental pulsing wave
            const dotBaseR = width < 640 ? 6.5 : 8.5;
            const dotSpacing = width < 640 ? 22 : 28;
            const dotCenterY = subY - currentSize * 0.35;
            const dotsStartX = lineAlign === 'right' ? (width - textX) - 3 * dotSpacing : subX;

            ctx.save();
            ctx.fillStyle = '#ffffff';

            for (let d = 0; d < 3; d++) {
              const wave = 0.5 + 0.5 * Math.sin((now / 1000) * 4.2 - d * 0.55);
              const pulseR = isActive ? dotBaseR * (0.85 + 0.35 * wave) : dotBaseR;
              const alphaMultiplier = isActive ? (0.55 + 0.45 * wave) : 1.0;
              const dotAlpha = Math.max(0, Math.min(1, lineAlpha * alphaMultiplier));

              ctx.globalAlpha = dotAlpha;
              ctx.beginPath();
              ctx.arc(dotsStartX + d * dotSpacing + dotBaseR, dotCenterY, pulseR, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
            continue;
          }

          ctx.save();
          ctx.font = `700 ${currentSize}px ${sfProBoldFont}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';

          const isPast = isSynced && compLine.index < currentActiveIdx;
          const maxLiftPx = Math.round(currentSize * 0.085 * 10) / 10; // ~2.8px on mobile, ~3.4px on desktop
          const words = subObj.words;

          // Progressive multi-layer 2D Gaussian blur renderer:
          // - lineBlur = 0: sharp & clear
          // - lineBlur = 1.0 (diff = 1): softly blurred (Tier 1)
          // - lineBlur = 2.0 (diff = 3): medium blur (Tier 2)
          // - lineBlur = 3.0 (diff >= 5): deep indistinct blur (Tier 3)
          const drawSoftFocusLine = (yOffset: number, baseAlpha: number) => {
            const clampedAlpha = Math.max(0, Math.min(1, baseAlpha));
            if (lineBlur <= 0.04) {
              ctx.globalAlpha = clampedAlpha;
              ctx.fillText(subStr, subX, subY + yOffset);
              return;
            }

            ensureSubLineBlurSprites(subObj, currentSize);
            const t1C = subObj.blurTier1Canvas;
            const t2C = subObj.blurTier2Canvas;
            const t3C = subObj.blurTier3Canvas;
            const padX = subObj.blurPadX ?? 0;
            const padTop = subObj.blurPadTop ?? 0;
            const logW = subObj.blurLogicalW ?? subObj.fullWidth;
            const logH = subObj.blurLogicalH ?? currentSize * 2;
            const drawX = subX - padX;
            const drawY = subY + yOffset - padTop;

            if (!t1C || !t2C || !t3C) {
              ctx.globalAlpha = clampedAlpha;
              ctx.fillText(subStr, subX, subY + yOffset);
              return;
            }

            if (lineBlur < 1.0) {
              const t = Math.max(0, Math.min(1, lineBlur));
              const aSharp = clampedAlpha * (1 - t);
              const aT1 = clampedAlpha * t;
              if (aSharp > 0.002) {
                ctx.globalAlpha = aSharp;
                ctx.fillText(subStr, subX, subY + yOffset);
              }
              if (aT1 > 0.002) {
                ctx.globalAlpha = aT1;
                ctx.drawImage(t1C, drawX, drawY, logW, logH);
              }
            } else if (lineBlur < 2.0) {
              const u = Math.max(0, Math.min(1, lineBlur - 1.0));
              const aT1 = clampedAlpha * (1 - u);
              const aT2 = clampedAlpha * u;
              if (aT1 > 0.002) {
                ctx.globalAlpha = aT1;
                ctx.drawImage(t1C, drawX, drawY, logW, logH);
              }
              if (aT2 > 0.002) {
                ctx.globalAlpha = aT2;
                ctx.drawImage(t2C, drawX, drawY, logW, logH);
              }
            } else {
              const v = Math.max(0, Math.min(1, lineBlur - 2.0));
              const aT2 = clampedAlpha * (1 - v);
              const aT3 = clampedAlpha * v;
              if (aT2 > 0.002) {
                ctx.globalAlpha = aT2;
                ctx.drawImage(t2C, drawX, drawY, logW, logH);
              }
              if (aT3 > 0.002) {
                ctx.globalAlpha = aT3;
                ctx.drawImage(t3C, drawX, drawY, logW, logH);
              }
            }
          };

          // Fast GPU-batched letter helper for active line (zero ctx.filter / shadowBlur overhead)
          const drawActiveLettersAtOffset = (yOffset: number) => {
            if (words && words.length > 0) {
              for (let wIdx = 0; wIdx < words.length; wIdx++) {
                const letters = words[wIdx].letters;
                for (let lIdx = 0; lIdx < letters.length; lIdx++) {
                  const ltr = letters[lIdx];
                  ctx.fillText(ltr.letter, subX + ltr.x, subY + yOffset);
                }
              }
            } else {
              ctx.fillText(subStr, subX, subY + yOffset);
            }
          };

          if (isPast) {
            // Past Sung Verse: dims and softly defocuses in top slot while retaining completed levitation if it had exact words
            ctx.fillStyle = '#ffffff';
            drawSoftFocusLine(animType === 'karaoke-fill' && words && words.length > 0 ? -maxLiftPx : 0, lineAlpha);
          } else if (isActive && animType === 'karaoke-fill' && words && words.length > 0) {
            ctx.globalAlpha = 1.0;

            if (words && words.length > 0) {
              const firstWord = words[0];
              const lastWord = words[words.length - 1];
              const fullW = Math.max(1, subObj.fullWidth);
              const playbackTimeMs = playbackTime * 1000;

              if (playbackTime <= firstWord.start) {
                // Subline has not started singing yet ("las que todavía no canto"): translucent 0.50 white at baseline (0px)
                ctx.fillStyle = `rgba(255, 255, 255, ${currentActiveUnsungAlpha.toFixed(3)})`;
                drawActiveLettersAtOffset(0);
              } else if (playbackTime >= lastWord.end + 0.6) {
                // Subline and all letter levitations have completely finished: steady solid white at -maxLiftPx
                ctx.fillStyle = '#ffffff';
                drawActiveLettersAtOffset(-maxLiftPx);
              } else {
                // Subline is actively being sung (or finishing trailing letter float):
                // 1. Set continuous horizontal gradient fillStyle across the subline (1.0 sung -> 0.50 unsung)
                if (playbackTime >= lastWord.end) {
                  ctx.fillStyle = '#ffffff';
                } else {
                  let fillX = 0;
                  for (let wIdx = 0; wIdx < words.length; wIdx++) {
                    const w = words[wIdx];
                    if (playbackTime >= w.end) {
                      fillX = w.endX;
                      const nextW = words[wIdx + 1];
                      if (nextW && playbackTime < nextW.start) {
                        const gapDur = nextW.start - w.end;
                        if (gapDur > 0 && gapDur < 0.25) {
                          const gapP = (playbackTime - w.end) / gapDur;
                          fillX = w.endX + gapP * (nextW.startX - w.endX);
                        }
                        break;
                      }
                    } else if (playbackTime > w.start) {
                      const dur = Math.max(0.02, w.end - w.start);
                      const p = Math.max(0, Math.min(1, (playbackTime - w.start) / dur));
                      fillX = w.startX + p * (w.endX - w.startX);
                      break;
                    } else {
                      break;
                    }
                  }

                  const feather = 32;
                  const progressRatio = Math.max(0, Math.min(1, fillX / fullW));
                  const dimStartX = fillX + progressRatio * feather;
                  const solidEndX = dimStartX - feather;
                  const gradSpan = fullW + 2 * feather;

                  const grad = ctx.createLinearGradient(subX - feather, 0, subX + fullW + feather, 0);
                  const stopSolid = Math.max(0, Math.min(1, (solidEndX + feather) / gradSpan));
                  const stopDim = Math.max(stopSolid + 0.001, Math.min(1, (dimStartX + feather) / gradSpan));
                  const unsungColor = `rgba(255, 255, 255, ${currentActiveUnsungAlpha.toFixed(3)})`;

                  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                  grad.addColorStop(stopSolid, 'rgba(255, 255, 255, 1)');
                  grad.addColorStop(stopDim, unsungColor);
                  grad.addColorStop(1, unsungColor);

                  ctx.fillStyle = grad;
                }

                // 2. Render each letter with its smooth cosine S-curve vertical levitation (100% GPU glyph-atlas batched)
                for (let wIdx = 0; wIdx < words.length; wIdx++) {
                  const letters = words[wIdx].letters;
                  for (let lIdx = 0; lIdx < letters.length; lIdx++) {
                    const ltr = letters[lIdx];
                    const { translateY } = computeAnimatedLetterStyle(
                      playbackTimeMs,
                      ltr.delayMs,
                      ltr.durationMs,
                      maxLiftPx
                    );
                    ctx.fillText(ltr.letter, subX + ltr.x, subY + translateY);
                  }
                }
              }
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.fillText(subStr, subX, subY);
            }
          } else if (isActive) {
            // Standard Active Text: crisp solid white
            ctx.globalAlpha = Math.max(0, Math.min(1, lineAlpha));
            ctx.fillStyle = '#ffffff';
            ctx.fillText(subStr, subX, subY);
          } else {
            // Future Inactive Text ("las que faltaba por cantar"): distinct lower opacity hierarchy (0.28 -> 0.06) with soft depth-of-field
            ctx.fillStyle = '#ffffff';
            drawSoftFocusLine(0, lineAlpha);
          }

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [audioRef]);

  // Handle Touch and Wheel manual interaction
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    stateRef.current.isUserDragging = true;
    stateRef.current.scrollStartTime = 0;
    stateRef.current.dragStartY = e.touches[0].clientY;
    stateRef.current.dragStartScrollY = stateRef.current.scrollY;
    stateRef.current.hasMovedDuringDrag = false;

    if (stateRef.current.userScrollTimeout) {
      clearTimeout(stateRef.current.userScrollTimeout);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!stateRef.current.isUserDragging) return;
    const deltaY = e.touches[0].clientY - stateRef.current.dragStartY;
    if (Math.abs(deltaY) > 6) {
      stateRef.current.hasMovedDuringDrag = true;
    }
    stateRef.current.scrollY = stateRef.current.dragStartScrollY - deltaY;
  };

  const handleTouchEnd = () => {
    stateRef.current.isUserDragging = false;
    // Resume Apple Music auto-scroll tracking after 3.2s of user inactivity
    stateRef.current.userScrollTimeout = setTimeout(() => {
      stateRef.current.isUserDragging = false;
    }, 3200);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    stateRef.current.scrollStartTime = 0;
    stateRef.current.scrollY += e.deltaY * 0.8;
    stateRef.current.isUserDragging = true;

    if (stateRef.current.userScrollTimeout) {
      clearTimeout(stateRef.current.userScrollTimeout);
    }
    stateRef.current.userScrollTimeout = setTimeout(() => {
      stateRef.current.isUserDragging = false;
    }, 3200);
  };

  // Handle click on canvas: tap on a lyric line to seek, or tap empty space to toggle controls
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (stateRef.current.hasMovedDuringDrag) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const absoluteY = clickY + stateRef.current.scrollY;

    const lines = stateRef.current.computedLines;
    const clickedLine = lines.find((l) => absoluteY >= l.topOffset && absoluteY <= l.topOffset + l.height + 15);

    if (clickedLine) {
      onSeek(clickedLine.time);
    } else {
      onToggleControls?.();
    }
  }, [onSeek, onToggleControls]);

  return (
    <div
      id="lyrics-scroll-container"
      ref={containerRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative flex-1 w-full h-full overflow-hidden select-none cursor-pointer"
      style={{
        maskImage: isControlsHidden
          ? 'linear-gradient(to bottom, transparent 0%, black 5%, black 93%, transparent 100%)'
          : 'linear-gradient(to bottom, transparent 0%, black 6%, black 54%, transparent 72%)',
        WebkitMaskImage: isControlsHidden
          ? 'linear-gradient(to bottom, transparent 0%, black 5%, black 93%, transparent 100%)'
          : 'linear-gradient(to bottom, transparent 0%, black 6%, black 54%, transparent 72%)',
        transition: 'mask-image 0.25s ease, -webkit-mask-image 0.25s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/75 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/75 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/75 animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  if (
    prev.lyrics !== next.lyrics ||
    prev.isSynced !== next.isSynced ||
    prev.isLoading !== next.isLoading ||
    prev.isControlsHidden !== next.isControlsHidden ||
    prev.isKaraokeEffect !== next.isKaraokeEffect ||
    prev.isIntroInstrumental !== next.isIntroInstrumental ||
    prev.audioRef !== next.audioRef ||
    prev.onSeek !== next.onSeek ||
    prev.onToggleControls !== next.onToggleControls
  ) {
    return false;
  }
  // If audioRef is provided, internal 90Hz canvas animation loop drives playback smoothly;
  // only re-render if user scrubbed or seeked (> 0.35s jump)
  if (prev.audioRef?.current) {
    return Math.abs((prev.currentTime || 0) - (next.currentTime || 0)) < 0.35;
  }
  return prev.currentTime === next.currentTime;
});

LyricsView.displayName = 'LyricsView';
