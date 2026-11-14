import React from 'react';
import { Clock, Hourglass, RotateCcw } from 'lucide-react';
import type { AppLanguage, ReadingMode, Rect } from '../types/teleprompter';
import { MESSAGES } from '../utils/i18n';

export type ElapsedTimerStatus = 'idle' | 'running' | 'stopped';

interface TimerHudPanelsProps {
  language: AppLanguage;
  elapsedMs: number;
  timerStatus: ElapsedTimerStatus;
  readingMode: ReadingMode;
  estimatedSeconds: number | null;
  remainingLines: number;
  speedPtPerSec: number;
  isAtEnd: boolean;
  hasReadableSpace: boolean;
  windowRect: Rect;
  canvasW: number;
  canvasH: number;
  isFullscreen: boolean;
  onResetTimer: () => void;
}

export function formatClockDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const TimerHudPanels: React.FC<TimerHudPanelsProps> = ({
  language,
  elapsedMs,
  timerStatus,
  readingMode,
  estimatedSeconds,
  remainingLines,
  speedPtPerSec,
  isAtEnd,
  hasReadableSpace,
  windowRect,
  canvasW,
  canvasH,
  isFullscreen,
  onResetTimer,
}) => {
  const t = MESSAGES[language];

  const elapsedSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const elapsedFormatted = formatClockDuration(elapsedSeconds);

  const isContinuous = readingMode === 'continuous';
  const estFormatted =
    !isContinuous || !hasReadableSpace || estimatedSeconds === null
      ? '--:--'
      : isAtEnd || estimatedSeconds <= 0
      ? '00:00'
      : formatClockDuration(Math.ceil(estimatedSeconds));

  const leftSpace = isFullscreen ? 0 : windowRect.x;
  const rightSpace = isFullscreen ? 0 : canvasW - (windowRect.x + windowRect.width);
  const sideCardWidth = 192;
  const sideGapThreshold = sideCardWidth + 28; // >= 220px keeps clean gap beside floating window

  const leftDockedInMargin = !isFullscreen && leftSpace >= sideGapThreshold;
  const rightDockedInMargin = !isFullscreen && rightSpace >= sideGapThreshold;

  const sideTop = Math.max(20, Math.min(Math.max(20, canvasH - 148), windowRect.y + 56));

  const leftStyle: React.CSSProperties = leftDockedInMargin
    ? {
        left: `${Math.max(16, Math.round((leftSpace - sideCardWidth) / 2))}px`,
        top: `${sideTop}px`,
        width: `${sideCardWidth}px`,
      }
    : {
        left: '20px',
        bottom: '56px',
        width: '176px',
      };

  const rightStyle: React.CSSProperties = rightDockedInMargin
    ? {
        right: `${Math.max(16, Math.round((rightSpace - sideCardWidth) / 2))}px`,
        top: `${sideTop}px`,
        width: `${sideCardWidth}px`,
      }
    : {
        right: '20px',
        bottom: '56px',
        width: '176px',
      };

  const canResetTimer = elapsedMs > 0 || timerStatus !== 'idle';

  return (
    <>
      {/* Left HUD: Elapsed Recording Timer (never stops on Space pause) */}
      <aside
        aria-label={t.elapsedTimerTitle}
        style={leftStyle}
        className="absolute z-20 pointer-events-none select-none rounded-xl border border-white/12 bg-[#12161F]/90 backdrop-blur-md shadow-2xl px-3.5 py-3 transition-[left,right,top,bottom] duration-150"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock
              className={`w-3.5 h-3.5 shrink-0 ${
                timerStatus === 'running'
                  ? 'text-emerald-400'
                  : timerStatus === 'stopped'
                  ? 'text-amber-400'
                  : 'text-zinc-400'
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-300 truncate">
              {t.elapsedTimerTitle}
            </span>
          </div>

          <button
            type="button"
            disabled={!canResetTimer}
            title={t.timerResetTitle}
            onClick={(e) => {
              onResetTimer();
              e.currentTarget.blur();
            }}
            className={`pointer-events-auto inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors whitespace-nowrap ${
              canResetTimer
                ? 'border-white/12 bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white cursor-pointer'
                : 'border-white/5 bg-transparent text-zinc-600 cursor-default'
            }`}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            {t.timerResetBtn}
          </button>
        </div>

        <div
          className={`font-mono-tabular text-[28px] leading-none font-semibold tracking-tight ${
            timerStatus === 'running'
              ? 'text-emerald-300'
              : timerStatus === 'stopped'
              ? 'text-amber-300'
              : 'text-zinc-200'
          }`}
        >
          {elapsedFormatted}
        </div>

        <div className="mt-2 pt-1.5 border-t border-white/[0.07] text-[10px] leading-snug text-zinc-400">
          <div
            className={
              timerStatus === 'running'
                ? 'text-emerald-400/90 font-medium'
                : timerStatus === 'stopped'
                ? 'text-amber-300/90 font-medium'
                : 'text-zinc-400'
            }
          >
            {timerStatus === 'running'
              ? t.timerStatusRunning
              : timerStatus === 'stopped'
              ? t.timerStatusStopped
              : t.timerStatusIdle}
          </div>
          {leftDockedInMargin && (
            <div className="mt-0.5 text-zinc-500">{t.timerPauseProofHint}</div>
          )}
        </div>
      </aside>

      {/* Right HUD: Estimated Remaining Time (Continuous Scroll mode only) */}
      <aside
        aria-label={t.estimatedTimeTitle}
        style={rightStyle}
        className="absolute z-20 pointer-events-none select-none rounded-xl border border-white/12 bg-[#12161F]/90 backdrop-blur-md shadow-2xl px-3.5 py-3 transition-[left,right,top,bottom] duration-150"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hourglass
              className={`w-3.5 h-3.5 shrink-0 ${
                !isContinuous
                  ? 'text-zinc-500'
                  : isAtEnd
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-300 truncate">
              {t.estimatedTimeTitle}
            </span>
          </div>
        </div>

        <div
          className={`font-mono-tabular text-[28px] leading-none font-semibold tracking-tight ${
            !isContinuous || !hasReadableSpace
              ? 'text-zinc-500'
              : isAtEnd
              ? 'text-amber-300'
              : 'text-sky-200'
          }`}
        >
          {estFormatted}
        </div>

        <div className="mt-2 pt-1.5 border-t border-white/[0.07] text-[10px] leading-snug text-zinc-400">
          {!isContinuous ? (
            <>
              <div className="text-zinc-400 font-medium">{t.estimatedScrollOnly}</div>
              {rightDockedInMargin && (
                <div className="mt-0.5 text-zinc-500">{t.estimatedScrollOnlySub}</div>
              )}
            </>
          ) : !hasReadableSpace ? (
            <div className="text-red-300">{t.estimatedUnreadable}</div>
          ) : (
            <div className="flex items-center justify-between gap-1 font-mono-tabular">
              <span className="text-zinc-400">{t.estimatedAtSpeed(speedPtPerSec)}</span>
              <span className={isAtEnd ? 'text-amber-300 font-sans font-medium' : 'text-zinc-300'}>
                {isAtEnd ? t.estimatedAtEnd : t.estimatedRemainingLines(remainingLines)}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
