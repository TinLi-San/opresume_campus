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
  const lines: string[] = [];
  let line = '';
  let lastY: number | null = null;

  const flush = () => {
    if (line.trim()) lines.push(line.trimEnd());
    line = '';
    lastY = null;
  };

  for (const item of items) {
    if (typeof item.str !== 'string' || item.str.length === 0) continue;
    const y = item.transform?.[5];
    // 竖向位移超过阈值 → 换行（兼容 hasEOL 缺失的 PDF）
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) >= 2) flush();
    line = line ? joinRuns(line, item.str) : item.str;
    lastY = y ?? lastY;
    if (item.hasEOL) flush();
  }
  flush();
  return lines.join('\n');
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