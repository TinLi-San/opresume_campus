import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import i18n from '@/i18n';
import {
  pageItemsToStructuredLines,
  sortLinesInReadingOrder,
  structuredLinesToText,
  cleanExtractedText,
  capTextForAI,
} from '@/utils/pdf-text';

// 使用 Vite 的 ?url 后缀直接引入本地 Worker 文件，
// 避免 CDN 版本不匹配或网络加载失败
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 从 PDF 文件中提取结构化文本
 *
 * 相比旧版「所有文本项用空格拼接」，本实现按视觉行重建文本：
 * - 同基线文本项合并为一行，段落/标题/条目边界得以保留；
 * - 连续空行折叠，章节之间保持空行分隔；
 * - 双栏版式按「先左栏后右栏、栏内自上而下」的阅读顺序重排；
 * - 过滤图标字体私用区字符、拆分被折行合并的编号列表；
 * - 超长文本保留头部+尾部，避免 AI 截断丢失末尾章节。
 *
 * @param file PDF 文件对象
 * @returns 提取结果：{ text, twoColumn }，twoColumn 表示该 PDF 检测为双栏版式
 * @throws 如果 PDF 解析失败或文本量过少（可能为扫描件/纯图片 PDF）
 */
export interface ExtractedPDFText {
  text: string;
  /** 是否检测为双栏版式（已按阅读顺序重排） */
  twoColumn: boolean;
}

export async function extractTextFromPDF(file: File): Promise<ExtractedPDFText> {
  // 1. 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 2. 加载 PDF 文档
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // 3. 逐页提取文本层 → 结构化行 → 阅读顺序排序 → 重建文本
  const pageTexts: string[] = [];
  let twoColumn = false;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const lines = pageItemsToStructuredLines(textContent.items);
    const ordered = sortLinesInReadingOrder(lines, viewport.width);
    twoColumn = twoColumn || ordered.count > 1;
    pageTexts.push(structuredLinesToText(ordered.lines, { column: ordered.column, count: ordered.count }));
  }

  // 4. 合并所有页面的文本（页间以一个空行分隔）并做清理
  const fullText = cleanExtractedText(pageTexts.join('\n\n'));

  // 5. 验证提取的文本是否有效（扫描件/纯图片 PDF 会在此被拒绝）
  if (!fullText || fullText.trim().length < 50) {
    throw new Error(i18n.t('importPDF.errorInsufficientText'));
  }

  // 6. 超长文本裁剪（保留头部与尾部）
  return { text: capTextForAI(fullText), twoColumn };
}