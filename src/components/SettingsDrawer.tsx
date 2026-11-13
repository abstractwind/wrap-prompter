import React from 'react';
import { X, RotateCcw, Shield, Trash2, AlertTriangle } from 'lucide-react';
import type {
  ReadingMarker,
  Rect,
  StandZone,
  TypographySettings,
  WakeLockStatus,
} from '../types/teleprompter';

interface SettingsDrawerProps {
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

const TEXT_COLOR_PRESETS = [
  { label: '暖白', value: '#F5F5F4' },
  { label: '纯白', value: '#FFFFFF' },
  { label: '护眼琥珀', value: '#FDE68A' },
  { label: '柔绿', value: '#D1FAE5' },
];

const BG_COLOR_PRESETS = [
  { label: '深炭黑', value: '#12151C' },
  { label: '纯黑', value: '#050608' },
  { label: '深石板', value: '#18202C' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
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
          <h2 className="text-sm font-semibold text-zinc-100">排版、校准与会话设置</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] cursor-pointer"
            aria-label="关闭设置面板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 studio-scrollbar text-xs">
          {/* Typography Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300">正文排版（各参数独立生效）</h3>

            {/* Font Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="setting-fontsize" className="text-zinc-300">
                  字号
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
                  额外行距
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
                  正文期望行宽
                </label>
                <span className="font-mono-tabular text-amber-400">
                  {typography.targetLineWidth} pt
                  {effectiveLineWidth < typography.targetLineWidth && (
                    <span className="text-zinc-400">（实际 {Math.round(effectiveLineWidth)}）</span>
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
                  连续滚动速度
                </label>
                <span className="font-mono-tabular text-amber-400">
                  {typography.speedPtPerSec} 点/秒
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
                <span className="text-zinc-400 block">文字颜色</span>
                <div className="flex items-center gap-1.5">
                  {TEXT_COLOR_PRESETS.map((c) => (
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
                <span className="text-zinc-400 block">背景颜色</span>
                <div className="flex items-center gap-1.5">
                  {BG_COLOR_PRESETS.map((c) => (
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
                  窗口透明度
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
              <h3 className="text-xs font-semibold text-zinc-300">手机、支杆与阅读标记</h3>
              <button
                type="button"
                onClick={onCenterPhoneZone}
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                手机居中复位
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['X', 'x', phoneZone.x],
                  ['Y', 'y', phoneZone.y],
                  ['宽', 'width', phoneZone.width],
                  ['高', 'height', phoneZone.height],
                ] as const
              ).map(([lbl, key, val]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-[11px] text-zinc-400">手机 {lbl}</span>
                  <input
                    type="number"
                    value={Math.round(val)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (Number.isFinite(num)) {
                        onUpdatePhoneZone({
                          ...phoneZone,
                          [key]: key === 'width' ? Math.max(72, num) : key === 'height' ? Math.max(96, num) : num,
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
                <span className="text-zinc-200 font-medium block">支杆避让</span>
                <span className="text-[11px] text-zinc-500">开启后以手机与支杆并集避让（含 12pt 留白）</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={standZone.enabled}
                onClick={() => onUpdateStandZone({ ...standZone, enabled: !standZone.enabled })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  standZone.enabled
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400'
                }`}
              >
                {standZone.enabled ? '已开启' : '已关闭'}
              </button>
            </div>

            {standZone.enabled && (
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ['X', 'x', standZone.x],
                    ['Y', 'y', standZone.y],
                    ['宽', 'width', standZone.width],
                    ['高', 'height', standZone.height],
                  ] as const
                ).map(([lbl, key, val]) => (
                  <label key={key} className="block space-y-1">
                    <span className="text-[11px] text-zinc-400">支杆 {lbl}</span>
                    <input
                      type="number"
                      value={Math.round(val)}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        if (Number.isFinite(num)) {
                          onUpdateStandZone({
                            ...standZone,
                            [key]: key === 'width' ? Math.max(24, num) : key === 'height' ? Math.max(36, num) : num,
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
              <span className="text-zinc-200 font-medium">显示阅读标记</span>
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
                  {readingMarker.orientation === 'horizontal' ? '水平参考线' : '垂直参考线'}
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
                  {readingMarker.visible ? '显示中' : '已隐藏'}
                </button>
              </div>
            </div>
          </section>

          <div className="h-px bg-white/10" />

          {/* Wake Lock & Maintenance */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300">会话防休眠与本地存储</h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  防休眠（提词期间保持屏幕常亮）
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  仅在“提词中”持有唤醒锁，暂停或后台时保持，结束时释放
                </span>
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
                {preventSleepEnabled ? '已开启' : '关闭'}
              </button>
            </div>

            {wakeLockStatus === 'failed' && (
              <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-red-300">
                  未生效：{wakeLockError ?? '唤醒请求失败'}
                </span>
                <button
                  type="button"
                  onClick={onRetryWakeLock}
                  className="px-2 py-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded cursor-pointer shrink-0"
                >
                  重试
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onSimulateFocusLossRecovery}
                className="px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded cursor-pointer"
              >
                模拟失焦/锁屏恢复
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
                {simulateWakeFailure ? '取消模拟失败' : '模拟防休眠失败'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClearRecentScript}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清除最近文稿并恢复默认状态
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
};
