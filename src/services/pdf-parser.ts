import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import i18n from '@/i18n';
import { pageItemsToText, normalizeText, capTextForAI } from '@/utils/pdf-text';

// 使用 Vite 的 ?url 后缀直接引入本地 Worker 文件，
// 避免 CDN 版本不匹配或网络加载失败
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 从 PDF 文件中提取结构化文本
 *
 * 相比旧版「所有文本项用空格拼接」，新版按视觉行重建文本：
 * - 同基线文本项合并为一行，段落/标题/条目边界得以保留；
 * - 连续空行折叠，章节之间保持空行分隔；
 * - 超长文本保留头部+尾部，避免 AI 截断丢失末尾章节。
 *
 * @param file PDF 文件对象
 * @returns 提取的文本内容
 * @throws 如果 PDF 解析失败或文本量过少（可能为扫描件/纯图片 PDF）
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // 1. 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 2. 加载 PDF 文档
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // 3. 逐页提取文本层并重建行结构
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    pageTexts.push(pageItemsToText(textContent.items));
  }

  // 4. 合并所有页面的文本（页间以一个空行分隔）
  const fullText = normalizeText(pageTexts.join('\n\n'));

  // 5. 验证提取的文本是否有效（扫描件/纯图片 PDF 会在此被拒绝）
  if (!fullText || fullText.trim().length < 50) {
    throw new Error(i18n.t('importPDF.errorInsufficientText'));
  }

  // 6. 超长文本裁剪（保留头部与尾部）
  return capTextForAI(fullText);
}