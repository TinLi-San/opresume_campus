/**
 * lib-export-product.mjs — 产品无头导出库：把映射后的 JsonResume 注入 opresume 编辑器，
 * 选择指定产品模板（template1..7）并导出 A4 PDF + 全页 PNG + DOM 验证。
 * 必须在 DSH run_code worker 上下文调用（playwright spawn 限制）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url + '.js');
const { chromium } = req('playwright-core');

const wsTmp = path.resolve(here, '../test-data/tmp');

export async function exportProductResume({ config, template, baseUrl = 'http://127.0.0.1:4173/editor', expectedName, expectText = [], forbidText = [], pdf, png, waitMs = 2500, metrics = false }) {
  fs.mkdirSync(wsTmp, { recursive: true });
  process.env.TEMP = wsTmp; process.env.TMP = wsTmp; process.env.TMPDIR = wsTmp;
  const EDGE = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => fs.existsSync(p));
  if (!EDGE) throw new Error('no Edge found');

  const ui = {
    version: 0,
    state: {
      template,
      privacyMode: false,
      showIcons: true,
      lang: 'zh-CN',
      theme: { color: '#A9021F', tagColor: '#A9021F' },
    },
  };

  const browser = await chromium.launch({ executablePath: EDGE, headless: true, timeout: 60000 });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
    const problems = [];
    page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 240)); });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(([cfg, uiStr]) => {
      localStorage.setItem('opresume-config', JSON.stringify(cfg));
      localStorage.setItem('opresume_ui', uiStr);
    }, [config, JSON.stringify(ui)]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(waitMs);
    await page.evaluate(() => document.fonts?.ready?.catch(() => {}));
    await page.waitForTimeout(800);

    const result = { problems };
    const domCheck = await page.evaluate(([name, texts, forbids]) => {
      const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
      const root = document.querySelector('[data-resume-page], .resume-page, .campus-resume, .resume');
      return {
        nameFound: !name || txt.includes(name),
        // 内容级断言：期望文本必须出现在导出页；禁止文本（如编造的 2023-01 月份）不得出现
        missingTexts: texts.filter((s) => !txt.includes(s)),
        forbiddenFound: forbids.filter((s) => txt.includes(s)),
        bodyTextLen: txt.length,
        textHead: txt.slice(0, 120),
        rootClass: root ? root.className.slice(0, 60) : null,
        rootDataTemplate: root ? root.getAttribute('data-template') : null,
      };
    }, [expectedName, expectText, forbidText]);
    result.dom = domCheck;
    if (!domCheck.nameFound || domCheck.missingTexts?.length || domCheck.forbiddenFound?.length) {
      // 等待更久再试一次（字体/懒加载）
      await page.waitForTimeout(3000);
      const domCheck2 = await page.evaluate(([name, texts, forbids]) => {
        const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
        return {
          nameFound: !name || txt.includes(name),
          missingTexts: texts.filter((s) => !txt.includes(s)),
          forbiddenFound: forbids.filter((s) => txt.includes(s)),
          textHead: txt.slice(0, 120),
        };
      }, [expectedName, expectText, forbidText]);
      result.dom = { ...domCheck, ...domCheck2 };
    }
    if (metrics) {
      result.metrics = await page.evaluate(() => {
        const q = document.querySelector('.page, [data-resume-page], .resume-page, .campus-resume, .resume');
        const r = q ? q.getBoundingClientRect() : null;
        const w = r ? r.width : document.documentElement.clientWidth;
        const px2mm = 210 / (w || 794);
        const els = [...document.querySelectorAll('[data-resume-section],[data-resume-entry],[data-resume-body],[data-resume-page],.campus-resume > *')];
        const rects = els.map((el) => {
          const rr = el.getBoundingClientRect();
          return { tag: el.dataset?.resumeSection || el.dataset?.resumeEntry || el.dataset?.resumeBody || el.className?.toString().slice(0, 40) || 'x', top: +(rr.top * px2mm).toFixed(1), bottom: +(rr.bottom * px2mm).toFixed(1), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) };
        });
        const maxBottom = Math.max(0, ...rects.map((x) => x.bottom));
        return { maxBottom, whitespacePct: +((1 - maxBottom / 297) * 100).toFixed(1), rectCount: rects.length };
      });
    }
    if (pdf) {
      fs.mkdirSync(path.dirname(path.resolve(pdf)), { recursive: true });
      await page.emulateMedia({ media: 'print' });
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