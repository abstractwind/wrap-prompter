import type { PersistedConfigV1, Rect, StandZone, TypographySettings } from '../types/teleprompter';
import { DEFAULT_SAMPLE_SCRIPT } from './scriptParser';

export const STORAGE_KEY = 'mac_wrap_teleprompter_settings_v1';
export const SAFETY_PADDING_PT = 12;

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontSize: 32,
  lineSpacing: 8,
  targetLineWidth: 760,
  speedPtPerSec: 20,
  textColor: '#F5F5F4',
  backgroundColor: '#12151C',
  backgroundOpacity: 0.94,
};

export function createDefaultGeometry(viewportW: number, viewportH: number): {
  windowRect: Rect;
  phoneZone: Rect;
  standZone: StandZone;
  markerX: number;
  markerY: number;
} {
  const safeW = Math.max(640, viewportW || 1280);
  const safeH = Math.max(480, viewportH || 800);

  const winW = Math.min(960, Math.max(600, safeW - 64));
  const winH = Math.min(680, Math.max(460, safeH - 120));
  const winX = Math.round((safeW - winW) / 2);
  const winY = Math.round(Math.max(64, (safeH - winH) / 2 + 12));

  // Content viewport inside floating window (44px titlebar + 40px footer bar)
  const contentH = winH - 84;
  const phoneW = 168;
  const phoneH = Math.min(276, Math.round(contentH * 0.48));
  const phoneX = Math.round((winW - phoneW) / 2);
  const phoneY = Math.round(Math.max(108, (contentH - phoneH) * 0.48));

  const standW = 46;
  const standH = Math.max(80, contentH - (phoneY + phoneH) - 12);
  const standX = Math.round(phoneX + (phoneW - standW) / 2);
  const standY = phoneY + phoneH;

  // Reading marker positioned near the top-left lens area above/beside phone
  const markerX = Math.max(28, phoneX - 48);
  const markerY = Math.max(48, phoneY - 36);

  return {
    windowRect: { x: winX, y: winY, width: winW, height: winH },
    phoneZone: { x: phoneX, y: phoneY, width: phoneW, height: phoneH },
    standZone: { enabled: false, x: standX, y: standY, width: standW, height: standH },
    markerX,
    markerY,
  };
}

export function createDefaultConfig(viewportW: number, viewportH: number): PersistedConfigV1 {
  const geom = createDefaultGeometry(viewportW, viewportH);
  return {
    version: 1,
    language: 'zh',
    rawText: DEFAULT_SAMPLE_SCRIPT,
    format: 'md',
    fileName: '环绕提词示例稿.md',
    anchorCharIndex: 0,
    readingMode: 'continuous',
    typography: { ...DEFAULT_TYPOGRAPHY },
    windowRect: geom.windowRect,
    phoneZone: geom.phoneZone,
    standZone: geom.standZone,
    readingMarker: {
      visible: true,
      orientation: 'horizontal',
      x: geom.markerX,
      y: geom.markerY,
    },
    preventSleepEnabled: false,
  };
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function mergeRect(raw: unknown, fallback: Rect): Rect {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const r = raw as Record<string, unknown>;
  return {
    x: isFiniteNumber(r.x) ? r.x : fallback.x,
    y: isFiniteNumber(r.y) ? r.y : fallback.y,
    width: isFiniteNumber(r.width) && r.width > 20 ? r.width : fallback.width,
    height: isFiniteNumber(r.height) && r.height > 20 ? r.height : fallback.height,
  };
}

export function clampWindowToViewport(
  win: Rect,
  viewportW: number,
  viewportH: number
): { windowRect: Rect; recovered: boolean } {
  const minW = 420;
  const minH = 340;
  const topInset = 58;
  const safeVW = Math.max(minW + 20, viewportW);
  const safeVH = Math.max(minH + topInset + 20, viewportH);

  let recovered = false;
  let width = Math.min(win.width, safeVW - 16);
  let height = Math.min(win.height, safeVH - topInset - 16);
  if (width < minW) {
    width = Math.min(minW, safeVW - 16);
    recovered = true;
  }
  if (height < minH) {
    height = Math.min(minH, safeVH - topInset - 16);
    recovered = true;
  }

  let x = win.x;
  let y = win.y;

  // Check if window drifted off screen or became unreachable
  if (x + width < 120 || x > safeVW - 120 || y < topInset - 8 || y > safeVH - 120) {
    x = Math.round((safeVW - width) / 2);
    y = Math.round(topInset + (safeVH - topInset - height) / 2);
    recovered = true;
  } else {
    x = Math.max(8, Math.min(x, safeVW - width - 8));
    y = Math.max(topInset, Math.min(y, safeVH - height - 8));
  }

  return {
    windowRect: { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) },
    recovered,
  };
}

export function loadPersistedConfig(viewportW: number, viewportH: number): {
  config: PersistedConfigV1;
  viewportRecovered: boolean;
} {
  const defaults = createDefaultConfig(viewportW, viewportH);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { config: defaults, viewportRecovered: false };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return { config: defaults, viewportRecovered: false };
    }

    const rawTypo = (parsed.typography && typeof parsed.typography === 'object'
      ? parsed.typography
      : {}) as Record<string, unknown>;

    const typography: TypographySettings = {
      fontSize: isFiniteNumber(rawTypo.fontSize)
        ? Math.max(16, Math.min(80, rawTypo.fontSize))
        : defaults.typography.fontSize,
      lineSpacing: isFiniteNumber(rawTypo.lineSpacing)
        ? Math.max(0, Math.min(48, rawTypo.lineSpacing))
        : defaults.typography.lineSpacing,
      targetLineWidth: isFiniteNumber(rawTypo.targetLineWidth)
        ? Math.max(240, Math.min(1400, rawTypo.targetLineWidth))
        : defaults.typography.targetLineWidth,
      speedPtPerSec: isFiniteNumber(rawTypo.speedPtPerSec)
        ? Math.max(1, Math.min(120, rawTypo.speedPtPerSec))
        : defaults.typography.speedPtPerSec,
      textColor: typeof rawTypo.textColor === 'string' ? rawTypo.textColor : defaults.typography.textColor,
      backgroundColor:
        typeof rawTypo.backgroundColor === 'string'
          ? rawTypo.backgroundColor
          : defaults.typography.backgroundColor,
      backgroundOpacity: isFiniteNumber(rawTypo.backgroundOpacity)
        ? Math.max(0.35, Math.min(1, rawTypo.backgroundOpacity))
        : defaults.typography.backgroundOpacity,
    };

    const rawWin = mergeRect(parsed.windowRect, defaults.windowRect);
    const { windowRect, recovered } = clampWindowToViewport(rawWin, viewportW, viewportH);

    const phoneZone = mergeRect(parsed.phoneZone, defaults.phoneZone);
    const rawStand = (parsed.standZone && typeof parsed.standZone === 'object'
      ? parsed.standZone
      : {}) as Record<string, unknown>;
    const standZone: StandZone = {
      ...mergeRect(rawStand, defaults.standZone),
      enabled: typeof rawStand.enabled === 'boolean' ? rawStand.enabled : defaults.standZone.enabled,
    };

    const rawMarker = (parsed.readingMarker && typeof parsed.readingMarker === 'object'
      ? parsed.readingMarker
      : {}) as Record<string, unknown>;

    const readingMode =
      parsed.readingMode === 'continuous' ||
      parsed.readingMode === 'sentence' ||
      parsed.readingMode === 'paragraph'
        ? parsed.readingMode
        : defaults.readingMode;

    const format = parsed.format === 'txt' || parsed.format === 'md' ? parsed.format : defaults.format;

    const language = parsed.language === 'en' || parsed.language === 'zh' ? parsed.language : 'zh';

    const config: PersistedConfigV1 = {
      version: 1,
      language,
      rawText: typeof parsed.rawText === 'string' ? parsed.rawText : defaults.rawText,
      format,
      fileName: typeof parsed.fileName === 'string' ? parsed.fileName : defaults.fileName,
      anchorCharIndex: isFiniteNumber(parsed.anchorCharIndex)
        ? Math.max(0, Math.floor(parsed.anchorCharIndex))
        : defaults.anchorCharIndex,
      readingMode,
      typography,
      windowRect,
      phoneZone,
      standZone,
      readingMarker: {
        visible:
          typeof rawMarker.visible === 'boolean' ? rawMarker.visible : defaults.readingMarker.visible,
        orientation:
          rawMarker.orientation === 'vertical' || rawMarker.orientation === 'horizontal'
            ? rawMarker.orientation
            : defaults.readingMarker.orientation,
        x: isFiniteNumber(rawMarker.x) ? rawMarker.x : defaults.readingMarker.x,
        y: isFiniteNumber(rawMarker.y) ? rawMarker.y : defaults.readingMarker.y,
      },
      preventSleepEnabled:
        typeof parsed.preventSleepEnabled === 'boolean'
          ? parsed.preventSleepEnabled
          : defaults.preventSleepEnabled,
    };

    return { config, viewportRecovered: recovered };
  } catch {
    return { config: defaults, viewportRecovered: false };
  }
}

export function savePersistedConfig(config: PersistedConfigV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
