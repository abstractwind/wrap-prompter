import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  Maximize2,
  Minimize2,
  Move,
} from 'lucide-react';
import type {
  AppLanguage,
  PlaybackState,
  ReadingMode,
  Rect,
  SessionState,
} from '../types/teleprompter';
import { MESSAGES } from '../utils/i18n';

interface FloatingWindowShellProps {
  language: AppLanguage;
  windowRect: Rect;
  canvasW: number;
  canvasH: number;
  isFullscreen: boolean;
  sessionState: SessionState;
  playbackState: PlaybackState;
  readingMode: ReadingMode;
  fontSize: number;
  effectiveLineWidth: number;
  targetLineWidth: number;
  speedPtPerSec: number;
  backgroundColor: string;
  backgroundOpacity: number;
  unitIndex: number;
  totalUnits: number;
  unitFullyVisible: boolean;
  onMoveWindow: (nextX: number, nextY: number) => void;
  onResizeWindow: (nextRect: Rect, handle: string) => void;
  onCenterWindow: () => void;
  onToggleFullscreen: () => void;
  onTogglePlayPause: () => void;
  onResetToStart: () => void;
  onPrevUnit: () => void;
  onNextUnit: () => void;
  onContinueLongUnit: () => void;
  children: React.ReactNode;
}

type WinDragState =
  | { type: 'move'; startX: number; startY: number; orig: Rect }
  | { type: 'resize'; handle: string; startX: number; startY: number; orig: Rect };

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `rgba(18, 21, 28, ${alpha})`;
}

export const FloatingWindowShell: React.FC<FloatingWindowShellProps> = ({
  language,
  windowRect,
  canvasW,
  canvasH,
  isFullscreen,
  sessionState,
  playbackState,
  readingMode,
  fontSize,
  effectiveLineWidth,
  targetLineWidth,
  speedPtPerSec,
  backgroundColor,
  backgroundOpacity,
  unitIndex,
  totalUnits,
  unitFullyVisible,
  onMoveWindow,
  onResizeWindow,
  onCenterWindow,
  onToggleFullscreen,
  onTogglePlayPause,
  onResetToStart,
  onPrevUnit,
  onNextUnit,
  onContinueLongUnit,
  children,
}) => {
  const dragRef = useRef<WinDragState | null>(null);
  const t = MESSAGES[language];

  const startDrag = (e: React.PointerEvent, state: WinDragState) => {
    if (isFullscreen) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = state;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.type === 'move') {
      const nextX = Math.max(8, Math.min(canvasW - d.orig.width - 8, d.orig.x + dx));
      const nextY = Math.max(8, Math.min(canvasH - d.orig.height - 8, d.orig.y + dy));
      onMoveWindow(Math.round(nextX), Math.round(nextY));
    } else if (d.type === 'resize') {
      let { x, y, width, height } = d.orig;
      const minW = 420;
      const minH = 340;

      if (d.handle.includes('e')) {
        width = Math.max(minW, Math.min(canvasW - x - 8, d.orig.width + dx));
      }
      if (d.handle.includes('s')) {
        height = Math.max(minH, Math.min(canvasH - y - 8, d.orig.height + dy));
      }
      if (d.handle.includes('w')) {
        const newX = Math.max(8, Math.min(d.orig.x + d.orig.width - minW, d.orig.x + dx));
        width = d.orig.width + (d.orig.x - newX);
        x = newX;
      }
      if (d.handle.includes('n')) {
        const newY = Math.max(8, Math.min(d.orig.y + d.orig.height - minH, d.orig.y + dy));
        height = d.orig.height + (d.orig.y - newY);
        y = newY;
      }

      onResizeWindow(
        {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        },
        d.handle
      );
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const isPara = readingMode === 'paragraph';
  const unitLabel = t.unitLabel(isPara);
  const clampedUnitNum = totalUnits > 0 ? Math.min(totalUnits, unitIndex + 1) : 0;

  return (
    <div
      className="absolute flex flex-col rounded-xl border border-white/15 shadow-2xl overflow-hidden transition-shadow"
      style={{
        left: isFullscreen ? '8px' : `${windowRect.x}px`,
        top: isFullscreen ? '8px' : `${windowRect.y}px`,
        width: isFullscreen ? `${Math.max(420, canvasW - 16)}px` : `${windowRect.width}px`,
        height: isFullscreen ? `${Math.max(340, canvasH - 16)}px` : `${windowRect.height}px`,
        backgroundColor: hexToRgba(backgroundColor, backgroundOpacity),
      }}
    >
      {/* Window Drag Title Bar (44px) */}
      <div
        onPointerDown={(e) =>
          startDrag(e, {
            type: 'move',
            startX: e.clientX,
            startY: e.clientY,
            orig: windowRect,
          })
        }
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`h-11 shrink-0 px-3.5 border-b border-white/[0.08] bg-black/35 flex items-center justify-between gap-3 select-none ${
          isFullscreen ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Move className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-300">{t.floatingWindowTitle}</span>
          <span className="text-zinc-600">·</span>
          <span className="font-mono-tabular text-zinc-400">
            {isFullscreen ? canvasW - 16 : windowRect.width} ×{' '}
            {isFullscreen ? canvasH - 16 : windowRect.height} pt
          </span>
        </div>

        <div
          className="flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!isFullscreen && (
            <button
              type="button"
              onClick={onCenterWindow}
              className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.centerWindow}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? t.restoreWindowSize : t.fillWorkspace}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Reading & Wrap-Around Viewport */}
      {children}

      {/* Bottom Unobstructed Transport Bar (40px) */}
      <div className="h-10 shrink-0 px-3.5 border-t border-white/[0.08] bg-black/45 flex items-center justify-between gap-3 select-none z-30">
        <div className="flex items-center gap-1.5">
          {readingMode === 'continuous' ? (
            <button
              type="button"
              onClick={onTogglePlayPause}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                playbackState === 'playing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                  : 'bg-white/[0.07] hover:bg-white/[0.12] text-zinc-100 border border-white/10'
              }`}
            >
              {playbackState === 'playing' ? (
                <>
                  <Pause className="w-3 h-3" />
                  {t.pause}
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  {playbackState === 'atEnd' ? t.atEnd : t.play}
                </>
              )}
            </button>
          ) : (
            !unitFullyVisible && (
              <button
                type="button"
                onClick={onContinueLongUnit}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                <ArrowDownToLine className="w-3 h-3" />
                {readingMode === 'sentence' ? t.continueSentence : t.continueParagraph}
              </button>
            )
          )}

          <button
            type="button"
            onClick={onPrevUnit}
            title={t.prevUnitTitle(isPara)}
            className="inline-flex items-center gap-0.5 px-2 py-1 text-xs text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {t.prevUnit(isPara)}
          </button>

          <button
            type="button"
            onClick={onNextUnit}
            title={t.nextUnitTitle(isPara)}
            className="inline-flex items-center gap-0.5 px-2 py-1 text-xs text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.nextUnit(isPara)}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetToStart}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            {t.resetToStart}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-zinc-400 whitespace-nowrap">
          <span className="hidden md:inline">
            {unitLabel} {clampedUnitNum}/{totalUnits}
          </span>
          <span className="hidden md:inline text-zinc-600">·</span>
          <span>
            {t.fontSizeShort} {fontSize}pt
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            {t.lineWidthShort} {Math.round(effectiveLineWidth)}
            {effectiveLineWidth < targetLineWidth ? `/${targetLineWidth}` : ''}pt
          </span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {speedPtPerSec} {t.speedUnit}
          </span>
          {sessionState === 'active' && playbackState === 'atEnd' && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-400 font-sans font-medium">{t.atEnd}</span>
            </>
          )}
        </div>
      </div>

      {/* 8-Way Resize Handles */}
      {!isFullscreen &&
        (['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as const).map((h) => (
          <div
            key={h}
            onPointerDown={(e) =>
              startDrag(e, {
                type: 'resize',
                handle: h,
                startX: e.clientX,
                startY: e.clientY,
                orig: windowRect,
              })
            }
            onPointerMove={handleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`absolute z-40 ${
              h === 'n'
                ? 'top-0 left-3 right-3 h-1.5 cursor-ns-resize'
                : h === 's'
                ? 'bottom-0 left-3 right-3 h-1.5 cursor-ns-resize'
                : h === 'e'
                ? 'right-0 top-3 bottom-3 w-1.5 cursor-ew-resize'
                : h === 'w'
                ? 'left-0 top-3 bottom-3 w-1.5 cursor-ew-resize'
                : h === 'nw'
                ? 'top-0 left-0 w-3 h-3 cursor-nwse-resize'
                : h === 'ne'
                ? 'top-0 right-0 w-3 h-3 cursor-nesw-resize'
                : h === 'sw'
                ? 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize'
                : 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize'
            }`}
          />
        ))}
    </div>
  );
};
