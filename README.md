# Mac Wrap-Around Teleprompter · 环绕提词器

**Live App / 在线使用:** [https://wrap-prompter.ai.studio/](https://wrap-prompter.ai.studio/)

A studio-grade teleprompter built for creators who mount a phone and stand directly in front of a Mac external display. Instead of hiding text behind masks or splitting scripts into disconnected columns, a single continuous text stream dynamically wraps around your calibrated **Phone Exclusion Zone** and optional **Stand Exclusion Zone** in real time.

专为在显示器前方架设手机与支架录制口播、演讲或讲书的创作者打造的环绕提词器。通过统一的实时环绕排版引擎，单条连续文稿流能够真实绕开视口内固定的**手机禁区**与可选**支杆避让区**，让台词紧贴镜头边缘且绝不被机身遮挡。

---

## Key Features / 核心特性

- **True Wrap-Around Text Layout / 真实动态环绕排版**
  - Calibrate the fixed-in-viewport **Phone Zone** (`位置 / 宽高`) and optional **Stand Zone** (`支杆避让`) with a `12pt` outer safety margin.
  - A single continuous script flows full-width above the phone, splits cleanly into left & right line fragments beside the exclusion union (reading order: top-to-bottom, left-then-right), and resumes full width below.
  - Fragments narrower than 2 full-width CJK characters are automatically skipped; invalid adjustments that leave zero readable space at the reading position are safely rejected.
- **Independent Typography & Anchor Stability / 独立排版与重排锚点稳定**
  - Adjust **Font Size** (`16–80 pt`), **Extra Line Spacing** (`0–48 pt`), **Line Width** (`240–1200 pt`, independent of window width), **Scroll Speed** (`1–120 pt/s`), **Colors**, and **Opacity** without resetting one another.
  - Reflowing text pauses playback and locks your exact reading character back onto the reading marker—no jumping back to the top or skipping unread lines.
- **Movable Reading Marker & Cross-Fragment Highlight / 可移动阅读标记与当前句高亮**
  - Position the horizontal or vertical reading marker anywhere in readable space (automatically clamped outside exclusion zones).
  - Highlights the active sentence or paragraph across wrapped lines and left/right split fragments without altering font size, line height, or line breaks.
- **Continuous, Sentence & Paragraph Modes / 连续、逐句、逐段三种模式**
  - **Continuous Mode (`连续`)**: Smooth `requestAnimationFrame` scrolling (`20 pt/s` default), single-key play/pause (ignoring key repeat), manual wheel pause-then-scroll, and explicit end-of-script stop (`回到开头`).
  - **Sentence / Paragraph Mode (`逐句` / `逐段`)**: Chinese-first sentence & paragraph segmentation; arrow keys step units cleanly; long units taller than the viewport support **"Continue Sentence / Paragraph"** (`Space` / `Enter`) with preserved context lines.
- **UTF-8 Import, Paste Editor & Bilingual UI / 文稿导入、独立编辑与中英双语切换**
  - Drag-and-drop or import `.txt` / `.md` scripts with simplified Markdown (`#` headings, `**bold**`, `*italic*`, `---` dividers), plus an isolated paste/edit modal that never triggers teleprompter shortcuts or breaks IME composition.
  - One-click **中 / EN** language switch in the top studio bar.
- **Floating Studio Window & Session Wake Lock / 浮窗校准与会话级防休眠**
  - Drag the window title bar to move the layout and exclusion zones together; resize edges/corners anchored on the phone's screen center.
  - **Prevent Sleep (`防休眠`)** uses the browser Screen Wake Lock API strictly bound to active teleprompter sessions (`提词中`), persisting preferences locally in `localStorage`.

---

## Keyboard Shortcuts / 快捷键说明

Shortcuts are active only when the teleprompter reading viewport has focus (disabled inside the script editor, settings inputs, or active IME composition). Held-key repeats (`e.repeat`) and system modifier combos (`Cmd` / `Ctrl`) are ignored.

| Input / 按键 | Continuous Mode / 连续模式 | Sentence or Paragraph Mode / 逐句或逐段模式 |
| --- | --- | --- |
| `Space` / `Enter` | Play / Pause · 开始或暂停 | Continue long unit or advance · 继续本句/段或进入下一单元 |
| Printable Keys / 其他普通键 | Play / Pause · 开始或暂停 | No-op · 不触发推进 |
| `→` or `↓` | Pause & next sentence · 暂停并进入下一句 | Next sentence / paragraph · 下一句或下一段 |
| `←` or `↑` | Pause & previous sentence · 暂停并返回上一句 | Previous sentence / paragraph · 上一句或上一段 |
| `Esc` | Pause at current position · 暂停并保持当前位置 | Stay on current unit · 保持当前单元不退出会话 |

---

## Local Development / 本地开发

**Prerequisites / 环境要求:** Node.js 18+

```bash
# Install dependencies / 安装依赖
npm install

# Start development server on http://localhost:3000 / 启动开发服务器
npm run dev

# Type-check and build for production / 类型检查与生产构建
npm run lint
npm run build
```

---

## Tech Stack / 技术栈

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Layout Engine**: Custom Canvas 2D character-width measurement & real-time exclusion-union line slicer
- **Browser APIs**: Screen Wake Lock API (`navigator.wakeLock`), File / UTF-8 `TextDecoder`, `localStorage` v1 schema persistence
