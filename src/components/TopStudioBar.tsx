import React, { useRef } from 'react';
import {
  FileUp,
  FileEdit,
  SlidersHorizontal,
  Lock,
  Unlock,
  Play,
  Square,
  Shield,
  RotateCw,
} from 'lucide-react';
import type {
  PlaybackState,
  ReadingMode,
  SessionState,
  WakeLockStatus,
} from '../types/teleprompter';

interface TopStudioBarProps {
  fileName: string;
  sessionState: SessionState;
  playbackState: PlaybackState;
  readingMode: ReadingMode;
  isCalibrating: boolean;
  preventSleepEnabled: boolean;
  wakeLockStatus: WakeLockStatus;
  wakeLockError: string | null;
  onImportFile: (file: File) => void;
  onOpenEditor: () => void;
  onChangeMode: (mode: ReadingMode) => void;
  onToggleCalibration: () => void;
  onTogglePreventSleep: () => void;
  onRetryWakeLock: () => void;
  onToggleSession: () => void;
  onOpenSettings: () => void;
}

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  fileName,
  sessionState,
  playbackState,
  readingMode,
  isCalibrating,
  preventSleepEnabled,
  wakeLockStatus,
  wakeLockError,
  onImportFile,
  onOpenEditor,
  onChangeMode,
  onToggleCalibration,
  onTogglePreventSleep,
  onRetryWakeLock,
  onToggleSession,
  onOpenSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sessionLabel =
    sessionState === 'idle'
      ? '尚未开始'
      : sessionState === 'ended'
      ? '已结束'
      : playbackState === 'playing'
      ? '提词中 · 播放中'
      : playbackState === 'atEnd'
      ? '提词中 · 已到末尾'
      : '提词中 · 已暂停';

  const wakeStatusLabel = !preventSleepEnabled
    ? '关闭'
    : wakeLockStatus === 'active'
    ? '已生效'
    : wakeLockStatus === 'failed'
    ? '未生效'
    : '开始提词后生效';

  const wakeStatusColor = !preventSleepEnabled
    ? 'text-zinc-400'
    : wakeLockStatus === 'active'
    ? 'text-emerald-400'
    : wakeLockStatus === 'failed'
    ? 'text-red-400'
    : 'text-amber-400';

  return (
    <header className="relative z-40 h-13 shrink-0 border-b border-white/10 bg-[#11141B]/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 select-none">
      {/* Zone 1: Brand + Clean Unboxed Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-semibold tracking-tight text-zinc-100 whitespace-nowrap shrink-0">
          环绕提词器
        </span>
        <span className="text-zinc-600 shrink-0" aria-hidden="true">
          ·
        </span>
        <span className="text-xs text-zinc-400 truncate max-w-[160px]" title={fileName}>
          {fileName}
        </span>
        <span className="text-zinc-600 shrink-0 hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span
          className={`text-xs whitespace-nowrap shrink-0 hidden sm:inline ${
            sessionState === 'active' && playbackState === 'playing'
              ? 'text-amber-400 font-medium'
              : 'text-zinc-400'
          }`}
        >
          {sessionLabel}
        </span>
      </div>

      {/* Zone 2: Primary Workflow Controls (Single-line) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportFile(file);
            }
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="导入 UTF-8 TXT 或 Markdown 文件"
        >
          <FileUp className="w-3.5 h-3.5 text-zinc-400" />
          导入文稿
        </button>

        <button
          type="button"
          onClick={onOpenEditor}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="粘贴或编辑文稿内容（打开时自动暂停）"
        >
          <FileEdit className="w-3.5 h-3.5 text-zinc-400" />
          编辑文稿
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />

        {/* Reading Mode Segmented Switch */}
        <div
          className="inline-flex items-center p-0.5 bg-black/40 border border-white/10 rounded-md shrink-0"
          role="group"
          aria-label="阅读模式"
        >
          {(
            [
              ['continuous', '连续'],
              ['sentence', '逐句'],
              ['paragraph', '逐段'],
            ] as const
          ).map(([modeKey, label]) => (
            <button
              key={modeKey}
              type="button"
              onClick={() => onChangeMode(modeKey)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                readingMode === modeKey
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleCalibration}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isCalibrating
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-zinc-200'
          }`}
          title={isCalibrating ? '锁定手机、支杆与阅读标记位置' : '校准手机、支杆与阅读标记位置'}
        >
          {isCalibrating ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              锁定布局
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-zinc-400" />
              调整布局
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          排版设置
        </button>
      </div>

      {/* Zone 3: Wake Lock & Primary Session CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onTogglePreventSleep}
            role="switch"
            aria-checked={preventSleepEnabled}
            title="防休眠：提词期间保持屏幕常亮"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              preventSleepEnabled
                ? 'bg-white/[0.07] border-white/20 text-zinc-100'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${wakeStatusColor}`} />
            <span>防休眠</span>
            <span className="text-zinc-600">·</span>
            <span className={wakeStatusColor}>{wakeStatusLabel}</span>
          </button>

          {wakeLockStatus === 'failed' && (
            <button
              type="button"
              onClick={onRetryWakeLock}
              title={wakeLockError ?? '重试防休眠'}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              重试
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleSession}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            sessionState === 'active'
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/15'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
          }`}
        >
          {sessionState === 'active' ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              结束提词
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              开始提词
            </>
          )}
        </button>
      </div>
    </header>
  );
};
