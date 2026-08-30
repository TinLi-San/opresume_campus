/**
 * export-html-pdf.mjs — 通用 HTML→PDF+PNG 无头导出工具（playwright-core + Edge）
 * 规避沙箱下 Edge CLI（mojo 管道）与 esbuild spawn 的限制：playwright 走 TCP 远程调试。
 *
 * 用法：node export-html-pdf.mjs --html <文件路径或URL> --pdf <out.pdf> --png <out.png> [--wait <ms>] [--viewport 1500x1100]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url + '.js');
const { chromium } = req('playwright-core');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined; };
const has = (flag) => args.includes(flag);

const html = get('--html');
const pdfOut = get('--pdf');
const pngOut = get('--png');
const waitMs = Number(get('--wait') || 0);
const [vw, vh] = (get('--viewport') || '1500x1100').split('x').map(Number);

if (!html || (!pdfOut && !pngOut)) {
  console.error('usage: export-html-pdf.mjs --html <file|url> --pdf out.pdf --png out.png [--wait ms]');
  process.exit(2);
}

// 沙箱内 TEMP 必须指向工作区可写目录
const wsTmp = path.resolve(__dirname, '../test-data/tmp');
fs.mkdirSync(wsTmp, { recursive: true });
process.env.TEMP = wsTmp;
process.env.TMP = wsTmp;
process.env.TMPDIR = wsTmp;

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => fs.existsSync(p));
if (!EDGE) { console.error('no Edge found'); process.exit(2); }

const isUrl = /^https?:\/\//.test(html) || /^file:\/\//.test(html);
const target = isUrl ? html : 'file:///' + path.resolve(html).replace(/\\/g, '/').replace(/ /g, '%20');

const browser = await chromium.launch({ executablePath: EDGE, headless: true, timeout: 60000 });
try {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  await page.goto(target, { waitUntil: 'load', timeout: 60000 });
  if (waitMs > 0) await page.waitForTimeout(waitMs);
  await page.evaluate(() => document.fonts?.ready?.catch(() => {}));
  if (waitMs > 0) await page.waitForTimeout(waitMs);
  if (pdfOut) {
    fs.mkdirSync(path.dirname(path.resolve(pdfOut)), { recursive: true });
    await page.pdf({ path: path.resolve(pdfOut), format: 'A4', printBackground: true, preferCSSPageSize: true });
  }
  if (pngOut) {
    fs.mkdirSync(path.dirname(path.resolve(pngOut)), { recursive: true });
    await page.screenshot({ path: path.resolve(pngOut), fullPage: true });
  }
  console.log(JSON.stringify({ pdf: pdfOut ? fs.statSync(pdfOut).size : 0, png: pngOut ? fs.statSync(pngOut).size : 0, problems }));
} finally {
  await browser.close();
}
