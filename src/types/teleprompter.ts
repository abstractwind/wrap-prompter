export type AppLanguage = 'zh' | 'en';

export type ScriptFormat = 'txt' | 'md';

export type ReadingMode = 'continuous' | 'sentence' | 'paragraph';

export type SessionState = 'idle' | 'active' | 'ended';

export type PlaybackState = 'paused' | 'playing' | 'atEnd';

export type WakeLockStatus = 'off' | 'pending' | 'active' | 'failed';

export type MarkerOrientation = 'horizontal' | 'vertical';

export interface RenderedChar {
  char: string;
  charIndex: number;
  paragraphIndex: number;
  sentenceIndex: number;
  headingLevel: 0 | 1 | 2 | 3;
  bold: boolean;
  italic: boolean;
}

export interface SentenceUnit {
  index: number;
  paragraphIndex: number;
  startChar: number;
  endChar: number; // inclusive
  previewText: string;
}

export interface ParagraphUnit {
  index: number;
  startChar: number;
  endChar: number; // inclusive; -1 if decorative divider
  headingLevel: 0 | 1 | 2 | 3;
  isDivider: boolean;
  isBlankAfter: boolean;
  chars: RenderedChar[];
  previewText: string;
}

export interface ParsedScript {
  rawText: string;
  format: ScriptFormat;
  fileName: string;
  renderedText: string;
  chars: RenderedChar[];
  paragraphs: ParagraphUnit[];
  sentences: SentenceUnit[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StandZone extends Rect {
  enabled: boolean;
}

export interface ReadingMarker {
  visible: boolean;
  orientation: MarkerOrientation;
  x: number; // relative to reading viewport
  y: number; // relative to reading viewport
}

export interface TypographySettings {
  fontSize: number; // 16 - 80 pt
  lineSpacing: number; // 0 - 48 pt extra spacing
  targetLineWidth: number; // 240 - 1200 pt
  speedPtPerSec: number; // 1 - 120 pt/s
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0.35 - 1.0
}

export interface LayoutSpan {
  startChar: number;
  endChar: number; // inclusive
  text: string;
  x: number; // relative to reading viewport
  width: number;
  charXs: number[]; // x start of each character relative to span.x
  charWidths: number[];
  chars: RenderedChar[];
}

export interface LayoutLine {
  lineIndex: number;
  paragraphIndex: number;
  y: number; // relative to reading viewport (already scrolled)
  docY: number; // document Y coordinate
  height: number;
  baselineOffset: number;
  fontSize: number;
  isDivider: boolean;
  dividerWidth: number;
  dividerX: number;
  spans: LayoutSpan[];
}

export interface LayoutComputation {
  lines: LayoutLine[];
  totalDocHeight: number;
  effectiveLineWidth: number;
  textLeft: number;
  textRight: number;
  activeSentenceIndex: number;
  activeParagraphIndex: number;
  anchorCharIndex: number;
  anchorDeltaY: number; // anchor line top minus marker.y
  hasAnyReadableSpace: boolean;
  isAtEnd: boolean;
  unitFullyVisible: boolean;
  unitDisplayEndChar: number;
}

export interface PersistedConfigV1 {
  version: 1;
  language?: AppLanguage;
  rawText: string;
  format: ScriptFormat;
  fileName: string;
  anchorCharIndex: number;
  readingMode: ReadingMode;
  typography: TypographySettings;
  windowRect: Rect;
  phoneZone: Rect;
  standZone: StandZone;
  readingMarker: ReadingMarker;
  preventSleepEnabled: boolean;
}
