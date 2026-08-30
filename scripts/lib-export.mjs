/**
 * lib-export.mjs — Playwright(Edge) 无头导出库：HTML/URL → A4 PDF + 全页 PNG + 布局几何度量
 * 必须在 DSH run_code worker（非 pwsh→node）上下文调用，否则 spawn EPERM。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url + '.js');
const { chromium } = req('playwright-core');

const wsTmp = path.resolve(here, '../test-data/tmp');

export async function exportHtml({ html, url, pdf, png, waitMs = 600, viewport = '1500x1100', fontWait = true, metrics = false }) {
  fs.mkdirSync(wsTmp, { recursive: true });
  process.env.TEMP = wsTmp; process.env.TMP = wsTmp; process.env.TMPDIR = wsTmp;
  const EDGE = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => fs.existsSync(p));
  if (!EDGE) throw new Error('no Edge found');
  const [vw, vh] = viewport.split('x').map(Number);
  const target = url || ('file:///' + path.resolve(html).replace(/\\/g, '/').replace(/ /g, '%20'));
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, timeout: 60000 });
  try {
    const page = await browser.newPage({ viewport: { width: vw, height: vh } });
    const problems = [];
    page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 200)); });
    await page.goto(target, { waitUntil: 'load', timeout: 60000 });
    if (fontWait) { await page.evaluate(() => document.fonts?.ready?.catch(() => {})); }
    if (waitMs > 0) await page.waitForTimeout(waitMs);
    const result = { problems };
    if (metrics) {
      result.metrics = await page.evaluate(() => {
        const pageEl = document.querySelector('.page, [data-resume-page]');
        const px2mm = 210 / (pageEl ? pageEl.getBoundingClientRect().width : 794);
        const els = [...document.querySelectorAll('[data-resume-section],[data-resume-entry],[data-resume-body],[data-resume-page]')];
        const rects = els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.dataset.resumeSection || el.dataset.resumeEntry || el.dataset.resumeBody || 'page',
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
            top: +(r.top * px2mm).toFixed(1),
            bottom: +(r.bottom * px2mm).toFixed(1),
            left: +(r.left * px2mm).toFixed(1),
            right: +(r.right * px2mm).toFixed(1),
          };
        });
        const pageHmm = 297;
        const bodyRects = rects.filter((r) => r.tag !== 'page');
        const maxBottom = Math.max(0, ...bodyRects.map((r) => r.bottom));
        // 重叠检测：同列区域相交且垂直重叠 > 1mm
        const overlaps = [];
        for (let i = 0; i < bodyRects.length; i++) {
          for (let j = i + 1; j < bodyRects.length; j++) {
            const a = bodyRects[i], b = bodyRects[j];
            const overV = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            const overH = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            if (overV > 1 && overH > 20) {
              overlaps.push({ a: a.text.slice(0, 30), b: b.text.slice(0, 30), overV: +overV.toFixed(1) });
            }
          }
        }
        const clipped = bodyRects.filter((r) => r.bottom > pageHmm + 1).map((r) => r.text.slice(0, 40));
        return {
          pagePx: document.documentElement.clientWidth,
          rects,
          bodyCount: bodyRects.length,
          maxBottom,
          whitespacePct: +((1 - maxBottom / pageHmm) * 100).toFixed(1),
          overlaps,
          clipped,
        };
      });
    }
    if (pdf) {
      fs.mkdirSync(path.dirname(path.resolve(pdf)), { recursive: true });
      await page.pdf({ path: path.resolve(pdf), format: 'A4', printBackground: true, preferCSSPageSize: true });
      result.pdfBytes = fs.statSync(path.resolve(pdf)).size;
    }
    if (png) {
      fs.mkdirSync(path.dirname(path.resolve(png)), { recursive: true });
      await page.screenshot({ path: path.resolve(png), fullPage: true });
      result.pngBytes = fs.statSync(path.resolve(png)).size;
    }
    return result;
  } finally {
    await browser.close();
  }
}