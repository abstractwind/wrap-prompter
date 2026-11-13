import type {
  LayoutComputation,
  LayoutLine,
  LayoutSpan,
  ParagraphUnit,
  ParsedScript,
  ReadingMarker,
  ReadingMode,
  Rect,
  RenderedChar,
  StandZone,
  TypographySettings,
} from '../types/teleprompter';
import { SAFETY_PADDING_PT } from './defaults';

// Offscreen measurement canvas for fast, zero-DOM character width calculation
let measureCtx: CanvasRenderingContext2D | null = null;
const widthCache = new Map<string, number>();

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (!measureCtx && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
}

export function getHeadingFontScale(level: 0 | 1 | 2 | 3): number {
  if (level === 1) return 1.24;
  if (level === 2) return 1.14;
  if (level === 3) return 1.07;
  return 1;
}

export function measureCharWidth(rc: RenderedChar, baseFontSize: number): number {
  const scaledSize = Math.round(baseFontSize * getHeadingFontScale(rc.headingLevel) * 10) / 10;
  const weight = rc.bold ? 700 : 400;
  const style = rc.italic ? 'italic' : 'normal';
  const key = `${style}:${weight}:${scaledSize}:${rc.char}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;

  const ctx = getMeasureContext();
  let width = scaledSize;
  if (ctx) {
    ctx.font = `${style} ${weight} ${scaledSize}px "Plus Jakarta Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    width = ctx.measureText(rc.char).width;
  } else {
    // Fallback deterministic estimate
    width = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(rc.char)
      ? scaledSize
      : scaledSize * 0.56;
  }

  if (widthCache.size > 16000) {
    widthCache.clear();
  }
  widthCache.set(key, width);
  return width;
}

export function getPaddedExclusionRects(
  phoneZone: Rect,
  standZone: StandZone,
  safetyPadding = SAFETY_PADDING_PT
): Rect[] {
  const rects: Rect[] = [
    {
      x: phoneZone.x - safetyPadding,
      y: phoneZone.y - safetyPadding,
      width: phoneZone.width + safetyPadding * 2,
      height: phoneZone.height + safetyPadding * 2,
    },
  ];
  if (standZone.enabled) {
    rects.push({
      x: standZone.x - safetyPadding,
      y: standZone.y - safetyPadding,
      width: standZone.width + safetyPadding * 2,
      height: standZone.height + safetyPadding * 2,
    });
  }
  return rects;
}

export function isPointInExclusion(x: number, y: number, exclusionRects: Rect[]): boolean {
  for (const r of exclusionRects) {
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
      return true;
    }
  }
  return false;
}

export function clampMarkerToReadableSpace(
  marker: ReadingMarker,
  viewportW: number,
  viewportH: number,
  phoneZone: Rect,
  standZone: StandZone
): ReadingMarker {
  const pad = 14;
  let x = Math.max(pad, Math.min(viewportW - pad, marker.x));
  let y = Math.max(pad, Math.min(viewportH - pad, marker.y));

  const excl = getPaddedExclusionRects(phoneZone, standZone);

  // Push marker out to nearest legal edge if inside any exclusion box
  for (let pass = 0; pass < 2; pass++) {
    for (const r of excl) {
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
        const dLeft = Math.abs(x - r.x);
        const dRight = Math.abs(r.x + r.width - x);
        const dTop = Math.abs(y - r.y);
        const dBottom = Math.abs(r.y + r.height - y);
        const minD = Math.min(dLeft, dRight, dTop, dBottom);

        if (minD === dLeft && r.x - 4 >= pad) x = r.x - 4;
        else if (minD === dRight && r.x + r.width + 4 <= viewportW - pad) x = r.x + r.width + 4;
        else if (minD === dTop && r.y - 4 >= pad) y = r.y - 4;
        else if (r.y + r.height + 4 <= viewportH - pad) y = r.y + r.height + 4;
        else if (r.x - 4 >= pad) x = r.x - 4;
        else if (r.x + r.width + 4 <= viewportW - pad) x = r.x + r.width + 4;
      }
    }
  }

  return { ...marker, x: Math.round(x), y: Math.round(y) };
}

export function computeHorizontalBounds(
  viewportW: number,
  targetLineWidth: number,
  phoneZone: Rect
): { textLeft: number; textRight: number; effectiveLineWidth: number } {
  const sideMargin = 20;
  const maxAvailable = Math.max(0, viewportW - sideMargin * 2);
  const effectiveLineWidth = Math.min(targetLineWidth, maxAvailable);

  // FR03 default: align symmetrically around phoneZone horizontal center, clamped in viewport
  const phoneCenterX = phoneZone.x + phoneZone.width / 2;
  let textLeft = phoneCenterX - effectiveLineWidth / 2;
  if (textLeft < sideMargin) {
    textLeft = sideMargin;
  }
  if (textLeft + effectiveLineWidth > viewportW - sideMargin) {
    textLeft = Math.max(sideMargin, viewportW - sideMargin - effectiveLineWidth);
  }

  return {
    textLeft,
    textRight: textLeft + effectiveLineWidth,
    effectiveLineWidth,
  };
}

export function getReadableSpansForBand(
  textLeft: number,
  textRight: number,
  yTop: number,
  yBottom: number,
  exclusionRects: Rect[],
  minReadableWidth: number
): Array<{ x: number; width: number }> {
  let intervals: Array<[number, number]> = [[textLeft, textRight]];

  for (const r of exclusionRects) {
    // Intersects vertically?
    if (yBottom > r.y && yTop < r.y + r.height) {
      const next: Array<[number, number]> = [];
      const exL = r.x;
      const exR = r.x + r.width;
      for (const [a, b] of intervals) {
        if (exR <= a || exL >= b) {
          next.push([a, b]);
        } else {
          if (exL > a) next.push([a, exL]);
          if (exR < b) next.push([exR, b]);
        }
      }
      intervals = next;
    }
  }

  return intervals
    .map(([a, b]) => ({ x: a, width: b - a }))
    .filter((s) => s.width >= minReadableWidth);
}

const NO_LINE_START_CHARS = new Set([
  '。',
  '，',
  '、',
  '；',
  '：',
  '？',
  '！',
  '”',
  '’',
  '」',
  '』',
  '）',
  '》',
  '】',
  '.',
  ',',
  ';',
  ':',
  '?',
  '!',
  ')',
  ']',
]);

function isAsciiWordChar(ch: string): boolean {
  return /^[A-Za-z0-9._'-]$/.test(ch);
}

interface ParagraphBreakInput {
  paragraph: ParagraphUnit;
  fontSize: number;
  lineSpacing: number;
  textLeft: number;
  textRight: number;
  startDocY: number;
  scrollY: number;
  viewportH: number;
  exclusionRects: Rect[];
  minReadableWidth: number;
}

export function layoutAllLines(params: {
  script: ParsedScript;
  typography: TypographySettings;
  viewportW: number;
  viewportH: number;
  phoneZone: Rect;
  standZone: StandZone;
  scrollY: number;
}): {
  lines: LayoutLine[];
  totalDocHeight: number;
  textLeft: number;
  textRight: number;
  effectiveLineWidth: number;
  hasAnyReadableSpace: boolean;
} {
  const { script, typography, viewportW, viewportH, phoneZone, standZone, scrollY } = params;
  const { fontSize, lineSpacing, targetLineWidth } = typography;
  const { textLeft, textRight, effectiveLineWidth } = computeHorizontalBounds(
    viewportW,
    targetLineWidth,
    phoneZone
  );

  const exclusionRects = getPaddedExclusionRects(phoneZone, standZone);
  const minReadableWidth = fontSize * 2; // FR03: at least 2 full-width CJK characters

  // Quick check: does viewport have any horizontal band with readable width?
  let hasAnyReadableSpace = false;
  for (let probeY = 20; probeY < viewportH - 20; probeY += Math.max(12, Math.floor(fontSize / 2))) {
    const spans = getReadableSpansForBand(
      textLeft,
      textRight,
      probeY,
      probeY + fontSize,
      exclusionRects,
      minReadableWidth
    );
    if (spans.length > 0) {
      hasAnyReadableSpace = true;
      break;
    }
  }

  const lines: LayoutLine[] = [];
  if (!hasAnyReadableSpace || effectiveLineWidth < minReadableWidth) {
    return {
      lines,
      totalDocHeight: 0,
      textLeft,
      textRight,
      effectiveLineWidth,
      hasAnyReadableSpace: false,
    };
  }

  // Top & bottom padding inside doc so first & last sentence can reach the reading marker cleanly
  const topLeadIn = Math.max(40, Math.round(viewportH * 0.25));
  let docY = topLeadIn;
  let lineIndex = 0;

  const findNextReadableBand = (currentDocY: number, bandHeight: number): {
    docY: number;
    spans: Array<{ x: number; width: number }>;
  } => {
    let testDocY = currentDocY;
    let safetySteps = 0;
    while (safetySteps < 60) {
      const vpTop = testDocY - scrollY;
      const vpBottom = vpTop + bandHeight;

      // Only apply viewport-fixed exclusion when line is near/inside the viewport
      // Above viewport (< -bandHeight): full width; Below viewport (> viewportH + bandHeight): full width
      let spans: Array<{ x: number; width: number }>;
      if (vpBottom <= 0 || vpTop >= viewportH) {
        spans = effectiveLineWidth >= minReadableWidth ? [{ x: textLeft, width: effectiveLineWidth }] : [];
      } else {
        spans = getReadableSpansForBand(
          textLeft,
          textRight,
          vpTop,
          vpBottom,
          exclusionRects,
          minReadableWidth
        );
      }

      if (spans.length > 0) {
        return { docY: testDocY, spans };
      }

      // Jump past the lowest blocking exclusion edge in viewport space
      let nextVpTop = vpTop + bandHeight * 0.5;
      for (const r of exclusionRects) {
        if (vpBottom > r.y && vpTop < r.y + r.height) {
          nextVpTop = Math.max(nextVpTop, r.y + r.height + 1);
        }
      }
      testDocY = nextVpTop + scrollY;
      safetySteps += 1;
    }

    return {
      docY: currentDocY,
      spans: [{ x: textLeft, width: effectiveLineWidth }],
    };
  };

  for (let pIdx = 0; pIdx < script.paragraphs.length; pIdx++) {
    const p = script.paragraphs[pIdx];

    if (p.isDivider) {
      const divH = Math.round(fontSize * 0.85 + lineSpacing);
      const band = findNextReadableBand(docY, divH);
      docY = band.docY;
      const firstSpan = band.spans[0];
      lines.push({
        lineIndex: lineIndex++,
        paragraphIndex: p.index,
        docY,
        y: docY - scrollY,
        height: divH,
        baselineOffset: Math.round(divH * 0.5),
        fontSize,
        isDivider: true,
        dividerWidth: Math.min(260, firstSpan.width * 0.6),
        dividerX: firstSpan.x + (firstSpan.width - Math.min(260, firstSpan.width * 0.6)) / 2,
        spans: [],
      });
      docY += divH + Math.round(lineSpacing * 0.5);
      continue;
    }

    const scale = getHeadingFontScale(p.headingLevel);
    const paraFontSize = Math.round(fontSize * scale * 10) / 10;
    const baseLineH = Math.round(paraFontSize * 1.28);
    const rowStride = baseLineH + lineSpacing;

    let cursor = 0;
    const chars = p.chars;

    while (cursor < chars.length) {
      const band = findNextReadableBand(docY, baseLineH);
      docY = band.docY;

      const rowSpans: LayoutSpan[] = [];

      for (let sIdx = 0; sIdx < band.spans.length && cursor < chars.length; sIdx++) {
        const avail = band.spans[sIdx];
        const spanChars: RenderedChar[] = [];
        const charXs: number[] = [];
        const charWidths: number[] = [];

        let usedW = 0;
        let spanStartIdx = cursor;

        while (cursor < chars.length) {
          const rc = chars[cursor];
          const cw = measureCharWidth(rc, fontSize);

          // Skip leading whitespace at the very start of a span unless it's the only char
          if (spanChars.length === 0 && rc.char === ' ' && cursor + 1 < chars.length) {
            cursor += 1;
            spanStartIdx = cursor;
            continue;
          }

          if (usedW + cw <= avail.width || spanChars.length === 0) {
            spanChars.push(rc);
            charXs.push(usedW);
            charWidths.push(cw);
            usedW += cw;
            cursor += 1;
          } else {
            // Word-wrap rollback for Latin/numeric tokens so English words & decimals (3.14) stay intact
            if (isAsciiWordChar(rc.char) && spanChars.length > 1) {
              let back = spanChars.length - 1;
              while (back > 0 && isAsciiWordChar(spanChars[back].char)) {
                back -= 1;
              }
              if (back > 0 && back < spanChars.length - 1) {
                const trimCount = spanChars.length - (back + 1);
                spanChars.splice(back + 1);
                charXs.splice(back + 1);
                const removedW = charWidths.splice(back + 1).reduce((a, b) => a + b, 0);
                usedW -= removedW;
                cursor -= trimCount;
              }
            } else if (NO_LINE_START_CHARS.has(rc.char) && spanChars.length > 2) {
              // Mild kinsoku: if next char is closing punctuation and slightly overflows (< 35% of charWidth), allow it;
              // otherwise keep as is to avoid exceeding exclusion safety padding.
            }
            break;
          }
        }

        if (spanChars.length > 0) {
          rowSpans.push({
            startChar: spanChars[0].charIndex,
            endChar: spanChars[spanChars.length - 1].charIndex,
            text: spanChars.map((c) => c.char).join(''),
            x: avail.x,
            width: usedW,
            charXs,
            charWidths,
            chars: spanChars,
          });
        } else if (cursor === spanStartIdx) {
          // Safety progress guard
          cursor += 1;
        }
      }

      if (rowSpans.length > 0) {
        lines.push({
          lineIndex: lineIndex++,
          paragraphIndex: p.index,
          docY,
          y: docY - scrollY,
          height: baseLineH,
          baselineOffset: Math.round(paraFontSize * 0.96),
          fontSize: paraFontSize,
          isDivider: false,
          dividerWidth: 0,
          dividerX: 0,
          spans: rowSpans,
        });
      }

      docY += rowStride;
    }

    // Extra paragraph gap after blank lines or headings
    if (p.isBlankAfter || p.headingLevel > 0) {
      docY += Math.round(paraFontSize * 0.45 + lineSpacing * 0.4);
    }
  }

  const bottomTrail = Math.max(120, Math.round(viewportH * 0.65));
  const totalDocHeight = docY + bottomTrail;

  return {
    lines,
    totalDocHeight,
    textLeft,
    textRight,
    effectiveLineWidth,
    hasAnyReadableSpace,
  };
}

export function findLineAndCharClosestToMarker(
  lines: LayoutLine[],
  marker: ReadingMarker,
  viewportH: number
): {
  anchorCharIndex: number;
  anchorDeltaY: number;
  activeSentenceIndex: number;
  activeParagraphIndex: number;
} {
  // Consider lines that have at least one span and intersect visible viewport
  const visibleLines = lines.filter(
    (l) => !l.isDivider && l.spans.length > 0 && l.y + l.height > 0 && l.y < viewportH
  );

  const candidatePool =
    visibleLines.length > 0
      ? visibleLines
      : lines.filter((l) => !l.isDivider && l.spans.length > 0);

  if (candidatePool.length === 0) {
    return {
      anchorCharIndex: 0,
      anchorDeltaY: 0,
      activeSentenceIndex: 0,
      activeParagraphIndex: 0,
    };
  }

  // FR06 Rule:
  // 1. Line vertically closest to marker.y (tie -> later in reading order)
  let bestLine = candidatePool[0];
  let bestVDist = Infinity;

  for (const line of candidatePool) {
    const lineCenterY = line.y + line.height / 2;
    const dist = Math.abs(lineCenterY - marker.y);
    if (dist <= bestVDist) {
      bestVDist = dist;
      bestLine = line;
    }
  }

  // 2. Across left & right spans on that line, pick glyph horizontally closest to marker.x (tie -> later)
  let bestChar: RenderedChar | null = null;
  let bestHDist = Infinity;

  for (const span of bestLine.spans) {
    for (let i = 0; i < span.chars.length; i++) {
      const cx = span.x + span.charXs[i] + span.charWidths[i] / 2;
      const hDist = Math.abs(cx - marker.x);
      if (hDist <= bestHDist) {
        bestHDist = hDist;
        bestChar = span.chars[i];
      }
    }
  }

  if (!bestChar) {
    return {
      anchorCharIndex: 0,
      anchorDeltaY: 0,
      activeSentenceIndex: 0,
      activeParagraphIndex: 0,
    };
  }

  return {
    anchorCharIndex: bestChar.charIndex,
    anchorDeltaY: bestLine.y - marker.y,
    activeSentenceIndex: bestChar.sentenceIndex,
    activeParagraphIndex: bestChar.paragraphIndex,
  };
}

export function findCharLine(lines: LayoutLine[], charIndex: number): LayoutLine | null {
  for (const line of lines) {
    if (line.isDivider) continue;
    for (const span of line.spans) {
      if (charIndex >= span.startChar && charIndex <= span.endChar) {
        return line;
      }
    }
  }
  return null;
}

export function resolveScrollYForAnchor(params: {
  script: ParsedScript;
  typography: TypographySettings;
  viewportW: number;
  viewportH: number;
  phoneZone: Rect;
  standZone: StandZone;
  markerY: number;
  targetCharIndex: number;
  desiredOffsetFromMarkerY?: number;
  initialScrollY?: number;
}): { scrollY: number; hasAnyReadableSpace: boolean } {
  const {
    script,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    markerY,
    targetCharIndex,
    desiredOffsetFromMarkerY = 0,
    initialScrollY = 0,
  } = params;

  if (script.chars.length === 0) {
    return { scrollY: 0, hasAnyReadableSpace: true };
  }

  const clampedChar = Math.max(0, Math.min(targetCharIndex, script.chars.length - 1));
  let scrollY = Math.max(0, initialScrollY);

  // Fixed-point iteration (3 passes converge to < 0.5pt even when wrapping around exclusion zone)
  for (let pass = 0; pass < 3; pass++) {
    const layout = layoutAllLines({
      script,
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      scrollY,
    });
    if (!layout.hasAnyReadableSpace) {
      return { scrollY, hasAnyReadableSpace: false };
    }
    const line = findCharLine(layout.lines, clampedChar);
    if (!line) break;

    const targetViewportY = markerY + desiredOffsetFromMarkerY;
    const nextScrollY = Math.max(0, line.docY - targetViewportY);
    if (Math.abs(nextScrollY - scrollY) < 0.5) {
      scrollY = nextScrollY;
      break;
    }
    scrollY = nextScrollY;
  }

  return { scrollY, hasAnyReadableSpace: true };
}

export function computeFullLayoutState(params: {
  script: ParsedScript;
  typography: TypographySettings;
  viewportW: number;
  viewportH: number;
  phoneZone: Rect;
  standZone: StandZone;
  marker: ReadingMarker;
  scrollY: number;
  readingMode: ReadingMode;
  activeUnitIndex: number;
}): LayoutComputation {
  const {
    script,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    marker,
    scrollY,
    readingMode,
    activeUnitIndex,
  } = params;

  const base = layoutAllLines({
    script,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    scrollY,
  });

  if (!base.hasAnyReadableSpace || base.lines.length === 0) {
    return {
      ...base,
      activeSentenceIndex: 0,
      activeParagraphIndex: 0,
      anchorCharIndex: 0,
      anchorDeltaY: 0,
      isAtEnd: false,
      unitFullyVisible: true,
      unitDisplayEndChar: 0,
    };
  }

  const picked = findLineAndCharClosestToMarker(base.lines, marker, viewportH);

  // Check if last content line has reached/passed the reading marker (FR04 end-of-script)
  const contentLines = base.lines.filter((l) => !l.isDivider && l.spans.length > 0);
  const lastLine = contentLines[contentLines.length - 1];
  const isAtEnd = lastLine ? lastLine.y <= marker.y + 4 : true;

  let activeSentenceIndex = picked.activeSentenceIndex;
  let activeParagraphIndex = picked.activeParagraphIndex;
  let unitFullyVisible = true;
  let unitDisplayEndChar = picked.anchorCharIndex;

  if (readingMode === 'sentence' && script.sentences.length > 0) {
    const sent = script.sentences[Math.max(0, Math.min(activeUnitIndex, script.sentences.length - 1))];
    activeSentenceIndex = sent.index;
    activeParagraphIndex = sent.paragraphIndex;

    // Find the last char of this sentence currently visible inside [0, viewportH - 12]
    let lastVis = sent.startChar - 1;
    for (const l of base.lines) {
      if (l.y + l.height <= viewportH - 8 && l.y >= -4) {
        for (const sp of l.spans) {
          if (sp.endChar >= sent.startChar && sp.startChar <= sent.endChar) {
            lastVis = Math.max(lastVis, Math.min(sp.endChar, sent.endChar));
          }
        }
      }
    }
    unitDisplayEndChar = Math.max(sent.startChar, lastVis);
    unitFullyVisible = lastVis >= sent.endChar;
  } else if (readingMode === 'paragraph') {
    const nonDivParas = script.paragraphs.filter((p) => !p.isDivider);
    if (nonDivParas.length > 0) {
      const para = nonDivParas[Math.max(0, Math.min(activeUnitIndex, nonDivParas.length - 1))];
      activeParagraphIndex = para.index;
      let lastVis = para.startChar - 1;
      for (const l of base.lines) {
        if (l.y + l.height <= viewportH - 8 && l.y >= -4) {
          for (const sp of l.spans) {
            if (sp.endChar >= para.startChar && sp.startChar <= para.endChar) {
              lastVis = Math.max(lastVis, Math.min(sp.endChar, para.endChar));
            }
          }
        }
      }
      unitDisplayEndChar = Math.max(para.startChar, lastVis);
      unitFullyVisible = lastVis >= para.endChar;
    }
  }

  return {
    ...base,
    activeSentenceIndex,
    activeParagraphIndex,
    anchorCharIndex: picked.anchorCharIndex,
    anchorDeltaY: picked.anchorDeltaY,
    isAtEnd,
    unitFullyVisible,
    unitDisplayEndChar,
  };
}
