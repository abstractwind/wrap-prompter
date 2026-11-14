import type { AppLanguage } from '../types/teleprompter';

export interface UIMessages {
  appName: string;
  defaultFileName: string;
  sessionIdle: string;
  sessionEnded: string;
  sessionPlaying: string;
  sessionAtEnd: string;
  sessionPaused: string;
  importScript: string;
  importTitle: string;
  editScript: string;
  editTitle: string;
  readingModeAria: string;
  modeContinuous: string;
  modeSentence: string;
  modeParagraph: string;
  lockLayout: string;
  adjustLayout: string;
  lockLayoutTitle: string;
  adjustLayoutTitle: string;
  layoutSettings: string;
  preventSleep: string;
  preventSleepTitle: string;
  wakeOff: string;
  wakeActive: string;
  wakeFailed: string;
  wakePending: string;
  retry: string;
  retryWakeTitle: string;
  endSession: string;
  startSession: string;
  switchLangTitle: string;

  // Floating window & transport
  floatingWindowTitle: string;
  centerWindow: string;
  restoreWindowSize: string;
  fillWorkspace: string;
  play: string;
  pause: string;
  atEnd: string;
  continueSentence: string;
  continueParagraph: string;
  prevUnit: (isPara: boolean) => string;
  nextUnit: (isPara: boolean) => string;
  prevUnitTitle: (isPara: boolean) => string;
  nextUnitTitle: (isPara: boolean) => string;
  resetToStart: string;
  unitLabel: (isPara: boolean) => string;
  fontSizeShort: string;
  lineWidthShort: string;
  speedUnit: string;

  // Viewport calibration & marker
  effectiveLineWidthLabel: (w: number) => string;
  unreadableWarning: string;
  dragMarkerTitle: string;
  readingMarkerTitle: string;
  markerBadge: string;
  standLabel: string;
  safetyPaddingLabel: (pt: number) => string;
  phoneZoneLabel: string;
  fixedInViewport: string;

  // Script editor modal
  editorTitle: string;
  scriptNameAria: string;
  plainTextLabel: string;
  closeEditorAria: string;
  editorPlaceholder: string;
  charUnit: string;
  nonEmptyParagraphUnit: string;
  editorHint: string;
  restoreSampleScript: string;
  cancelKeepPosition: string;
  applyChanges: string;
  untitledScript: string;

  // Settings drawer
  settingsTitle: string;
  closeSettingsAria: string;
  typographySectionTitle: string;
  fontSizeLabel: string;
  lineSpacingLabel: string;
  targetLineWidthLabel: string;
  actualWidthNote: (w: number) => string;
  scrollSpeedLabel: string;
  textColorLabel: string;
  bgColorLabel: string;
  windowOpacityLabel: string;
  colorWarmWhite: string;
  colorPureWhite: string;
  colorAmber: string;
  colorSoftGreen: string;
  colorCharcoal: string;
  colorPureBlack: string;
  colorSlate: string;
  calibrationSectionTitle: string;
  centerPhoneReset: string;
  phoneAxisLabel: (axis: string) => string;
  standAxisLabel: (axis: string) => string;
  axisW: string;
  axisH: string;
  standAvoidanceLabel: string;
  standAvoidanceDesc: string;
  enabledLabel: string;
  disabledLabel: string;
  showMarkerLabel: string;
  horizontalGuide: string;
  verticalGuide: string;
  visibleLabel: string;
  hiddenLabel: string;
  sessionPowerSectionTitle: string;
  preventSleepDesc: string;
  wakeFailedPrefix: string;
  wakeRequestFailedFallback: string;
  simulateFocusLoss: string;
  cancelSimulateFailure: string;
  simulateWakeFailure: string;
  clearRecentScript: string;

  // Drag-and-drop & notices
  dropFilePrompt: string;
  noticeViewportRecovered: string;
  noticeWorkspaceResized: string;
  noticeInsufficientWidth: string;
  noticeAtEnd: string;
  noticeSessionEnded: string;
  noticeImportInvalidType: string;
  noticeImportTooLarge: string;
  noticeImportEmpty: string;
  noticeImportSuccessActive: (name: string) => string;
  noticeImportSuccessIdle: (name: string) => string;
  noticeImportBadUtf8: string;
  noticePhoneMinMargin: string;
  noticeEditAppliedMatched: string;
  noticeEditEmpty: string;
  noticeEditFallbackPara: string;
  noticeEditFallbackStart: string;
  noticeSimulatedFocusRecovery: string;
  noticeClearedRecent: string;
  wakeErrorSimulated: string;
  wakeErrorUnsupported: string;
  wakeErrorDenied: (msg: string) => string;

  // Timer & Estimated Remaining Time HUDs
  elapsedTimerTitle: string;
  timerStatusIdle: string;
  timerStatusRunning: string;
  timerStatusStopped: string;
  timerPauseProofHint: string;
  timerResetBtn: string;
  timerResetTitle: string;
  estimatedTimeTitle: string;
  estimatedScrollOnly: string;
  estimatedScrollOnlySub: string;
  estimatedAtSpeed: (speed: number) => string;
  estimatedRemainingLines: (lines: number) => string;
  estimatedAtEnd: string;
  estimatedUnreadable: string;
}

export const MESSAGES: Record<AppLanguage, UIMessages> = {
  zh: {
    appName: '环绕提词器',
    defaultFileName: '环绕提词示例稿.md',
    sessionIdle: '尚未开始',
    sessionEnded: '已结束',
    sessionPlaying: '提词中 · 播放中',
    sessionAtEnd: '提词中 · 已到末尾',
    sessionPaused: '提词中 · 已暂停',
    importScript: '导入文稿',
    importTitle: '导入 UTF-8 TXT 或 Markdown 文件',
    editScript: '编辑文稿',
    editTitle: '粘贴或编辑文稿内容（打开时自动暂停）',
    readingModeAria: '阅读模式',
    modeContinuous: '连续',
    modeSentence: '逐句',
    modeParagraph: '逐段',
    lockLayout: '锁定布局',
    adjustLayout: '调整布局',
    lockLayoutTitle: '锁定手机、支杆与阅读标记位置',
    adjustLayoutTitle: '校准手机、支杆与阅读标记位置',
    layoutSettings: '排版设置',
    preventSleep: '防休眠',
    preventSleepTitle: '防休眠：提词期间保持屏幕常亮',
    wakeOff: '关闭',
    wakeActive: '已生效',
    wakeFailed: '未生效',
    wakePending: '开始提词后生效',
    retry: '重试',
    retryWakeTitle: '重试防休眠',
    endSession: '结束提词',
    startSession: '开始提词',
    switchLangTitle: '切换为英文界面 / Switch to English',

    floatingWindowTitle: '提词浮窗',
    centerWindow: '居中窗口',
    restoreWindowSize: '恢复浮窗尺寸',
    fillWorkspace: '铺满当前工作区',
    play: '播放',
    pause: '暂停',
    atEnd: '已到末尾',
    continueSentence: '继续本句',
    continueParagraph: '继续本段',
    prevUnit: (isPara) => (isPara ? '上一段' : '上一句'),
    nextUnit: (isPara) => (isPara ? '下一段' : '下一句'),
    prevUnitTitle: (isPara) => (isPara ? '上一段 (← / ↑)' : '上一句 (← / ↑)'),
    nextUnitTitle: (isPara) => (isPara ? '下一段 (→ / ↓)' : '下一句 (→ / ↓)'),
    resetToStart: '回到开头',
    unitLabel: (isPara) => (isPara ? '段' : '句'),
    fontSizeShort: '字号',
    lineWidthShort: '行宽',
    speedUnit: '点/秒',

    effectiveLineWidthLabel: (w) => `生效行宽 ${w}pt`,
    unreadableWarning: '当前可用阅读宽度不足两个全角字符，请放大窗口或调小禁区/字号',
    dragMarkerTitle: '拖动调整阅读标记位置',
    readingMarkerTitle: '阅读参考标记',
    markerBadge: '读',
    standLabel: '支杆',
    safetyPaddingLabel: (pt) => `安全留白 ${pt}pt`,
    phoneZoneLabel: '手机禁区',
    fixedInViewport: '视口内固定',

    editorTitle: '编辑提词文稿',
    scriptNameAria: '文稿名称',
    plainTextLabel: '纯文本 TXT',
    closeEditorAria: '关闭编辑器',
    editorPlaceholder:
      '在此粘贴或输入演讲稿。Markdown 模式支持 # 标题、**粗体**、*斜体* 与 --- 分隔线；纯文本模式按非空换行分段。',
    charUnit: '字',
    nonEmptyParagraphUnit: '个非空段',
    editorHint: '应用修改后保持暂停，未受影响的当前句保留阅读位置',
    restoreSampleScript: '恢复默认示例稿',
    cancelKeepPosition: '取消（保留原稿与位置）',
    applyChanges: '应用修改',
    untitledScript: '未命名文稿',

    settingsTitle: '排版、校准与会话设置',
    closeSettingsAria: '关闭设置面板',
    typographySectionTitle: '正文排版（各参数独立生效）',
    fontSizeLabel: '字号',
    lineSpacingLabel: '额外行距',
    targetLineWidthLabel: '正文期望行宽',
    actualWidthNote: (w) => `（实际 ${w}）`,
    scrollSpeedLabel: '连续滚动速度',
    textColorLabel: '文字颜色',
    bgColorLabel: '背景颜色',
    windowOpacityLabel: '窗口透明度',
    colorWarmWhite: '暖白',
    colorPureWhite: '纯白',
    colorAmber: '护眼琥珀',
    colorSoftGreen: '柔绿',
    colorCharcoal: '深炭黑',
    colorPureBlack: '纯黑',
    colorSlate: '深石板',
    calibrationSectionTitle: '手机、支杆与阅读标记',
    centerPhoneReset: '手机居中复位',
    phoneAxisLabel: (axis) => `手机 ${axis}`,
    standAxisLabel: (axis) => `支杆 ${axis}`,
    axisW: '宽',
    axisH: '高',
    standAvoidanceLabel: '支杆避让',
    standAvoidanceDesc: '开启后以手机与支杆并集避让（含 12pt 留白）',
    enabledLabel: '已开启',
    disabledLabel: '已关闭',
    showMarkerLabel: '显示阅读标记',
    horizontalGuide: '水平参考线',
    verticalGuide: '垂直参考线',
    visibleLabel: '显示中',
    hiddenLabel: '已隐藏',
    sessionPowerSectionTitle: '会话防休眠与本地存储',
    preventSleepDesc: '仅在“提词中”持有唤醒锁，暂停或后台时保持，结束时释放',
    wakeFailedPrefix: '未生效：',
    wakeRequestFailedFallback: '唤醒请求失败',
    simulateFocusLoss: '模拟失焦/锁屏恢复',
    cancelSimulateFailure: '取消模拟失败',
    simulateWakeFailure: '模拟防休眠失败',
    clearRecentScript: '清除最近文稿并恢复默认状态',

    dropFilePrompt: '松开以导入 UTF-8 文稿（.txt / .md）',
    noticeViewportRecovered: '检测到窗口位置超出当前屏幕，已自动移回可见区域，建议重新校准手机位置',
    noticeWorkspaceResized: '工作区尺寸变化，窗口已移回可见范围并暂停',
    noticeInsufficientWidth: '剩余可读宽度不足两个全角字符，已拒绝本次调整并保留上一组有效值',
    noticeAtEnd: '已到达文稿末尾，请点击“回到开头”重新开始',
    noticeSessionEnded: '已结束本次提词会话，防休眠已释放',
    noticeImportInvalidType: '导入失败：仅支持 UTF-8 编码的 .txt 与 .md 文稿文件（已保留原稿）',
    noticeImportTooLarge: '导入失败：文件超过 2MB 限制（已保留原稿）',
    noticeImportEmpty: '导入失败：文件内容为空（已保留原稿与阅读位置）',
    noticeImportSuccessActive: (name) => `已载入“${name}”并定位至开头（保持当前会话与暂停状态）`,
    noticeImportSuccessIdle: (name) => `已载入“${name}”并进入暂停预览`,
    noticeImportBadUtf8: '导入失败：文件不是有效的 UTF-8 文本，已保留原稿与位置',
    noticePhoneMinMargin: '已触及手机禁区最小边距限制',
    noticeEditAppliedMatched: '文稿已更新，当前阅读句位置已保留（保持暂停）',
    noticeEditEmpty: '文稿内容为空，已定位到开头',
    noticeEditFallbackPara: '当前句已变更或删除，已定位至最近保留段落开头（保持暂停）',
    noticeEditFallbackStart: '文稿结构变化较大，已定位至文稿开头（保持暂停）',
    noticeSimulatedFocusRecovery: '已模拟系统休眠/失焦恢复：滚动已暂停，时钟已重置，防休眠状态已核对',
    noticeClearedRecent: '已清除最近文稿并恢复默认初始设置',
    wakeErrorSimulated: '模拟系统电源策略限制，请点击重试',
    wakeErrorUnsupported: '当前浏览器环境不支持 Screen Wake Lock API',
    wakeErrorDenied: (msg) => `请求被拒绝（${msg}）`,

    elapsedTimerTitle: '录制计时',
    timerStatusIdle: '待命 · 首行滚动起算',
    timerStatusRunning: '计时中 · 暂停不停表',
    timerStatusStopped: '已定格 · 本场用时',
    timerPauseProofHint: '按空格暂停不停止计时',
    timerResetBtn: '重置',
    timerResetTitle: '重置计时器归零',
    estimatedTimeTitle: '预估剩余',
    estimatedScrollOnly: '仅连续滚动预估',
    estimatedScrollOnlySub: '逐句 / 逐段模式不计时预估',
    estimatedAtSpeed: (speed) => `按 ${speed} 点/秒`,
    estimatedRemainingLines: (lines) => `剩 ${lines} 行`,
    estimatedAtEnd: '已到达末尾',
    estimatedUnreadable: '可用区不足',
  },

  en: {
    appName: 'Wrap Teleprompter',
    defaultFileName: 'sample-wrap-script.md',
    sessionIdle: 'Not Started',
    sessionEnded: 'Ended',
    sessionPlaying: 'Live · Playing',
    sessionAtEnd: 'Live · End of Script',
    sessionPaused: 'Live · Paused',
    importScript: 'Import',
    importTitle: 'Import UTF-8 .txt or .md script',
    editScript: 'Edit Script',
    editTitle: 'Paste or edit script (auto-pauses when opened)',
    readingModeAria: 'Reading Mode',
    modeContinuous: 'Scroll',
    modeSentence: 'Sentence',
    modeParagraph: 'Paragraph',
    lockLayout: 'Lock Layout',
    adjustLayout: 'Calibrate',
    lockLayoutTitle: 'Lock phone, stand, and reading marker positions',
    adjustLayoutTitle: 'Calibrate phone, stand, and reading marker positions',
    layoutSettings: 'Settings',
    preventSleep: 'Keep Awake',
    preventSleepTitle: 'Keep Awake: prevent display sleep during active session',
    wakeOff: 'Off',
    wakeActive: 'Active',
    wakeFailed: 'Failed',
    wakePending: 'On Session',
    retry: 'Retry',
    retryWakeTitle: 'Retry Wake Lock',
    endSession: 'End Session',
    startSession: 'Start Session',
    switchLangTitle: '切换为中文界面 / Switch to Chinese',

    floatingWindowTitle: 'Teleprompter',
    centerWindow: 'Center',
    restoreWindowSize: 'Restore Window Size',
    fillWorkspace: 'Fill Workspace',
    play: 'Play',
    pause: 'Pause',
    atEnd: 'At End',
    continueSentence: 'Continue Sentence',
    continueParagraph: 'Continue Paragraph',
    prevUnit: (isPara) => (isPara ? 'Prev Para' : 'Prev Sent'),
    nextUnit: (isPara) => (isPara ? 'Next Para' : 'Next Sent'),
    prevUnitTitle: (isPara) => (isPara ? 'Previous Paragraph (← / ↑)' : 'Previous Sentence (← / ↑)'),
    nextUnitTitle: (isPara) => (isPara ? 'Next Paragraph (→ / ↓)' : 'Next Sentence (→ / ↓)'),
    resetToStart: 'To Start',
    unitLabel: (isPara) => (isPara ? 'Para' : 'Sent'),
    fontSizeShort: 'Size',
    lineWidthShort: 'Width',
    speedUnit: 'pt/s',

    effectiveLineWidthLabel: (w) => `Active Width ${w}pt`,
    unreadableWarning:
      'Remaining readable width is narrower than 2 full-width characters. Enlarge window or reduce phone zone/font size.',
    dragMarkerTitle: 'Drag to reposition reading marker',
    readingMarkerTitle: 'Reading Reference Marker',
    markerBadge: 'READ',
    standLabel: 'Stand',
    safetyPaddingLabel: (pt) => `Margin ${pt}pt`,
    phoneZoneLabel: 'Phone Zone',
    fixedInViewport: 'Viewport Fixed',

    editorTitle: 'Edit Teleprompter Script',
    scriptNameAria: 'Script title',
    plainTextLabel: 'Plain Text',
    closeEditorAria: 'Close editor',
    editorPlaceholder:
      'Paste or type your script here. Markdown supports # Headings, **bold**, *italic*, and --- dividers; Plain Text splits paragraphs by non-empty lines.',
    charUnit: 'chars',
    nonEmptyParagraphUnit: 'paragraphs',
    editorHint: 'Applying edits keeps playback paused and preserves unaffected sentence position',
    restoreSampleScript: 'Restore Sample Script',
    cancelKeepPosition: 'Cancel (Keep Original)',
    applyChanges: 'Apply Changes',
    untitledScript: 'Untitled Script',

    settingsTitle: 'Typography, Calibration & Session',
    closeSettingsAria: 'Close settings',
    typographySectionTitle: 'Typography (Independent Parameters)',
    fontSizeLabel: 'Font Size',
    lineSpacingLabel: 'Extra Line Spacing',
    targetLineWidthLabel: 'Target Line Width',
    actualWidthNote: (w) => ` (actual ${w})`,
    scrollSpeedLabel: 'Scroll Speed',
    textColorLabel: 'Text Color',
    bgColorLabel: 'Background',
    windowOpacityLabel: 'Window Opacity',
    colorWarmWhite: 'Warm White',
    colorPureWhite: 'Pure White',
    colorAmber: 'Soft Amber',
    colorSoftGreen: 'Mint',
    colorCharcoal: 'Charcoal',
    colorPureBlack: 'Pitch Black',
    colorSlate: 'Deep Slate',
    calibrationSectionTitle: 'Phone, Stand & Reading Marker',
    centerPhoneReset: 'Center Phone',
    phoneAxisLabel: (axis) => `Phone ${axis}`,
    standAxisLabel: (axis) => `Stand ${axis}`,
    axisW: 'W',
    axisH: 'H',
    standAvoidanceLabel: 'Stand Avoidance',
    standAvoidanceDesc: 'Excludes union of phone + stand (with 12pt safety margin)',
    enabledLabel: 'Enabled',
    disabledLabel: 'Disabled',
    showMarkerLabel: 'Reading Marker',
    horizontalGuide: 'Horizontal Line',
    verticalGuide: 'Vertical Line',
    visibleLabel: 'Visible',
    hiddenLabel: 'Hidden',
    sessionPowerSectionTitle: 'Session Wake Lock & Local Storage',
    preventSleepDesc: 'Held only during active session; retained when paused/backgrounded and released on end',
    wakeFailedPrefix: 'Inactive: ',
    wakeRequestFailedFallback: 'Wake Lock request failed',
    simulateFocusLoss: 'Simulate Focus Recovery',
    cancelSimulateFailure: 'Clear Simulated Failure',
    simulateWakeFailure: 'Simulate Wake Failure',
    clearRecentScript: 'Clear Recent Script & Reset Defaults',

    dropFilePrompt: 'Drop to import UTF-8 script (.txt / .md)',
    noticeViewportRecovered:
      'Window moved off-screen and was restored into view. Please recalibrate phone position.',
    noticeWorkspaceResized: 'Workspace resized; window repositioned into view and paused',
    noticeInsufficientWidth:
      'Readable width under 2 full-width chars; adjustment rejected and previous values kept',
    noticeAtEnd: 'Reached end of script. Click "To Start" to reset.',
    noticeSessionEnded: 'Teleprompter session ended and Wake Lock released',
    noticeImportInvalidType: 'Import failed: only UTF-8 .txt and .md files are supported (original kept)',
    noticeImportTooLarge: 'Import failed: file exceeds 2MB limit (original kept)',
    noticeImportEmpty: 'Import failed: file is empty (original script & position kept)',
    noticeImportSuccessActive: (name) => `Loaded "${name}" at start (session kept active & paused)`,
    noticeImportSuccessIdle: (name) => `Loaded "${name}" in paused preview`,
    noticeImportBadUtf8: 'Import failed: invalid UTF-8 text (original script & position kept)',
    noticePhoneMinMargin: 'Reached minimum margin around Phone Zone',
    noticeEditAppliedMatched: 'Script updated; current sentence position preserved (paused)',
    noticeEditEmpty: 'Script is empty; positioned at start',
    noticeEditFallbackPara: 'Current sentence modified or removed; jumped to nearest preserved paragraph (paused)',
    noticeEditFallbackStart: 'Major script edits detected; positioned at start (paused)',
    noticeSimulatedFocusRecovery:
      'Simulated sleep/focus recovery: scrolling paused, timer reset, Wake Lock verified',
    noticeClearedRecent: 'Cleared recent script and restored default settings',
    wakeErrorSimulated: 'Simulated system power policy restriction — click Retry',
    wakeErrorUnsupported: 'Screen Wake Lock API is not supported in this browser',
    wakeErrorDenied: (msg) => `Request denied (${msg})`,

    elapsedTimerTitle: 'Recording Timer',
    timerStatusIdle: 'Ready · Starts on scroll',
    timerStatusRunning: 'Running · Keeps through pause',
    timerStatusStopped: 'Stopped · Total duration',
    timerPauseProofHint: 'Space pause does not stop timer',
    timerResetBtn: 'Reset',
    timerResetTitle: 'Reset elapsed timer to 00:00',
    estimatedTimeTitle: 'Est. Remaining',
    estimatedScrollOnly: 'Scroll mode only',
    estimatedScrollOnlySub: 'Disabled in Sentence / Paragraph mode',
    estimatedAtSpeed: (speed) => `At ${speed} pt/s`,
    estimatedRemainingLines: (lines) => `${lines} lines left`,
    estimatedAtEnd: 'At end of script',
    estimatedUnreadable: 'No readable space',
  },
};
