import React, { useEffect, useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import type { AppLanguage, ScriptFormat } from '../types/teleprompter';
import { MESSAGES } from '../utils/i18n';
import { DEFAULT_SAMPLE_SCRIPT, DEFAULT_SAMPLE_SCRIPT_EN } from '../utils/scriptParser';

interface ScriptEditorModalProps {
  language: AppLanguage;
  isOpen: boolean;
  initialText: string;
  initialFormat: ScriptFormat;
  fileName: string;
  onCancel: () => void;
  onApply: (nextText: string, nextFormat: ScriptFormat, nextFileName: string) => void;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  language,
  isOpen,
  initialText,
  initialFormat,
  fileName,
  onCancel,
  onApply,
}) => {
  const [draftText, setDraftText] = useState(initialText);
  const [draftFormat, setDraftFormat] = useState<ScriptFormat>(initialFormat);
  const [draftName, setDraftName] = useState(fileName);
  const t = MESSAGES[language];

  useEffect(() => {
    if (isOpen) {
      setDraftText(initialText);
      setDraftFormat(initialFormat);
      setDraftName(fileName);
    }
  }, [isOpen, initialText, initialFormat, fileName]);

  if (!isOpen) return null;

  const charCount = Array.from(draftText.replace(/\s+/g, '')).length;
  const lineCount = draftText.split(/\r\n?|\n/).filter((l) => l.trim().length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-3xl bg-[#141820] border border-white/15 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
              {t.editorTitle}
            </h2>
            <span className="text-zinc-600">·</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              aria-label={t.scriptNameAria}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-0.5 bg-black/40 border border-white/10 rounded-md">
              {(
                [
                  ['md', 'Markdown'],
                  ['txt', t.plainTextLabel],
                ] as const
              ).map(([fmt, label]) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setDraftFormat(fmt)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    draftFormat === fmt
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
              onClick={onCancel}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] cursor-pointer"
              aria-label={t.closeEditorAria}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2 min-h-0">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={t.editorPlaceholder}
            className="w-full flex-1 min-h-[340px] bg-black/40 border border-white/10 rounded-lg p-4 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 resize-none studio-scrollbar"
            autoFocus
          />

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <div className="flex items-center gap-2 font-mono-tabular">
              <span>
                {charCount} {t.charUnit}
              </span>
              <span className="text-zinc-600">·</span>
              <span>
                {lineCount} {t.nonEmptyParagraphUnit}
              </span>
              <span className="text-zinc-600 hidden sm:inline">·</span>
              <span className="font-sans text-zinc-500 hidden sm:inline">{t.editorHint}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftText(language === 'en' ? DEFAULT_SAMPLE_SCRIPT_EN : DEFAULT_SAMPLE_SCRIPT);
                setDraftFormat('md');
                setDraftName(t.defaultFileName);
              }}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              {t.restoreSampleScript}
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-black/25 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-md transition-colors cursor-pointer"
          >
            {t.cancelKeepPosition}
          </button>
          <button
            type="button"
            onClick={() => onApply(draftText, draftFormat, draftName.trim() || t.untitledScript)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {t.applyChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
