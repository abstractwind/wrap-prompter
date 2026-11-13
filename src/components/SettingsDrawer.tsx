import React from 'react';
import { X, RotateCcw, Shield, Trash2, AlertTriangle } from 'lucide-react';
import type {
  AppLanguage,
  ReadingMarker,
  Rect,
  StandZone,
  TypographySettings,
  WakeLockStatus,
} from '../types/teleprompter';
import { MESSAGES } from '../utils/i18n';

interface SettingsDrawerProps {
  language: AppLanguage;
  isOpen: boolean;
  typography: TypographySettings;
  effectiveLineWidth: number;
  phoneZone: Rect;
  standZone: StandZone;
  readingMarker: ReadingMarker;
  preventSleepEnabled: boolean;
  wakeLockStatus: WakeLockStatus;
  wakeLockError: string | null;
  simulateWakeFailure: boolean;
  onClose: () => void;
  onUpdateTypography: (patch: Partial<TypographySettings>) => void;
  onUpdatePhoneZone: (next: Rect) => void;
  onCenterPhoneZone: () => void;
  onUpdateStandZone: (next: StandZone) => void;
  onUpdateMarker: (next: ReadingMarker) => void;
  onTogglePreventSleep: () => void;
  onToggleSimulateWakeFailure: () => void;
  onRetryWakeLock: () => void;
  onSimulateFocusLossRecovery: () => void;
  onClearRecentScript: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  language,
  isOpen,
  typography,
  effectiveLineWidth,
  phoneZone,
  standZone,
  readingMarker,
  preventSleepEnabled,
  wakeLockStatus,
  wakeLockError,
  simulateWakeFailure,
  onClose,
  onUpdateTypography,
  onUpdatePhoneZone,
  onCenterPhoneZone,
  onUpdateStandZone,
  onUpdateMarker,
  onTogglePreventSleep,
  onToggleSimulateWakeFailure,
  onRetryWakeLock,
  onSimulateFocusLossRecovery,
  onClearRecentScript,
}) => {
  if (!isOpen) return null;
  const t = MESSAGES[language];

  const textColorPresets = [
    { label: t.colorWarmWhite, value: '#F5F5F4' },
    { label: t.colorPureWhite, value: '#FFFFFF' },
    { label: t.colorAmber, value: '#FDE68A' },
    { label: t.colorSoftGreen, value: '#D1FAE5' },
  ];

  const bgColorPresets = [
    { label: t.colorCharcoal, value: '#12151C' },
    { label: t.colorPureBlack, value: '#050608' },
    { label: t.colorSlate, value: '#18202C' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex justify-end"
      onClick={onClose}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') onClose();
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm h-full bg-[#12161F]/95 backdrop-blur-xl border-l border-white/12 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-zinc-100">{t.settingsTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] cursor-pointer"
            aria-label={t.closeSettingsAria}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 studio-scrollbar text-xs">
          {/* Typography Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300">{t.typographySectionTitle}</h3>

            {/* Font Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-fontsize" className="text-zinc-300">
                  {t.fontSizeLabel}
                </label>
                <span className="font-mono-tabular text-amber-400">{typography.fontSize} pt</span>
              </div>
              <input
                id="setting-fontsize"
                type="range"
                min={16}
                max={80}
                step={1}
                value={typography.fontSize}
                onChange={(e) => onUpdateTypography({ fontSize: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Extra Line Spacing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-linespacing" className="text-zinc-300">
                  {t.lineSpacingLabel}
                </label>
                <span className="font-mono-tabular text-amber-400">{typography.lineSpacing} pt</span>
              </div>
              <input
                id="setting-linespacing"
                type="range"
                min={0}
                max={48}
                step={1}
                value={typography.lineSpacing}
                onChange={(e) => onUpdateTypography({ lineSpacing: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Independent Line Width */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-linewidth" className="text-zinc-300">
                  {t.targetLineWidthLabel}
                </label>
                <span className="font-mono-tabular text-amber-400">
                  {typography.targetLineWidth} pt
                  {effectiveLineWidth < typography.targetLineWidth && (
                    <span className="text-zinc-400">
                      {t.actualWidthNote(Math.round(effectiveLineWidth))}
                    </span>
                  )}
                </span>
              </div>
              <input
                id="setting-linewidth"
                type="range"
                min={240}
                max={1200}
                step={10}
                value={typography.targetLineWidth}
                onChange={(e) => onUpdateTypography({ targetLineWidth: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Scroll Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-speed" className="text-zinc-300">
                  {t.scrollSpeedLabel}
                </label>
                <span className="font-mono-tabular text-amber-400">
                  {typography.speedPtPerSec} {t.speedUnit}
                </span>
              </div>
              <input
                id="setting-speed"
                type="range"
                min={1}
                max={120}
                step={1}
                value={typography.speedPtPerSec}
                onChange={(e) => onUpdateTypography({ speedPtPerSec: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Colors & Opacity */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <span className="text-zinc-400 block">{t.textColorLabel}</span>
                <div className="flex items-center gap-1.5">
                  {textColorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => onUpdateTypography({ textColor: c.value })}
                      className={`w-6 h-6 rounded border cursor-pointer ${
                        typography.textColor === c.value
                          ? 'border-amber-400 ring-1 ring-amber-400'
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-zinc-400 block">{t.bgColorLabel}</span>
                <div className="flex items-center gap-1.5">
                  {bgColorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => onUpdateTypography({ backgroundColor: c.value })}
                      className={`w-6 h-6 rounded border cursor-pointer ${
                        typography.backgroundColor === c.value
                          ? 'border-amber-400 ring-1 ring-amber-400'
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-opacity" className="text-zinc-300">
                  {t.windowOpacityLabel}
                </label>
                <span className="font-mono-tabular text-zinc-300">
                  {Math.round(typography.backgroundOpacity * 100)}%
                </span>
              </div>
              <input
                id="setting-opacity"
                type="range"
                min={0.4}
                max={1}
                step={0.02}
                value={typography.backgroundOpacity}
                onChange={(e) =>
                  onUpdateTypography({ backgroundOpacity: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </section>

          <div className="h-px bg-white/10" />

          {/* Exclusion Zones & Reading Marker */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-300">{t.calibrationSectionTitle}</h3>
              <button
                type="button"
                onClick={onCenterPhoneZone}
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {t.centerPhoneReset}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['X', 'x', phoneZone.x],
                  ['Y', 'y', phoneZone.y],
                  [t.axisW, 'width', phoneZone.width],
                  [t.axisH, 'height', phoneZone.height],
                ] as const
              ).map(([lbl, key, val]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-[11px] text-zinc-400">{t.phoneAxisLabel(lbl)}</span>
                  <input
                    type="number"
                    value={Math.round(val)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (Number.isFinite(num)) {
                        onUpdatePhoneZone({
                          ...phoneZone,
                          [key]:
                            key === 'width'
                              ? Math.max(72, num)
                              : key === 'height'
                              ? Math.max(96, num)
                              : num,
                        });
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono-tabular text-zinc-100 focus:outline-none focus:border-amber-500/60"
                  />
                </label>
              ))}
            </div>

            {/* Stand Exclusion Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-zinc-200 font-medium block">{t.standAvoidanceLabel}</span>
                <span className="text-[11px] text-zinc-500">{t.standAvoidanceDesc}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={standZone.enabled}
                onClick={() => onUpdateStandZone({ ...standZone, enabled: !standZone.enabled })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  standZone.enabled
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400'
                }`}
              >
                {standZone.enabled ? t.enabledLabel : t.disabledLabel}
              </button>
            </div>

            {standZone.enabled && (
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ['X', 'x', standZone.x],
                    ['Y', 'y', standZone.y],
                    [t.axisW, 'width', standZone.width],
                    [t.axisH, 'height', standZone.height],
                  ] as const
                ).map(([lbl, key, val]) => (
                  <label key={key} className="block space-y-1">
                    <span className="text-[11px] text-zinc-400">{t.standAxisLabel(lbl)}</span>
                    <input
                      type="number"
                      value={Math.round(val)}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        if (Number.isFinite(num)) {
                          onUpdateStandZone({
                            ...standZone,
                            [key]:
                              key === 'width'
                                ? Math.max(24, num)
                                : key === 'height'
                                ? Math.max(36, num)
                                : num,
                          });
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono-tabular text-zinc-100 focus:outline-none focus:border-sky-500/60"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Reading Marker Controls */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-zinc-200 font-medium">{t.showMarkerLabel}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMarker({
                      ...readingMarker,
                      orientation:
                        readingMarker.orientation === 'horizontal' ? 'vertical' : 'horizontal',
                    })
                  }
                  className="px-2.5 py-1 rounded text-xs bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-300 cursor-pointer"
                >
                  {readingMarker.orientation === 'horizontal'
                    ? t.horizontalGuide
                    : t.verticalGuide}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMarker({ ...readingMarker, visible: !readingMarker.visible })
                  }
                  className={`px-2.5 py-1 rounded text-xs border cursor-pointer ${
                    readingMarker.visible
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/[0.04] border-white/10 text-zinc-400'
                  }`}
                >
                  {readingMarker.visible ? t.visibleLabel : t.hiddenLabel}
                </button>
              </div>
            </div>
          </section>

          <div className="h-px bg-white/10" />

          {/* Wake Lock & Maintenance */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300">{t.sessionPowerSectionTitle}</h3>

            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {t.preventSleepTitle}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">{t.preventSleepDesc}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preventSleepEnabled}
                onClick={onTogglePreventSleep}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  preventSleepEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400'
                }`}
              >
                {preventSleepEnabled ? t.enabledLabel : t.wakeOff}
              </button>
            </div>

            {wakeLockStatus === 'failed' && (
              <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-red-300">
                  {t.wakeFailedPrefix}
                  {wakeLockError ?? t.wakeRequestFailedFallback}
                </span>
                <button
                  type="button"
                  onClick={onRetryWakeLock}
                  className="px-2 py-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded cursor-pointer shrink-0"
                >
                  {t.retry}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onSimulateFocusLossRecovery}
                className="px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded cursor-pointer"
              >
                {t.simulateFocusLoss}
              </button>
              <button
                type="button"
                onClick={onToggleSimulateWakeFailure}
                className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer ${
                  simulateWakeFailure
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {simulateWakeFailure ? t.cancelSimulateFailure : t.simulateWakeFailure}
              </button>
            </div>

            <button
              type="button"
              onClick={onClearRecentScript}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.clearRecentScript}
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
};
