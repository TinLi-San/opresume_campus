/**
 * integrate-reviews.mjs — 读取 test-data/review/<id>/review.md，抽取评分与严重级问题，
 * 生成 _reviews-summary.json 供报告 §4 使用。
 * 用法：node scripts/integrate-reviews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const reviewRoot = path.resolve(here, '../test-data/review');
const out = [];
for (const d of fs.readdirSync(reviewRoot)) {
  const rm = path.join(reviewRoot, d, 'review.md');
  if (!fs.existsSync(rm)) continue;
  const text = fs.readFileSync(rm, 'utf-8');
  if (text.startsWith('# 评审失败')) { out.push({ id: d, failed: true, note: text.replace(/\s+/g, ' ').slice(0, 200) }); continue; }
  const scoreA = (text.match(/内容完整性[^0-9]{0,6}(\d+(?:\.\d+)?)/) || [])[1];
  const scoreB = (text.match(/版式结构[^0-9]{0,6}(\d+(?:\.\d+)?)/) || [])[1];
  const p0 = (text.match(/\bP0\b/g) || []).length;
  const p1 = (text.match(/\bP1\b/g) || []).length;
  const p2 = (text.match(/\bP2\b/g) || []).length;
  // 简化内容：取若干关键行（评分行 + 缺失/走样关键词出现次数）
  const missingHits = (text.match(/缺失|丢失|遗漏|未保留/g) || []).length;
  const layoutHits = (text.match(/溢出|截断|重叠|留白|错位/g) || []).length;
  out.push({ id: d, failed: false, scoreA: scoreA ? Number(scoreA) : null, scoreB: scoreB ? Number(scoreB) : null, p0, p1, p2, missingHits, layoutHits, len: text.length });
}
const sumPath = path.resolve(here, '../test-data/out/_reviews-summary.json');
fs.writeFileSync(sumPath, JSON.stringify(out, null, 2));
console.log('summary -> ' + sumPath);
for (const o of out) console.log(JSON.stringify(o));
