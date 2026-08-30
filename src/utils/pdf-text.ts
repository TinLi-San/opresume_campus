/**
 * PDF 文本层 → 结构化文本（纯函数，零依赖，浏览器与 Node 测试共用）
 *
 * 目标：修复旧实现「所有文本项用空格拼接」导致的结构丢失——
 * 段落/标题/条目边界被抹平，AI 无法分辨章节与条目。新版按视觉行重建：
 * - 同一条基线上的文本项合并为一行（CJK 相邻不加空格，避免拆散中文词）；
 * - 竖向位移或 pdfjs 的 hasEOL 标记触发换行；
 * - 保留段落间的空行，便于 AI 识别章节边界。
 */

export interface TextItemLike {
  /** 文本内容（带 type 的 marked-content 项无 str，会被跳过） */
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
  /** pdfjs 富标记类型（TextMarkedContent 共用 type 字段以通过结构检查） */
  type?: string;
}

/** CJK 字符判断（中日韩统一表意文字/假名/谚文） */
export function isCjkChar(ch: string): boolean {
  return /[\u2e80-\u2eff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/.test(ch);
}

/** 同一条基线（同一视觉行）上的两个文本块拼接：相邻 CJK 不加空格 */
function joinRuns(prev: string, cur: string): string {
  const p = prev.trimEnd();
  const c = cur.trimStart();
  if (!p) return c;
  if (!c) return p;
  const a = p[p.length - 1];
  const b = c[0];
  return isCjkChar(a) && isCjkChar(b) ? p + c : `${p} ${c}`;
}

/**
 * 将一个页面的文本层 items 重建为按行组织的文本。
 * @param items pdfjs page.getTextContent() 返回的 items
 */
export function pageItemsToText(items: TextItemLike[]): string {
  return structuredLinesToText(pageItemsToStructuredLines(items));
}

/**
 * 规范化整份简历文本：
 * - 去掉行首尾空白；
 * - 连续空行折叠为单个空行；
 * - 去除纯空白行。
 */
export function normalizeText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 过滤私用区字符（U+E000–U+F8FF 与补充私用区 Plane 15/16）。
 * 模板/导出器的图标字体（如 DHU 模板里的    等）会把图标映射到私用区码点，
 * 这类字符没有任何 Unicode 语义，混进正文只会让 AI 识别时产生噪声。
 */
export function stripPrivateUseGlyphs(text: string): string {
  return text.replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, '');
}

/**
 * 拆分「同一物理行里被折行合并的编号列表」：
 * 如 "- 1. 整合市场调研…； 2. 针对 xx 场景…； 3. 协作组员…" 拆为
 * "- 1. 整合市场调研…" / "2. 针对 xx 场景…" / "3. 协作组员…"。
 *
 * 拆分行内所有 "；N." / ";N." 标记（N 为 1~2 位数字，避免误伤日期如 "；2023.06"），
 * 但只在文本中确实存在「以编号开头（可带 -/• 前缀）的行」时才启用，
 * 避免普通句子里的 "；2." 被误拆。跨物理行的折行编号（"；N." 落在续行）也能处理。
 */
export function splitNumberedRuns(text: string): string {
  const lines = text.split(/\r?\n/);
  const hasListLine = lines.some((l) => /^\s*(?:[-•*·]\s*)?\d{1,2}[.、]/.test(l));
  if (!hasListLine) return text;
  return lines.map((line) => line.replace(/[；;]\s*(?=\d{1,2}[.、])/g, '\n')).join('\n');
}

/**
 * 提取文本的整体清理（P0 后处理）：
 * 过滤图标私用区字符 → 拆分折行编号列表 → 再规范化空白。
 */
export function cleanExtractedText(text: string): string {
  return normalizeText(splitNumberedRuns(stripPrivateUseGlyphs(text)));
}

/* ------------------------------------------------------------------ */
/*  结构化行（P1 改进：块级中间表示 + 阅读顺序）                        */
/* ------------------------------------------------------------------ */

/** 一条视觉行：重建后的文本 + 行内最左 x / 基线 y（pdfjs 文本坐标，y 向上） */
export interface StructuredLine {
  text: string;
  x0: number;
  y0: number;
}

/**
 * 将一页文本层 items 重建为带坐标的结构化行（与 pageItemsToText 同一分组逻辑），
 * 供阅读顺序排序 / 双栏聚类 / 块级 JSON 使用。
 */
export function pageItemsToStructuredLines(items: TextItemLike[]): StructuredLine[] {
  const lines: StructuredLine[] = [];
  let line = '';
  let lineX = 0;
  let lineY: number | null = null;
  let lastY: number | null = null;

  const flush = () => {
    if (line.trim()) {
      lines.push({ text: line.trimEnd(), x0: lineX, y0: lineY ?? 0 });
    }
    line = '';
    lineX = 0;
    lineY = null;
    lastY = null;
  };

  for (const item of items) {
    if (typeof item.str !== 'string' || item.str.length === 0) continue;
    const y = item.transform?.[5];
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) >= 2) flush();
    if (!line) lineX = Math.round(item.transform?.[4] ?? 0);
    line = line ? joinRuns(line, item.str) : item.str;
    lastY = y ?? lastY;
    lineY = y ?? lineY;
    if (item.hasEOL) flush();
  }
  flush();
  return lines;
}

/**
 * 双栏检测 + 阅读顺序排序：
 * - 按行起始 x0 做一维聚类成「栏带」；只有出现 ≥2 个各自 ≥2 行的栏带（跨距足够大）才算双栏；
 * - 双栏版式按「先左栏后右栏、栏内自上而下」排序，单栏按 y 降序（页面上方在前）。
 *
 * @returns 重排后的行、每行的栏号（0=左/1=右，单栏恒 0）、栏数
 */
export function sortLinesInReadingOrder(
  lines: StructuredLine[],
  pageWidth: number,
): { lines: StructuredLine[]; column: number[]; count: number } {
  if (lines.length === 0) return { lines, column: [], count: 1 };
  if (pageWidth <= 0) {
    const sorted = [...lines].sort((a, b) => b.y0 - a.y0);
    return { lines: sorted, column: sorted.map(() => 0), count: 1 };
  }

  // 1-D 聚类栏带：x0 间隙超过阈值即开新带
  const gapThreshold = Math.max(24, pageWidth * 0.12);
  const bands: Array<{ min: number; max: number; lines: number }> = [];
  const xs = [...new Set(lines.map((l) => Math.round(l.x0)))].sort((a, b) => a - b);
  for (const x of xs) {
    const last = bands[bands.length - 1];
    if (last && x - last.max <= gapThreshold) {
      last.max = Math.max(last.max, x);
    } else {
      bands.push({ min: x, max: x, lines: 0 });
    }
  }
  for (const l of lines) {
    const band = bands.find((b) => l.x0 >= b.min && l.x0 <= b.max) ?? bands[0];
    band.lines += 1;
  }

  const twoColumn =
    bands.length >= 2 &&
    bands.every((b) => b.lines >= 2) &&
    bands[bands.length - 1].min - bands[0].max > pageWidth * 0.25;

  const columnOf = (x0: number): number => {
    if (!twoColumn) return 0;
    const mid = (bands[bands.length - 1].min + bands[0].max) / 2;
    return x0 >= mid ? 1 : 0;
  };

  const indexed = lines.map((l, i) => ({ l, i }));
  if (twoColumn) {
    // 先左栏（列 0）后右栏（列 1），栏内 y 降序；同 y 按 x 升序
    indexed.sort((a, b) => {
      const ca = columnOf(a.l.x0);
      const cb = columnOf(b.l.x0);
      if (ca !== cb) return ca - cb;
      if (b.l.y0 !== a.l.y0) return b.l.y0 - a.l.y0;
      return a.l.x0 - b.l.x0;
    });
  } else {
    indexed.sort((a, b) => {
      if (b.l.y0 !== a.l.y0) return b.l.y0 - a.l.y0;
      return a.l.x0 - b.l.x0;
    });
  }

  return {
    lines: indexed.map((e) => e.l),
    column: indexed.map((e) => columnOf(e.l.x0)),
    count: twoColumn ? 2 : 1,
  };
}

/**
 * 按给定顺序把结构化行渲染为纯文本；双栏时给右栏行加 `[右]` 前缀、
 * 左栏行加 `[左]` 前缀，帮助模型感知栏目归属。
 */
export function structuredLinesToText(
  lines: StructuredLine[],
  opts?: { column?: number[]; count?: number },
): string {
  const count = opts?.count ?? 1;
  return lines
    .map((l, i) => {
      if (count > 1 && opts?.column) {
        return `${opts.column[i] === 1 ? '[右]' : '[左]'} ${l.text}`;
      }
      return l.text;
    })
    .join('\n');
}

/**
 * 为 AI 调用裁剪超长文本：保留头部与尾部（头 60% + 尾 40% 预算），
 * 避免「长简历只截头部、末尾的获奖/技能全丢」。
 */
export function capTextForAI(text: string, maxChars = 40_000): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  const head = Math.floor(maxChars * 0.6);
  const tail = maxChars - head - 32; // 预留省略标记空间
  return `${t.slice(0, head)}\n\n…（原文过长，中间部分已省略，以下为原文尾部）…\n\n${t.slice(t.length - tail)}`;
}