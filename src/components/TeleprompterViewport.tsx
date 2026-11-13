import React, { useRef } from 'react';
import type {
  LayoutComputation,
  LayoutSpan,
  ReadingMarker,
  ReadingMode,
  Rect,
  StandZone,
  TypographySettings,
} from '../types/teleprompter';
import { SAFETY_PADDING_PT } from '../utils/defaults';
import { getPaddedExclusionRects } from '../utils/wrapLayoutEngine';

interface TeleprompterViewportProps {
  viewportW: number;
  viewportH: number;
  layout: LayoutComputation;
  typography: TypographySettings;
  readingMode: ReadingMode;
  phoneZone: Rect;
  standZone: StandZone;
  readingMarker: ReadingMarker;
  isCalibrating: boolean;
  onUpdatePhoneZone: (next: Rect) => void;
  onUpdateStandZone: (next: StandZone) => void;
  onUpdateMarker: (next: ReadingMarker) => void;
  onWheelScroll: (deltaY: number) => void;
  onClickChar?: (charIndex: number) => void;
}

type DragTarget =
  | { type: 'phone-move'; startX: number; startY: number; orig: Rect }
  | {
      type: 'phone-resize';
      handle: string;
      startX: number;
      startY: number;
      orig: Rect;
    }
  | { type: 'stand-move'; startX: number; startY: number; orig: StandZone }
  | {
      type: 'stand-resize';
      handle: string;
      startX: number;
      startY: number;
      orig: StandZone;
    }
  | { type: 'marker'; startX: number; startY: number; orig: ReadingMarker };

function computeSafeMarkerBeamSegments(
  marker: ReadingMarker,
  textLeft: number,
  textRight: number,
  viewportH: number,
  exclusionRects: Rect[]
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  if (marker.orientation === 'horizontal') {
    let intervals: Array<[number, number]> = [[textLeft, textRight]];
    for (const r of exclusionRects) {
      if (marker.y >= r.y && marker.y <= r.y + r.height) {
        const next: Array<[number, number]> = [];
        for (const [a, b] of intervals) {
          if (r.x + r.width <= a || r.x >= b) {
            next.push([a, b]);
          } else {
            if (r.x > a) next.push([a, r.x]);
            if (r.x + r.width < b) next.push([r.x + r.width, b]);
          }
        }
        intervals = next;
      }
    }
    return intervals
      .filter(([a, b]) => b - a > 12)
      .map(([a, b]) => ({ x1: a, y1: marker.y, x2: b, y2: marker.y }));
  } else {
    let intervals: Array<[number, number]> = [[12, viewportH - 12]];
    for (const r of exclusionRects) {
      if (marker.x >= r.x && marker.x <= r.x + r.width) {
        const next: Array<[number, number]> = [];
        for (const [a, b] of intervals) {
          if (r.y + r.height <= a || r.y >= b) {
            next.push([a, b]);
          } else {
            if (r.y > a) next.push([a, r.y]);
            if (r.y + r.height < b) next.push([r.y + r.height, b]);
          }
        }
        intervals = next;
      }
    }
    return intervals
      .filter(([a, b]) => b - a > 12)
      .map(([a, b]) => ({ x1: marker.x, y1: a, x2: marker.x, y2: b }));
  }
}

export const TeleprompterViewport: React.FC<TeleprompterViewportProps> = ({
  viewportW,
  viewportH,
  layout,
  typography,
  readingMode,
  phoneZone,
  standZone,
  readingMarker,
  isCalibrating,
  onUpdatePhoneZone,
  onUpdateStandZone,
  onUpdateMarker,
  onWheelScroll,
  onClickChar,
}) => {
  const dragRef = useRef<DragTarget | null>(null);

  const startPointerDrag = (e: React.PointerEvent, target: DragTarget) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = target;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.type === 'phone-move') {
      const nextX = Math.max(8, Math.min(viewportW - drag.orig.width - 8, drag.orig.x + dx));
      const nextY = Math.max(8, Math.min(viewportH - drag.orig.height - 8, drag.orig.y + dy));
      onUpdatePhoneZone({ ...drag.orig, x: Math.round(nextX), y: Math.round(nextY) });
    } else if (drag.type === 'phone-resize') {
      let { x, y, width, height } = drag.orig;
      const minW = 72;
      const minH = 96;
      if (drag.handle.includes('e')) {
        width = Math.max(minW, Math.min(viewportW - x - 8, drag.orig.width + dx));
      }
      if (drag.handle.includes('s')) {
        height = Math.max(minH, Math.min(viewportH - y - 8, drag.orig.height + dy));
      }
      if (drag.handle.includes('w')) {
        const newX = Math.max(8, Math.min(drag.orig.x + drag.orig.width - minW, drag.orig.x + dx));
        width = drag.orig.width + (drag.orig.x - newX);
        x = newX;
      }
      if (drag.handle.includes('n')) {
        const newY = Math.max(8, Math.min(drag.orig.y + drag.orig.height - minH, drag.orig.y + dy));
        height = drag.orig.height + (drag.orig.y - newY);
        y = newY;
      }
      onUpdatePhoneZone({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    } else if (drag.type === 'stand-move') {
      const nextX = Math.max(8, Math.min(viewportW - drag.orig.width - 8, drag.orig.x + dx));
      const nextY = Math.max(8, Math.min(viewportH - drag.orig.height - 8, drag.orig.y + dy));
      onUpdateStandZone({ ...drag.orig, x: Math.round(nextX), y: Math.round(nextY) });
    } else if (drag.type === 'stand-resize') {
      let { x, y, width, height } = drag.orig;
      const minW = 24;
      const minH = 36;
      if (drag.handle.includes('e')) {
        width = Math.max(minW, Math.min(viewportW - x - 8, drag.orig.width + dx));
      }
      if (drag.handle.includes('s')) {
        height = Math.max(minH, Math.min(viewportH - y - 8, drag.orig.height + dy));
      }
      if (drag.handle.includes('w')) {
        const newX = Math.max(8, Math.min(drag.orig.x + drag.orig.width - minW, drag.orig.x + dx));
        width = drag.orig.width + (drag.orig.x - newX);
        x = newX;
      }
      if (drag.handle.includes('n')) {
        const newY = Math.max(8, Math.min(drag.orig.y + drag.orig.height - minH, drag.orig.y + dy));
        height = drag.orig.height + (drag.orig.y - newY);
        y = newY;
      }
      onUpdateStandZone({
        ...drag.orig,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    } else if (drag.type === 'marker') {
      onUpdateMarker({
        ...drag.orig,
        x: Math.round(drag.orig.x + dx),
        y: Math.round(drag.orig.y + dy),
      });
    }
  };

  const endPointerDrag = () => {
    dragRef.current = null;
  };

  const isCharActive = (sentenceIdx: number, paragraphIdx: number): boolean => {
    if (readingMode === 'paragraph') {
      return paragraphIdx === layout.activeParagraphIndex;
    }
    return sentenceIdx === layout.activeSentenceIndex;
  };

  // Group contiguous active chars inside a span to draw clean highlight pills without changing typography
  const renderSpanContent = (span: LayoutSpan, lineFontSize: number) => {
    const highlightRuns: Array<{ left: number; width: number }> = [];
    let runStart: number | null = null;
    let runWidth = 0;

    for (let i = 0; i < span.chars.length; i++) {
      const ch = span.chars[i];
      const active = isCharActive(ch.sentenceIndex, ch.paragraphIndex);
      if (active) {
        if (runStart === null) {
          runStart = span.charXs[i];
          runWidth = span.charWidths[i];
        } else {
          runWidth += span.charWidths[i];
        }
      } else if (runStart !== null) {
        highlightRuns.push({ left: runStart, width: runWidth });
        runStart = null;
        runWidth = 0;
      }
    }
    if (runStart !== null) {
      highlightRuns.push({ left: runStart, width: runWidth });
    }

    // Group contiguous styled text runs for clean DOM rendering
    const textRuns: Array<{
      text: string;
      bold: boolean;
      italic: boolean;
      active: boolean;
      left: number;
      startChar: number;
    }> = [];

    for (let i = 0; i < span.chars.length; i++) {
      const ch = span.chars[i];
      const active = isCharActive(ch.sentenceIndex, ch.paragraphIndex);
      const prev = textRuns[textRuns.length - 1];
      if (
        prev &&
        prev.bold === ch.bold &&
        prev.italic === ch.italic &&
        prev.active === active
      ) {
        prev.text += ch.char;
      } else {
        textRuns.push({
          text: ch.char,
          bold: ch.bold,
          italic: ch.italic,
          active,
          left: span.charXs[i],
          startChar: ch.charIndex,
        });
      }
    }

    return (
      <div
        key={`${span.startChar}-${span.x}`}
        className="absolute top-0 bottom-0 whitespace-pre"
        style={{
          left: `${span.x}px`,
          width: `${Math.ceil(span.width) + 2}px`,
          fontSize: `${lineFontSize}px`,
          lineHeight: 1.28,
        }}
      >
        {highlightRuns.map((hr, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="absolute -top-0.5 -bottom-0.5 rounded-[4px] bg-amber-500/20 border-b border-amber-400/45 pointer-events-none"
            style={{
              left: `${Math.max(0, hr.left - 2)}px`,
              width: `${hr.width + 4}px`,
            }}
          />
        ))}
        {textRuns.map((tr, idx) => (
          <span
            key={idx}
            onClick={(ev) => {
              if (!isCalibrating && onClickChar) {
                ev.stopPropagation();
                onClickChar(tr.startChar);
              }
            }}
            style={{
              color: tr.active ? '#FFFBEB' : typography.textColor,
              fontWeight: tr.bold ? 700 : 400,
              fontStyle: tr.italic ? 'italic' : 'normal',
              letterSpacing: '0.01em',
            }}
            className={!isCalibrating ? 'cursor-pointer' : undefined}
          >
            {tr.text}
          </span>
        ))}
      </div>
    );
  };

  const exclusionRects = getPaddedExclusionRects(phoneZone, standZone);
  const markerSegments = readingMarker.visible
    ? computeSafeMarkerBeamSegments(
        readingMarker,
        layout.textLeft,
        layout.textRight,
        viewportH,
        exclusionRects
      )
    : [];

  const visibleLines = layout.lines.filter(
    (l) => l.y + l.height >= -40 && l.y <= viewportH + 40
  );

  return (
    <div
      className="relative flex-1 overflow-hidden select-none"
      onWheel={(e) => {
        e.preventDefault();
        onWheelScroll(e.deltaY);
      }}
    >
      {/* Calibration Alignment Bounds (Line Width Guide) */}
      {isCalibrating && (
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 border-x border-dashed border-white/10 pointer-events-none"
          style={{
            left: `${layout.textLeft}px`,
            width: `${layout.effectiveLineWidth}px`,
          }}
        >
          <span className="absolute top-1.5 right-2 text-[10px] font-mono-tabular text-zinc-500">
            生效行宽 {Math.round(layout.effectiveLineWidth)}pt
          </span>
        </div>
      )}

      {/* Script Reading Layer */}
      <div className="absolute inset-0">
        {!layout.hasAnyReadableSpace ? (
          <div className="flex items-center justify-center h-full px-6 text-center">
            <p className="text-sm text-amber-300">
              当前可用阅读宽度不足两个全角字符，请放大窗口或调小禁区/字号
            </p>
          </div>
        ) : (
          visibleLines.map((line) =>
            line.isDivider ? (
              <div
                key={`div-${line.lineIndex}`}
                className="absolute h-px bg-white/20"
                style={{
                  top: `${line.y + line.baselineOffset}px`,
                  left: `${line.dividerX}px`,
                  width: `${line.dividerWidth}px`,
                }}
              />
            ) : (
              <div
                key={`line-${line.lineIndex}`}
                className="absolute left-0 right-0"
                style={{
                  top: `${line.y}px`,
                  height: `${line.height}px`,
                }}
              >
                {line.spans.map((span) => renderSpanContent(span, line.fontSize))}
              </div>
            )
          )
        )}
      </div>

      {/* Reading Marker Layer (never draws across phone exclusion zone) */}
      {readingMarker.visible && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {markerSegments.map((seg, i) => (
            <div
              key={i}
              className="absolute bg-amber-400/35"
              style={
                readingMarker.orientation === 'horizontal'
                  ? {
                      left: `${seg.x1}px`,
                      top: `${seg.y1}px`,
                      width: `${seg.x2 - seg.x1}px`,
                      height: '1px',
                    }
                  : {
                      left: `${seg.x1}px`,
                      top: `${seg.y1}px`,
                      width: '1px',
                      height: `${seg.y2 - seg.y1}px`,
                    }
              }
            />
          ))}

          {/* Interactive Reading Marker Handle */}
          <div
            onPointerDown={(e) => {
              if (!isCalibrating) return;
              startPointerDrag(e, {
                type: 'marker',
                startX: e.clientX,
                startY: e.clientY,
                orig: readingMarker,
              });
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            title={isCalibrating ? '拖动调整阅读标记位置' : '阅读参考标记'}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
              isCalibrating ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
            }`}
            style={{
              left: `${readingMarker.x}px`,
              top: `${readingMarker.y}px`,
            }}
          >
            <div
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-opacity ${
                isCalibrating
                  ? 'bg-amber-500 text-zinc-950 shadow-md ring-2 ring-amber-300/60'
                  : 'bg-amber-500/85 text-zinc-950'
              }`}
            >
              <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
                {readingMarker.orientation === 'horizontal' ? '▸ 读' : '▾ 读'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stand Exclusion Zone (Optional) */}
      {standZone.enabled && (
        <div
          className={`absolute z-10 ${
            isCalibrating ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{
            left: `${standZone.x}px`,
            top: `${standZone.y}px`,
            width: `${standZone.width}px`,
            height: `${standZone.height}px`,
          }}
        >
          {/* 12pt Safety Margin Box */}
          {isCalibrating && (
            <div
              aria-hidden="true"
              className="absolute border border-dashed border-sky-400/40 pointer-events-none"
              style={{
                inset: `-${SAFETY_PADDING_PT}px`,
              }}
            />
          )}

          {/* Stand Body */}
          <div
            onPointerDown={(e) => {
              if (!isCalibrating) return;
              startPointerDrag(e, {
                type: 'stand-move',
                startX: e.clientX,
                startY: e.clientY,
                orig: standZone,
              });
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            className={`w-full h-full flex flex-col items-center justify-center rounded-sm transition-colors ${
              isCalibrating
                ? 'bg-zinc-800/70 border border-sky-400/70 cursor-move'
                : 'bg-black/45 border border-white/[0.06]'
            }`}
          >
            {isCalibrating && (
              <span className="text-[10px] font-mono-tabular text-sky-300/90 whitespace-nowrap">
                支杆
              </span>
            )}
          </div>

          {/* Stand Resize Handles */}
          {isCalibrating &&
            (['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as const).map((h) => (
              <div
                key={h}
                onPointerDown={(e) =>
                  startPointerDrag(e, {
                    type: 'stand-resize',
                    handle: h,
                    startX: e.clientX,
                    startY: e.clientY,
                    orig: standZone,
                  })
                }
                onPointerMove={handlePointerMove}
                onPointerUp={endPointerDrag}
                onPointerCancel={endPointerDrag}
                className={`absolute w-2.5 h-2.5 bg-sky-400 rounded-xs border border-zinc-950 ${
                  h === 'n'
                    ? '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize'
                    : h === 's'
                    ? '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize'
                    : h === 'e'
                    ? '-right-1 top-1/2 -translate-y-1/2 cursor-ew-resize'
                    : h === 'w'
                    ? '-left-1 top-1/2 -translate-y-1/2 cursor-ew-resize'
                    : h === 'nw'
                    ? '-top-1 -left-1 cursor-nwse-resize'
                    : h === 'ne'
                    ? '-top-1 -right-1 cursor-nesw-resize'
                    : h === 'sw'
                    ? '-bottom-1 -left-1 cursor-nesw-resize'
                    : '-bottom-1 -right-1 cursor-nwse-resize'
                }`}
              />
            ))}
        </div>
      )}

      {/* Fixed Phone Exclusion Zone */}
      <div
        className={`absolute z-10 ${
          isCalibrating ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          left: `${phoneZone.x}px`,
          top: `${phoneZone.y}px`,
          width: `${phoneZone.width}px`,
          height: `${phoneZone.height}px`,
        }}
      >
        {/* 12pt Outer Safety Padding Visualization in Calibration Mode */}
        {isCalibrating && (
          <div
            aria-hidden="true"
            className="absolute border border-dashed border-amber-400/45 rounded-lg pointer-events-none"
            style={{
              inset: `-${SAFETY_PADDING_PT}px`,
            }}
          >
            <span className="absolute -top-4 left-0 text-[10px] font-mono-tabular text-amber-400/80 whitespace-nowrap">
              安全留白 {SAFETY_PADDING_PT}pt
            </span>
          </div>
        )}

        {/* Phone Body */}
        <div
          onPointerDown={(e) => {
            if (!isCalibrating) return;
            startPointerDrag(e, {
              type: 'phone-move',
              startX: e.clientX,
              startY: e.clientY,
              orig: phoneZone,
            });
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
          className={`w-full h-full rounded-xl flex flex-col items-center justify-between py-3 px-2 transition-colors ${
            isCalibrating
              ? 'bg-zinc-900/80 border-2 border-amber-400/80 cursor-move'
              : 'bg-black/50 border border-white/[0.07]'
          }`}
        >
          {/* Camera lens reference */}
          <div className="w-6 h-2 rounded-full bg-zinc-700/70 border border-white/10" />

          <div className="text-center">
            <p className={`text-xs font-medium ${isCalibrating ? 'text-amber-300' : 'text-zinc-500'}`}>
              手机禁区
            </p>
            {isCalibrating ? (
              <p className="mt-1 text-[11px] font-mono-tabular text-zinc-400">
                {phoneZone.width} × {phoneZone.height}
                <br />
                ({phoneZone.x}, {phoneZone.y})
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-zinc-600">视口内固定</p>
            )}
          </div>

          <div className="w-8 h-0.5 rounded-full bg-zinc-700/50" />
        </div>

        {/* Phone Resize Handles (Calibration Only) */}
        {isCalibrating &&
          (['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as const).map((h) => (
            <div
              key={h}
              onPointerDown={(e) =>
                startPointerDrag(e, {
                  type: 'phone-resize',
                  handle: h,
                  startX: e.clientX,
                  startY: e.clientY,
                  orig: phoneZone,
                })
              }
              onPointerMove={handlePointerMove}
              onPointerUp={endPointerDrag}
              onPointerCancel={endPointerDrag}
              className={`absolute w-3 h-3 bg-amber-400 rounded-xs border border-zinc-950 ${
                h === 'n'
                  ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'
                  : h === 's'
                  ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'
                  : h === 'e'
                  ? '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                  : h === 'w'
                  ? '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                  : h === 'nw'
                  ? '-top-1.5 -left-1.5 cursor-nwse-resize'
                  : h === 'ne'
                  ? '-top-1.5 -right-1.5 cursor-nesw-resize'
                  : h === 'sw'
                  ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                  : '-bottom-1.5 -right-1.5 cursor-nwse-resize'
              }`}
            />
          ))}
      </div>
    </div>
  );
};
