import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppLanguage,
  PersistedConfigV1,
  PlaybackState,
  ReadingMarker,
  ReadingMode,
  Rect,
  ScriptFormat,
  SessionState,
  StandZone,
  TypographySettings,
} from './types/teleprompter';
import {
  clampWindowToViewport,
  createDefaultConfig,
  createDefaultGeometry,
  loadPersistedConfig,
  savePersistedConfig,
} from './utils/defaults';
import { MESSAGES } from './utils/i18n';
import {
  DEFAULT_SAMPLE_SCRIPT,
  DEFAULT_SAMPLE_SCRIPT_EN,
  matchEditedAnchor,
  parseScript,
} from './utils/scriptParser';
import {
  clampMarkerToReadableSpace,
  computeFullLayoutState,
  findCharLine,
  resolveScrollYForAnchor,
} from './utils/wrapLayoutEngine';
import { useWakeLock } from './hooks/useWakeLock';
import { TopStudioBar } from './components/TopStudioBar';
import { FloatingWindowShell } from './components/FloatingWindowShell';
import { TeleprompterViewport } from './components/TeleprompterViewport';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { SettingsDrawer } from './components/SettingsDrawer';

const HEADER_HEIGHT = 52;
const WIN_CHROME_HEIGHT = 84; // 44px titlebar + 40px transport bar

function isNormalPrintableKey(e: KeyboardEvent): boolean {
  if (e.key === ' ' || e.key === 'Enter') return true;
  return e.key.length === 1;
}

export default function App() {
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? Math.max(400, window.innerHeight - HEADER_HEIGHT) : 748,
  }));

  const initialLoad = useMemo(
    () => loadPersistedConfig(canvasSize.w, canvasSize.h + HEADER_HEIGHT),
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [language, setLanguage] = useState<AppLanguage>(initialLoad.config.language ?? 'zh');
  const t = MESSAGES[language];

  const [rawText, setRawText] = useState<string>(initialLoad.config.rawText);
  const [format, setFormat] = useState<ScriptFormat>(initialLoad.config.format);
  const [fileName, setFileName] = useState<string>(initialLoad.config.fileName);
  const [readingMode, setReadingMode] = useState<ReadingMode>(initialLoad.config.readingMode);
  const [typography, setTypography] = useState<TypographySettings>(initialLoad.config.typography);
  const [windowRect, setWindowRect] = useState<Rect>(() => ({
    ...initialLoad.config.windowRect,
    y: Math.max(8, initialLoad.config.windowRect.y - HEADER_HEIGHT),
  }));
  const [phoneZone, setPhoneZone] = useState<Rect>(initialLoad.config.phoneZone);
  const [standZone, setStandZone] = useState<StandZone>(initialLoad.config.standZone);
  const [readingMarker, setReadingMarker] = useState<ReadingMarker>(
    initialLoad.config.readingMarker
  );
  const [preventSleepEnabled, setPreventSleepEnabled] = useState<boolean>(
    initialLoad.config.preventSleepEnabled
  );

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('paused');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [noticeText, setNoticeText] = useState<string | null>(
    initialLoad.viewportRecovered
      ? MESSAGES[initialLoad.config.language ?? 'zh'].noticeViewportRecovered
      : null
  );

  const script = useMemo(
    () => parseScript(rawText, format, fileName),
    [rawText, format, fileName]
  );

  const effWinW = isFullscreen ? Math.max(420, canvasSize.w - 16) : windowRect.width;
  const effWinH = isFullscreen ? Math.max(340, canvasSize.h - 16) : windowRect.height;
  const viewportW = effWinW;
  const viewportH = Math.max(180, effWinH - WIN_CHROME_HEIGHT);

  const [scrollY, setScrollY] = useState<number>(() => {
    const resolved = resolveScrollYForAnchor({
      script: parseScript(
        initialLoad.config.rawText,
        initialLoad.config.format,
        initialLoad.config.fileName
      ),
      typography: initialLoad.config.typography,
      viewportW: initialLoad.config.windowRect.width,
      viewportH: Math.max(180, initialLoad.config.windowRect.height - WIN_CHROME_HEIGHT),
      phoneZone: initialLoad.config.phoneZone,
      standZone: initialLoad.config.standZone,
      markerY: initialLoad.config.readingMarker.y,
      targetCharIndex: initialLoad.config.anchorCharIndex,
    });
    return resolved.scrollY;
  });

  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(() => {
    const s = parseScript(
      initialLoad.config.rawText,
      initialLoad.config.format,
      initialLoad.config.fileName
    );
    const ch = s.chars[Math.min(initialLoad.config.anchorCharIndex, Math.max(0, s.chars.length - 1))];
    if (!ch) return 0;
    if (initialLoad.config.readingMode === 'paragraph') {
      const nonDiv = s.paragraphs.filter((p) => !p.isDivider);
      return Math.max(0, nonDiv.findIndex((p) => p.index === ch.paragraphIndex));
    }
    return ch.sentenceIndex;
  });

  const anchorCharRef = useRef<number>(initialLoad.config.anchorCharIndex);
  const anchorDeltaYRef = useRef<number>(0);
  const noticeTimerRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);

  const showNotice = useCallback((msg: string, durationMs = 3600) => {
    setNoticeText(msg);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeText(null);
      noticeTimerRef.current = null;
    }, durationMs);
  }, []);

  // Sync HTML lang attribute with active UI language
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  // Wake Lock integration (FR10)
  const {
    wakeLockStatus,
    wakeLockError,
    simulateFailure: simulateWakeFailure,
    setSimulateFailure: setSimulateWakeFailure,
    retryWakeLock,
    verifyWakeLock,
  } = useWakeLock(preventSleepEnabled, sessionState, language);

  // Compute current layout synchronously
  const layout = useMemo(
    () =>
      computeFullLayoutState({
        script,
        typography,
        viewportW,
        viewportH,
        phoneZone,
        standZone,
        marker: readingMarker,
        scrollY,
        readingMode,
        activeUnitIndex,
      }),
    [
      script,
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      readingMarker,
      scrollY,
      readingMode,
      activeUnitIndex,
    ]
  );

  useEffect(() => {
    if (layout.hasAnyReadableSpace && layout.lines.length > 0) {
      anchorCharRef.current = layout.anchorCharIndex;
      anchorDeltaYRef.current = layout.anchorDeltaY;
    }
  }, [layout.anchorCharIndex, layout.anchorDeltaY, layout.hasAnyReadableSpace, layout.lines.length]);

  // Persist v1 configuration to localStorage
  useEffect(() => {
    const payload: PersistedConfigV1 = {
      version: 1,
      language,
      rawText,
      format,
      fileName,
      anchorCharIndex: anchorCharRef.current,
      readingMode,
      typography,
      windowRect: { ...windowRect, y: windowRect.y + HEADER_HEIGHT },
      phoneZone,
      standZone,
      readingMarker,
      preventSleepEnabled,
    };
    savePersistedConfig(payload);
  }, [
    language,
    rawText,
    format,
    fileName,
    readingMode,
    typography,
    windowRect,
    phoneZone,
    standZone,
    readingMarker,
    preventSleepEnabled,
    scrollY,
  ]);

  // Toggle Chinese <-> English UI (and swap default untouched sample script cleanly)
  const handleToggleLanguage = useCallback(() => {
    const nextLang: AppLanguage = language === 'zh' ? 'en' : 'zh';
    setLanguage(nextLang);
    setPlaybackState((p) => (p === 'playing' ? 'paused' : p));

    // Only swap script text if the user hasn't modified/replaced the default sample script
    const isUsingDefaultSample =
      rawText === DEFAULT_SAMPLE_SCRIPT || rawText === DEFAULT_SAMPLE_SCRIPT_EN;
    if (isUsingDefaultSample) {
      const nextText = nextLang === 'en' ? DEFAULT_SAMPLE_SCRIPT_EN : DEFAULT_SAMPLE_SCRIPT;
      const nextName = MESSAGES[nextLang].defaultFileName;
      const nextParsed = parseScript(nextText, 'md', nextName);
      setRawText(nextText);
      setFormat('md');
      setFileName(nextName);
      setActiveUnitIndex(0);
      anchorCharRef.current = 0;
      anchorDeltaYRef.current = 0;
      const resolved = resolveScrollYForAnchor({
        script: nextParsed,
        typography,
        viewportW,
        viewportH,
        phoneZone,
        standZone,
        markerY: readingMarker.y,
        targetCharIndex: 0,
        desiredOffsetFromMarkerY: 0,
        initialScrollY: 0,
      });
      setScrollY(resolved.scrollY);
    }
  }, [
    language,
    rawText,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    readingMarker.y,
  ]);

  // Handle browser viewport resize (FR08 / FR09)
  useEffect(() => {
    const onResize = () => {
      const nextW = window.innerWidth;
      const nextH = Math.max(400, window.innerHeight - HEADER_HEIGHT);
      setCanvasSize({ w: nextW, h: nextH });

      setWindowRect((prev) => {
        const clamped = clampWindowToViewport(
          { ...prev, y: prev.y + HEADER_HEIGHT },
          nextW,
          nextH + HEADER_HEIGHT
        );
        if (clamped.recovered) {
          showNotice(t.noticeWorkspaceResized);
          setPlaybackState('paused');
        }
        return {
          ...clamped.windowRect,
          y: Math.max(8, clamped.windowRect.y - HEADER_HEIGHT),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [showNotice, t.noticeWorkspaceResized]);

  // Pause & reset clock on window blur / background visibility loss (FR04, FR09, FR10)
  const handleFocusLossPause = useCallback(() => {
    lastFrameTsRef.current = null;
    setPlaybackState((prev) => (prev === 'playing' ? 'paused' : prev));
  }, []);

  useEffect(() => {
    const onBlur = () => handleFocusLossPause();
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFocusLossPause();
      } else if (document.visibilityState === 'visible') {
        lastFrameTsRef.current = null;
        void verifyWakeLock();
      }
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [handleFocusLossPause, verifyWakeLock]);

  // Continuous scrolling animation loop (FR04)
  useEffect(() => {
    if (
      readingMode !== 'continuous' ||
      playbackState !== 'playing' ||
      isEditorOpen ||
      isSettingsOpen
    ) {
      lastFrameTsRef.current = null;
      return;
    }

    let rafId = 0;

    const tick = (ts: number) => {
      if (lastFrameTsRef.current === null) {
        lastFrameTsRef.current = ts;
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(0.05, Math.max(0, (ts - lastFrameTsRef.current) / 1000));
      lastFrameTsRef.current = ts;

      if (dt > 0) {
        setScrollY((prevScrollY) => {
          const prevAnchor = anchorCharRef.current;
          const prevDelta = anchorDeltaYRef.current;
          const rawNextScrollY = prevScrollY + typography.speedPtPerSec * dt;

          const nextState = computeFullLayoutState({
            script,
            typography,
            viewportW,
            viewportH,
            phoneZone,
            standZone,
            marker: readingMarker,
            scrollY: rawNextScrollY,
            readingMode: 'continuous',
            activeUnitIndex: 0,
          });

          if (nextState.isAtEnd) {
            setPlaybackState('atEnd');
            return rawNextScrollY;
          }

          const anchorLine = findCharLine(nextState.lines, prevAnchor);
          if (anchorLine) {
            const expectedY = readingMarker.y + prevDelta - typography.speedPtPerSec * dt;
            const jump = anchorLine.y - expectedY;
            if (Math.abs(jump) > 3 && Math.abs(jump) < typography.fontSize * 3) {
              return Math.max(0, rawNextScrollY + jump);
            }
          }

          return rawNextScrollY;
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastFrameTsRef.current = null;
    };
  }, [
    readingMode,
    playbackState,
    isEditorOpen,
    isSettingsOpen,
    script,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    readingMarker,
  ]);

  // Reflow-safe parameter updater (FR03 + FR07)
  const applyReflowableUpdate = useCallback(
    (next: {
      typography?: TypographySettings;
      windowRect?: Rect;
      phoneZone?: Rect;
      standZone?: StandZone;
      readingMarker?: ReadingMarker;
      pauseIfPlaying?: boolean;
    }): boolean => {
      const nextTypo = next.typography ?? typography;
      const nextWin = next.windowRect ?? windowRect;
      const nextPhone = next.phoneZone ?? phoneZone;
      const nextStand = next.standZone ?? standZone;
      const nextMarkerRaw = next.readingMarker ?? readingMarker;

      const nextVpW = isFullscreen ? Math.max(420, canvasSize.w - 16) : nextWin.width;
      const nextVpH = Math.max(
        180,
        (isFullscreen ? Math.max(340, canvasSize.h - 16) : nextWin.height) - WIN_CHROME_HEIGHT
      );

      const clampedMarker = clampMarkerToReadableSpace(
        nextMarkerRaw,
        nextVpW,
        nextVpH,
        nextPhone,
        nextStand
      );

      const savedChar = anchorCharRef.current;
      const savedDelta = anchorDeltaYRef.current;

      const resolved = resolveScrollYForAnchor({
        script,
        typography: nextTypo,
        viewportW: nextVpW,
        viewportH: nextVpH,
        phoneZone: nextPhone,
        standZone: nextStand,
        markerY: clampedMarker.y,
        targetCharIndex: savedChar,
        desiredOffsetFromMarkerY: savedDelta,
        initialScrollY: scrollY,
      });

      if (!resolved.hasAnyReadableSpace) {
        showNotice(t.noticeInsufficientWidth);
        return false;
      }

      if (next.pauseIfPlaying !== false) {
        setPlaybackState((p) => (p === 'playing' ? 'paused' : p));
      }

      if (next.typography) setTypography(nextTypo);
      if (next.windowRect) setWindowRect(nextWin);
      if (next.phoneZone) setPhoneZone(nextPhone);
      if (next.standZone) setStandZone(nextStand);
      setReadingMarker(clampedMarker);
      setScrollY(resolved.scrollY);
      return true;
    },
    [
      typography,
      windowRect,
      phoneZone,
      standZone,
      readingMarker,
      isFullscreen,
      canvasSize,
      script,
      scrollY,
      showNotice,
      t.noticeInsufficientWidth,
    ]
  );

  // Jump to specific sentence or paragraph index (FR07)
  const jumpToUnit = useCallback(
    (mode: ReadingMode, nextUnitIdx: number) => {
      setPlaybackState('paused');

      let targetChar = 0;
      let clampedIdx = 0;

      if (mode === 'paragraph') {
        const nonDiv = script.paragraphs.filter((p) => !p.isDivider);
        if (nonDiv.length === 0) return;
        clampedIdx = Math.max(0, Math.min(nextUnitIdx, nonDiv.length - 1));
        targetChar = nonDiv[clampedIdx].startChar;
      } else {
        if (script.sentences.length === 0) return;
        clampedIdx = Math.max(0, Math.min(nextUnitIdx, script.sentences.length - 1));
        targetChar = script.sentences[clampedIdx].startChar;
      }

      setActiveUnitIndex(clampedIdx);
      anchorCharRef.current = targetChar;
      anchorDeltaYRef.current = 0;

      const resolved = resolveScrollYForAnchor({
        script,
        typography,
        viewportW,
        viewportH,
        phoneZone,
        standZone,
        markerY: readingMarker.y,
        targetCharIndex: targetChar,
        desiredOffsetFromMarkerY: 0,
        initialScrollY: scrollY,
      });
      setScrollY(resolved.scrollY);
    },
    [
      script,
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      readingMarker.y,
      scrollY,
    ]
  );

  // Continue long sentence / paragraph when taller than viewport (FR07)
  const handleContinueLongUnit = useCallback(() => {
    if (readingMode === 'continuous') return;
    if (layout.unitFullyVisible) {
      jumpToUnit(readingMode, activeUnitIndex + 1);
      return;
    }

    const nextFirstUnshownChar = Math.min(
      Math.max(0, script.chars.length - 1),
      layout.unitDisplayEndChar + 1
    );
    const lineHeight = Math.round(typography.fontSize * 1.28) + typography.lineSpacing;
    const resolved = resolveScrollYForAnchor({
      script,
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      markerY: readingMarker.y,
      targetCharIndex: nextFirstUnshownChar,
      desiredOffsetFromMarkerY: lineHeight,
      initialScrollY: scrollY,
    });
    setScrollY(resolved.scrollY);
  }, [
    readingMode,
    layout.unitFullyVisible,
    layout.unitDisplayEndChar,
    jumpToUnit,
    activeUnitIndex,
    script.chars.length,
    typography,
    viewportW,
    viewportH,
    phoneZone,
    standZone,
    readingMarker.y,
    scrollY,
  ]);

  const handleTogglePlayPause = useCallback(() => {
    if (readingMode !== 'continuous') return;
    if (playbackState === 'atEnd') {
      showNotice(t.noticeAtEnd);
      return;
    }
    if (sessionState !== 'active') {
      setSessionState('active');
      setIsCalibrating(false);
    }
    setPlaybackState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  }, [readingMode, playbackState, sessionState, showNotice, t.noticeAtEnd]);

  const handleResetToStart = useCallback(() => {
    setPlaybackState('paused');
    setActiveUnitIndex(0);
    anchorCharRef.current = 0;
    anchorDeltaYRef.current = 0;
    const resolved = resolveScrollYForAnchor({
      script,
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      markerY: readingMarker.y,
      targetCharIndex: 0,
      desiredOffsetFromMarkerY: 0,
      initialScrollY: 0,
    });
    setScrollY(resolved.scrollY);
  }, [script, typography, viewportW, viewportH, phoneZone, standZone, readingMarker.y]);

  const handleChangeMode = useCallback(
    (nextMode: ReadingMode) => {
      setPlaybackState('paused');
      const curChar = anchorCharRef.current;
      const rc = script.chars[Math.min(curChar, Math.max(0, script.chars.length - 1))];

      if (nextMode === 'paragraph') {
        const nonDiv = script.paragraphs.filter((p) => !p.isDivider);
        const pIdx = rc ? nonDiv.findIndex((p) => p.index === rc.paragraphIndex) : 0;
        setActiveUnitIndex(Math.max(0, pIdx));
      } else if (nextMode === 'sentence') {
        setActiveUnitIndex(rc ? rc.sentenceIndex : 0);
      }
      setReadingMode(nextMode);
    },
    [script]
  );

  // Session start/end (FR09 & FR10)
  const handleToggleSession = useCallback(() => {
    if (sessionState === 'active') {
      setPlaybackState('paused');
      setSessionState('ended');
      showNotice(t.noticeSessionEnded);
    } else {
      setSessionState('active');
      setIsCalibrating(false);
      setPlaybackState('paused');
    }
  }, [sessionState, showNotice, t.noticeSessionEnded]);

  // Keyboard Scope & Shortcuts (FR05)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditorOpen || isSettingsOpen) return;
      if (e.isComposing || e.keyCode === 229) return;
      if (e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tag = activeEl.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          activeEl.isContentEditable ||
          tag === 'BUTTON'
        ) {
          return;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (readingMode === 'continuous') {
          setPlaybackState((p) => (p === 'playing' ? 'paused' : p));
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (sessionState !== 'active') {
          setSessionState('active');
          setIsCalibrating(false);
        }
        const curIdx =
          readingMode === 'continuous'
            ? layout.activeSentenceIndex
            : activeUnitIndex;
        jumpToUnit(readingMode === 'paragraph' ? 'paragraph' : 'sentence', curIdx + 1);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (sessionState !== 'active') {
          setSessionState('active');
          setIsCalibrating(false);
        }
        const curIdx =
          readingMode === 'continuous'
            ? layout.activeSentenceIndex
            : activeUnitIndex;
        jumpToUnit(readingMode === 'paragraph' ? 'paragraph' : 'sentence', curIdx - 1);
        return;
      }

      if (readingMode === 'continuous') {
        if (isNormalPrintableKey(e)) {
          e.preventDefault();
          handleTogglePlayPause();
        }
      } else {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (sessionState !== 'active') {
            setSessionState('active');
            setIsCalibrating(false);
          }
          handleContinueLongUnit();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isEditorOpen,
    isSettingsOpen,
    readingMode,
    sessionState,
    layout.activeSentenceIndex,
    activeUnitIndex,
    jumpToUnit,
    handleTogglePlayPause,
    handleContinueLongUnit,
  ]);

  // File Import Handler (FR01)
  const handleImportFile = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.txt') && !lower.endsWith('.md')) {
        showNotice(t.noticeImportInvalidType);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showNotice(t.noticeImportTooLarge);
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const text = decoder.decode(buffer);
        if (text.trim().length === 0) {
          showNotice(t.noticeImportEmpty);
          return;
        }
        const nextFormat: ScriptFormat = lower.endsWith('.md') ? 'md' : 'txt';
        const nextScript = parseScript(text, nextFormat, file.name);

        setPlaybackState('paused');
        setRawText(text);
        setFormat(nextFormat);
        setFileName(file.name);
        setActiveUnitIndex(0);
        anchorCharRef.current = 0;
        anchorDeltaYRef.current = 0;

        const resolved = resolveScrollYForAnchor({
          script: nextScript,
          typography,
          viewportW,
          viewportH,
          phoneZone,
          standZone,
          markerY: readingMarker.y,
          targetCharIndex: 0,
          desiredOffsetFromMarkerY: 0,
          initialScrollY: 0,
        });
        setScrollY(resolved.scrollY);
        showNotice(
          sessionState === 'active'
            ? t.noticeImportSuccessActive(file.name)
            : t.noticeImportSuccessIdle(file.name)
        );
      } catch {
        showNotice(t.noticeImportBadUtf8);
      }
    },
    [
      typography,
      viewportW,
      viewportH,
      phoneZone,
      standZone,
      readingMarker.y,
      sessionState,
      showNotice,
      t,
    ]
  );

  // Window Resize anchored on Phone Screen Center (FR09)
  const handleResizeWindow = useCallback(
    (nextWin: Rect) => {
      const dx = nextWin.x - windowRect.x;
      const dy = nextWin.y - windowRect.y;

      const nextPhone: Rect = {
        ...phoneZone,
        x: phoneZone.x - dx,
        y: phoneZone.y - dy,
      };
      const nextStand: StandZone = {
        ...standZone,
        x: standZone.x - dx,
        y: standZone.y - dy,
      };
      const nextMarker: ReadingMarker = {
        ...readingMarker,
        x: readingMarker.x - dx,
        y: readingMarker.y - dy,
      };

      const nextVpH = Math.max(180, nextWin.height - WIN_CHROME_HEIGHT);

      if (
        nextPhone.x < 12 ||
        nextPhone.x + nextPhone.width > nextWin.width - 12 ||
        nextPhone.y < 12 ||
        nextPhone.y + nextPhone.height > nextVpH - 12
      ) {
        showNotice(t.noticePhoneMinMargin);
        return;
      }

      applyReflowableUpdate({
        windowRect: nextWin,
        phoneZone: nextPhone,
        standZone: nextStand,
        readingMarker: nextMarker,
      });
    },
    [
      windowRect,
      phoneZone,
      standZone,
      readingMarker,
      applyReflowableUpdate,
      showNotice,
      t.noticePhoneMinMargin,
    ]
  );

  const handleWheelScroll = useCallback(
    (deltaY: number) => {
      setPlaybackState((p) => (p === 'playing' ? 'paused' : p));
      setScrollY((prev) => {
        const maxScroll = Math.max(0, layout.totalDocHeight - viewportH * 0.5);
        return Math.max(0, Math.min(maxScroll, prev + deltaY * 0.75));
      });
    },
    [layout.totalDocHeight, viewportH]
  );

  const totalUnits =
    readingMode === 'paragraph'
      ? script.paragraphs.filter((p) => !p.isDivider).length
      : script.sentences.length;

  const displayUnitIdx =
    readingMode === 'continuous'
      ? layout.activeSentenceIndex
      : activeUnitIndex;

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#0B0D11] text-zinc-100 overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          void handleImportFile(file);
        }
      }}
    >
      <TopStudioBar
        language={language}
        fileName={fileName}
        sessionState={sessionState}
        playbackState={playbackState}
        readingMode={readingMode}
        isCalibrating={isCalibrating}
        preventSleepEnabled={preventSleepEnabled}
        wakeLockStatus={wakeLockStatus}
        wakeLockError={wakeLockError}
        onToggleLanguage={() => {
          handleToggleLanguage();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onImportFile={(f) => void handleImportFile(f)}
        onOpenEditor={() => {
          setPlaybackState('paused');
          setIsEditorOpen(true);
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onChangeMode={(m) => {
          handleChangeMode(m);
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onToggleCalibration={() => {
          setIsCalibrating((c) => !c);
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onTogglePreventSleep={() => {
          setPreventSleepEnabled((p) => !p);
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onRetryWakeLock={() => {
          retryWakeLock();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onToggleSession={() => {
          handleToggleSession();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        onOpenSettings={() => {
          setPlaybackState('paused');
          setIsSettingsOpen(true);
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      />

      {/* Simulated Mac Secondary Display Workspace */}
      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating Teleprompter Window */}
        <FloatingWindowShell
          language={language}
          windowRect={windowRect}
          canvasW={canvasSize.w}
          canvasH={canvasSize.h}
          isFullscreen={isFullscreen}
          sessionState={sessionState}
          playbackState={playbackState}
          readingMode={readingMode}
          fontSize={typography.fontSize}
          effectiveLineWidth={layout.effectiveLineWidth}
          targetLineWidth={typography.targetLineWidth}
          speedPtPerSec={typography.speedPtPerSec}
          backgroundColor={typography.backgroundColor}
          backgroundOpacity={typography.backgroundOpacity}
          unitIndex={displayUnitIdx}
          totalUnits={totalUnits}
          unitFullyVisible={layout.unitFullyVisible}
          onMoveWindow={(nx, ny) => {
            setWindowRect((prev) => ({ ...prev, x: nx, y: ny }));
          }}
          onResizeWindow={handleResizeWindow}
          onCenterWindow={() => {
            setWindowRect((prev) => ({
              ...prev,
              x: Math.round((canvasSize.w - prev.width) / 2),
              y: Math.round(Math.max(8, (canvasSize.h - prev.height) / 2)),
            }));
          }}
          onToggleFullscreen={() => {
            setPlaybackState('paused');
            setIsFullscreen((f) => !f);
          }}
          onTogglePlayPause={() => {
            handleTogglePlayPause();
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          onResetToStart={() => {
            handleResetToStart();
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          onPrevUnit={() => {
            const cur =
              readingMode === 'continuous'
                ? layout.activeSentenceIndex
                : activeUnitIndex;
            jumpToUnit(readingMode === 'paragraph' ? 'paragraph' : 'sentence', cur - 1);
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          onNextUnit={() => {
            const cur =
              readingMode === 'continuous'
                ? layout.activeSentenceIndex
                : activeUnitIndex;
            jumpToUnit(readingMode === 'paragraph' ? 'paragraph' : 'sentence', cur + 1);
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          onContinueLongUnit={() => {
            handleContinueLongUnit();
            (document.activeElement as HTMLElement | null)?.blur();
          }}
        >
          <TeleprompterViewport
            language={language}
            viewportW={viewportW}
            viewportH={viewportH}
            layout={layout}
            typography={typography}
            readingMode={readingMode}
            phoneZone={phoneZone}
            standZone={standZone}
            readingMarker={readingMarker}
            isCalibrating={isCalibrating}
            onUpdatePhoneZone={(nextPhone) => {
              applyReflowableUpdate({ phoneZone: nextPhone });
            }}
            onUpdateStandZone={(nextStand) => {
              applyReflowableUpdate({ standZone: nextStand });
            }}
            onUpdateMarker={(nextMarker) => {
              applyReflowableUpdate({ readingMarker: nextMarker });
            }}
            onWheelScroll={handleWheelScroll}
            onClickChar={(charIdx) => {
              if (readingMode !== 'continuous') {
                const rc = script.chars[charIdx];
                if (rc) {
                  const targetIdx =
                    readingMode === 'paragraph'
                      ? Math.max(
                          0,
                          script.paragraphs
                            .filter((p) => !p.isDivider)
                            .findIndex((p) => p.index === rc.paragraphIndex)
                        )
                      : rc.sentenceIndex;
                  jumpToUnit(readingMode, targetIdx);
                }
              }
            }}
          />
        </FloatingWindowShell>

        {/* File Drag-and-Drop Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="px-6 py-4 rounded-xl border border-amber-400/50 bg-[#141820] text-sm text-amber-300 font-medium">
              {t.dropFilePrompt}
            </div>
          </div>
        )}

        {/* Non-blocking System Notice Toast */}
        {noticeText && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#1A202C]/95 border border-white/15 shadow-xl text-xs text-zinc-100 pointer-events-none">
            {noticeText}
          </div>
        )}
      </main>

      <ScriptEditorModal
        language={language}
        isOpen={isEditorOpen}
        initialText={rawText}
        initialFormat={format}
        fileName={fileName}
        onCancel={() => setIsEditorOpen(false)}
        onApply={(nextText, nextFormat, nextName) => {
          const nextScript = parseScript(nextText, nextFormat, nextName);
          const match = matchEditedAnchor(script, anchorCharRef.current, nextScript);

          setPlaybackState('paused');
          setRawText(nextText);
          setFormat(nextFormat);
          setFileName(nextName);
          anchorCharRef.current = match.anchorCharIndex;
          anchorDeltaYRef.current = 0;

          const rc =
            nextScript.chars[
              Math.min(match.anchorCharIndex, Math.max(0, nextScript.chars.length - 1))
            ];
          if (rc) {
            if (readingMode === 'paragraph') {
              const nonDiv = nextScript.paragraphs.filter((p) => !p.isDivider);
              setActiveUnitIndex(
                Math.max(0, nonDiv.findIndex((p) => p.index === rc.paragraphIndex))
              );
            } else {
              setActiveUnitIndex(rc.sentenceIndex);
            }
          } else {
            setActiveUnitIndex(0);
          }

          const resolved = resolveScrollYForAnchor({
            script: nextScript,
            typography,
            viewportW,
            viewportH,
            phoneZone,
            standZone,
            markerY: readingMarker.y,
            targetCharIndex: match.anchorCharIndex,
            desiredOffsetFromMarkerY: 0,
            initialScrollY: scrollY,
          });
          setScrollY(resolved.scrollY);
          setIsEditorOpen(false);

          if (match.noticeCode === 'empty') {
            showNotice(t.noticeEditEmpty);
          } else if (match.noticeCode === 'fallbackPara') {
            showNotice(t.noticeEditFallbackPara);
          } else if (match.noticeCode === 'fallbackStart') {
            showNotice(t.noticeEditFallbackStart);
          } else {
            showNotice(t.noticeEditAppliedMatched);
          }
        }}
      />

      <SettingsDrawer
        language={language}
        isOpen={isSettingsOpen}
        typography={typography}
        effectiveLineWidth={layout.effectiveLineWidth}
        phoneZone={phoneZone}
        standZone={standZone}
        readingMarker={readingMarker}
        preventSleepEnabled={preventSleepEnabled}
        wakeLockStatus={wakeLockStatus}
        wakeLockError={wakeLockError}
        simulateWakeFailure={simulateWakeFailure}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateTypography={(patch) => {
          if (
            patch.fontSize === undefined &&
            patch.lineSpacing === undefined &&
            patch.targetLineWidth === undefined
          ) {
            setTypography((prev) => ({ ...prev, ...patch }));
            return;
          }
          applyReflowableUpdate({ typography: { ...typography, ...patch } });
        }}
        onUpdatePhoneZone={(nextPhone) => {
          applyReflowableUpdate({ phoneZone: nextPhone });
        }}
        onCenterPhoneZone={() => {
          const nextPhone: Rect = {
            ...phoneZone,
            x: Math.round((viewportW - phoneZone.width) / 2),
            y: Math.round((viewportH - phoneZone.height) * 0.48),
          };
          applyReflowableUpdate({ phoneZone: nextPhone });
        }}
        onUpdateStandZone={(nextStand) => {
          applyReflowableUpdate({ standZone: nextStand });
        }}
        onUpdateMarker={(nextMarker) => {
          applyReflowableUpdate({ readingMarker: nextMarker });
        }}
        onTogglePreventSleep={() => setPreventSleepEnabled((p) => !p)}
        onToggleSimulateWakeFailure={() => setSimulateWakeFailure((s) => !s)}
        onRetryWakeLock={retryWakeLock}
        onSimulateFocusLossRecovery={() => {
          handleFocusLossPause();
          void verifyWakeLock();
          showNotice(t.noticeSimulatedFocusRecovery);
        }}
        onClearRecentScript={() => {
          const def = createDefaultConfig(canvasSize.w, canvasSize.h + HEADER_HEIGHT);
          const geom = createDefaultGeometry(canvasSize.w, canvasSize.h + HEADER_HEIGHT);
          setPlaybackState('paused');
          setSessionState('idle');
          setRawText(language === 'en' ? DEFAULT_SAMPLE_SCRIPT_EN : DEFAULT_SAMPLE_SCRIPT);
          setFormat('md');
          setFileName(t.defaultFileName);
          setReadingMode('continuous');
          setTypography(def.typography);
          setWindowRect({
            ...geom.windowRect,
            y: Math.max(8, geom.windowRect.y - HEADER_HEIGHT),
          });
          setPhoneZone(geom.phoneZone);
          setStandZone(geom.standZone);
          setReadingMarker(def.readingMarker);
          setPreventSleepEnabled(false);
          setActiveUnitIndex(0);
          anchorCharRef.current = 0;
          anchorDeltaYRef.current = 0;
          setScrollY(0);
          setIsSettingsOpen(false);
          showNotice(t.noticeClearedRecent);
        }}
      />
    </div>
  );
}
