import type {
  ParagraphUnit,
  ParsedScript,
  RenderedChar,
  ScriptFormat,
  SentenceUnit,
} from '../types/teleprompter';

export const DEFAULT_SAMPLE_SCRIPT = `# 开场白与现场校准说明

01. 欢迎使用环绕提词器，这段示例文稿专门用于验证副屏录制、手机避让与逐句推进。
02. 请先将中间的“手机禁区”矩形拖动并缩放到与您屏幕前方的手机机身一致的位置！
03. 您注意到吗？当文字滚动到手机上方、两侧以及下方时，同一条连续文稿会自动围绕禁区重新排布。

---

## 为什么需要真实环绕排版

04. 在传统提词器中，如果您把手机支架放在显示器正前方，文字要么被机身挡住，要么被迫缩到屏幕一角。
05. “其实真正的难题不在于把字放大，而在于让视线紧贴镜头，同时还能从容看清上下句的衔接？！》”一位长期录制口播的创作者这样总结道。
06. 在实际测试里，我们将默认字号设为 32 点、行宽设为 760 点、滚动速度设为 20 点每秒（例如 3.14 倍速显然过快，而在 18.5 到 24 点每秒之间则最为自然）。

07. 接下来请尝试按空格键或任意普通字母键，体验单次按键立即暂停、再次按下从原位平滑继续；您也可以随时切换为“逐句”或“逐段”模式，使用方向键精确控制推进节奏。
08. 本句包含一段较长的演讲示范，用于在窗口变窄或字号调大时验证“继续本句”功能：当一个完整句子或自然段的高度超过两个提词视口时，系统不会在您还没读完时直接跳过本句，而是允许您继续按空格键或回车键，将后续尚未展示的文字顺滑推送到阅读标记附近，同时保留上一行作为上下文参考，直到该句的最后一个字符完整出现在可读区域内，下一次按键才会正式进入下一句。

## 中英混排与特殊标点测试

09. 支持在 Markdown 文稿中混合英文术语，例如 Apple TextKit exclusionPaths、Screen Wake Lock API 以及 4K 60fps workflow，小数点 3.14159 与省略号……不会误触发断句；同时支持常见表情符号 🎬 🎙️ 📱 与独立段落留白。

10. 最后一段刻意不加句末标点，用于确认无结尾标点的末句依然可以被正常选中、定位并读至文稿末尾`;

const PRIMARY_END_PUNCT = new Set(['。', '？', '！', '?', '!']);
const TRAILING_CLOSERS = new Set([
  '。',
  '？',
  '！',
  '?',
  '!',
  '”',
  '’',
  '」',
  '』',
  '）',
  '》',
  '】',
  '〉',
  '"',
  "'",
  ')',
  ']',
  '…',
]);

interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

function parseInlineMarkdown(line: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let i = 0;
  let buffer = '';

  const flushBuffer = (bold = false, italic = false) => {
    if (buffer.length > 0) {
      segments.push({ text: buffer, bold, italic });
      buffer = '';
    }
  };

  while (i < line.length) {
    if (line[i] === '\\' && i + 1 < line.length) {
      buffer += line[i + 1];
      i += 2;
      continue;
    }

    if (line.startsWith('**', i)) {
      const end = line.indexOf('**', i + 2);
      if (end !== -1 && end > i + 2) {
        flushBuffer();
        segments.push({
          text: line.slice(i + 2, end),
          bold: true,
          italic: false,
        });
        i = end + 2;
        continue;
      }
    }

    if (line[i] === '*' && !line.startsWith('**', i)) {
      const end = line.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1) {
        flushBuffer();
        segments.push({
          text: line.slice(i + 1, end),
          bold: false,
          italic: true,
        });
        i = end + 1;
        continue;
      }
    }

    buffer += line[i];
    i += 1;
  }

  flushBuffer();
  return segments;
}

function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const SegmenterCtor = (Intl as unknown as { Segmenter: new (locale: string, opts: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
    const segmenter = new SegmenterCtor('zh-CN', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export function parseScript(
  rawText: string,
  format: ScriptFormat,
  fileName = '示例演讲稿.md'
): ParsedScript {
  const normalized = rawText.replace(/\r\n?/g, '\n');
  const rawLines = normalized.split('\n');

  const paragraphs: ParagraphUnit[] = [];
  const sentences: SentenceUnit[] = [];
  const allChars: RenderedChar[] = [];
  let renderedText = '';

  let globalCharIndex = 0;
  let sentenceCounter = 0;

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();

    if (trimmed.length === 0) {
      if (paragraphs.length > 0) {
        paragraphs[paragraphs.length - 1].isBlankAfter = true;
      }
      continue;
    }

    // Check Markdown decorative divider
    if (format === 'md' && /^([-*_])\1{2,}$/.test(trimmed)) {
      paragraphs.push({
        index: paragraphs.length,
        startChar: globalCharIndex,
        endChar: -1,
        headingLevel: 0,
        isDivider: true,
        isBlankAfter: false,
        chars: [],
        previewText: '---',
      });
      continue;
    }

    let headingLevel: 0 | 1 | 2 | 3 = 0;
    let contentLine = rawLine;

    if (format === 'md') {
      const headingMatch = rawLine.match(/^\s{0,3}(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        headingLevel = Math.min(3, headingMatch[1].length) as 1 | 2 | 3;
        contentLine = headingMatch[2].trim();
      }
    }

    const segments: InlineSegment[] =
      format === 'md'
        ? parseInlineMarkdown(contentLine)
        : [{ text: contentLine, bold: false, italic: false }];

    const pIndex = paragraphs.length;
    const pStartChar = globalCharIndex;
    const pChars: RenderedChar[] = [];

    for (const seg of segments) {
      const graphemes = splitGraphemes(seg.text);
      for (const g of graphemes) {
        const rc: RenderedChar = {
          char: g,
          charIndex: globalCharIndex,
          paragraphIndex: pIndex,
          sentenceIndex: sentenceCounter,
          headingLevel,
          bold: seg.bold || headingLevel > 0,
          italic: seg.italic,
        };
        pChars.push(rc);
        allChars.push(rc);
        renderedText += g;
        globalCharIndex += 1;
      }
    }

    if (pChars.length === 0) {
      continue;
    }

    const pEndChar = globalCharIndex - 1;
    const pPlainText = pChars.map((c) => c.char).join('');

    // Sentence segmentation within paragraph (FR07 Chinese-first boundary rules)
    let currentSentStart = pStartChar;
    let cursor = 0;

    while (cursor < pChars.length) {
      const ch = pChars[cursor].char;
      pChars[cursor].sentenceIndex = sentenceCounter;

      if (PRIMARY_END_PUNCT.has(ch)) {
        // Consume consecutive closing punctuation and closing quotes
        let lookahead = cursor + 1;
        while (lookahead < pChars.length && TRAILING_CLOSERS.has(pChars[lookahead].char)) {
          pChars[lookahead].sentenceIndex = sentenceCounter;
          lookahead += 1;
        }
        const sentEndChar = pStartChar + lookahead - 1;
        const preview = pChars
          .slice(currentSentStart - pStartChar, lookahead)
          .map((c) => c.char)
          .join('');
        sentences.push({
          index: sentenceCounter,
          paragraphIndex: pIndex,
          startChar: currentSentStart,
          endChar: sentEndChar,
          previewText: preview,
        });
        sentenceCounter += 1;
        currentSentStart = sentEndChar + 1;
        cursor = lookahead;
        continue;
      }

      cursor += 1;
    }

    // Real paragraph end closes any remaining open sentence
    if (currentSentStart <= pEndChar) {
      const preview = pChars
        .slice(currentSentStart - pStartChar)
        .map((c) => c.char)
        .join('');
      sentences.push({
        index: sentenceCounter,
        paragraphIndex: pIndex,
        startChar: currentSentStart,
        endChar: pEndChar,
        previewText: preview,
      });
      sentenceCounter += 1;
    }

    paragraphs.push({
      index: pIndex,
      startChar: pStartChar,
      endChar: pEndChar,
      headingLevel,
      isDivider: false,
      isBlankAfter: false,
      chars: pChars,
      previewText: pPlainText,
    });
  }

  return {
    rawText: normalized,
    format,
    fileName,
    renderedText,
    chars: allChars,
    paragraphs,
    sentences,
  };
}

export function matchEditedAnchor(
  oldScript: ParsedScript,
  oldAnchorCharIndex: number,
  newScript: ParsedScript
): { anchorCharIndex: number; notice: string | null } {
  if (newScript.chars.length === 0) {
    return { anchorCharIndex: 0, notice: '文稿内容为空，已定位到开头' };
  }

  const clampedOld = Math.max(0, Math.min(oldAnchorCharIndex, Math.max(0, oldScript.chars.length - 1)));
  const oldChar = oldScript.chars[clampedOld];
  if (!oldChar) {
    return { anchorCharIndex: 0, notice: null };
  }

  const oldSentence = oldScript.sentences[oldChar.sentenceIndex];
  const oldParagraph = oldScript.paragraphs[oldChar.paragraphIndex];

  // 1. Try matching the exact sentence text
  if (oldSentence && oldSentence.previewText.trim().length > 0) {
    const candidates = newScript.sentences.filter(
      (s) => s.previewText === oldSentence.previewText
    );
    if (candidates.length > 0) {
      // Pick closest by relative progress
      const oldRatio = clampedOld / Math.max(1, oldScript.chars.length);
      let best = candidates[0];
      let bestDist = Infinity;
      for (const cand of candidates) {
        const ratio = cand.startChar / Math.max(1, newScript.chars.length);
        const dist = Math.abs(ratio - oldRatio);
        if (dist < bestDist) {
          bestDist = dist;
          best = cand;
        }
      }
      const offsetInSent = Math.max(
        0,
        Math.min(clampedOld - oldSentence.startChar, best.endChar - best.startChar)
      );
      return {
        anchorCharIndex: best.startChar + offsetInSent,
        notice: null,
      };
    }
  }

  // 2. Current sentence deleted or modified -> locate nearest preserved paragraph start
  if (oldParagraph) {
    const nonDividerOld = oldScript.paragraphs.filter((p) => !p.isDivider);
    const oldNonDivIdx = nonDividerOld.findIndex((p) => p.index === oldParagraph.index);

    // Search outward from oldNonDivIdx for any preserved paragraph preview text
    for (let delta = 0; delta < nonDividerOld.length; delta++) {
      const indicesToCheck = delta === 0 ? [oldNonDivIdx] : [oldNonDivIdx - delta, oldNonDivIdx + delta];
      for (const idx of indicesToCheck) {
        if (idx >= 0 && idx < nonDividerOld.length) {
          const targetText = nonDividerOld[idx].previewText;
          const matchPara = newScript.paragraphs.find(
            (p) => !p.isDivider && p.previewText === targetText
          );
          if (matchPara) {
            return {
              anchorCharIndex: matchPara.startChar,
              notice: '当前句已变更或删除，已定位至最近保留段落开头（保持暂停）',
            };
          }
        }
      }
    }
  }

  return {
    anchorCharIndex: 0,
    notice: '文稿结构变化较大，已定位至文稿开头（保持暂停）',
  };
}
