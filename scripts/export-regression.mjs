/**
 * export-regression.mjs — 导出回归：把 AI 解析映射后的 JsonResume 注入产品模板
 * （template1..7 轮流），校验导出页包含岗位/GPA/课程/奖项等关键内容。
 * 必须在真实 Node 环境运行（playwright-core spawn 受限沙箱下不可用）。
 *
 * 用法：node scripts/export-regression.mjs [--smoke] [--base-url http://127.0.0.1:4173/editor]
 * 产物：test-data/export/<id>-<template>/{resume.pdf,page.png}, out/_10x-export-regression.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportProductResume } from './lib-export-product.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const OUT = path.join(root, 'test-data', 'out');
const EXPORT = path.join(root, 'test-data', 'export');

/** 指派计划：id → 导出模板 → 内容级断言（期望出现/禁止出现） */
const PLAN = [
  { id: '10x-01-backend-cn', template: 'template1', expectText: ['后端开发工程师', '3.6/4.0'], forbidText: [] },
  { id: '10x-02-visual-cn', template: 'template2', expectText: ['视觉设计师'], forbidText: [] },
  { id: '10x-03-sales-cn', template: 'template3', expectText: ['销售经理', '销售主管', '销售代表'], forbidText: [] },
  { id: '10x-04-teacher-cn', template: 'template4', expectText: ['语文教师'], forbidText: [] },
  { id: '10x-05-analyst-cn', template: 'template5', expectText: ['数据分析师', '3.7'], forbidText: [] },
  { id: '10x-06-media-cn', template: 'template6', expectText: ['新媒体运营', '内容运营实习生'], forbidText: [] },
  { id: '10x-07-mech-cn', template: 'template7', expectText: ['机械结构实习生', '机械设计', '材料力学', '3.5/5.0'], forbidText: [] },
  { id: '10x-08-pm-mixed', template: 'template1', expectText: ['产品经理'], forbidText: [] },
  { id: '10x-09-frontend-mixed', template: 'template2', expectText: ['前端工程师'], forbidText: ['2023-01'] },
  { id: '10x-10-audit-cn', template: 'template3', expectText: ['审计助理实习生', '3.8/4.0', '会计学原理', '审计学'], forbidText: [] },
];

const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const baseUrl = (() => {
  const i = args.indexOf('--base-url');
  return i >= 0 && i + 1 < args.length ? args[i + 1] : 'http://127.0.0.1:4173/editor';
})();

/** 默认样例（每模板首个 PLAN 行）：这些必须恰好一页 A4 */
const DEFAULT_SAMPLE_IDS = new Set();
{
  const seen = new Set();
  for (const p of PLAN) {
    if (!seen.has(p.template)) {
      seen.add(p.template);
      DEFAULT_SAMPLE_IDS.add(p.id);
    }
  }
}

/** 从生成的 PDF 文件解析页数（/Type /Pages ... /Count N） */
function pdfPageCount(pdfPath) {
  try {
    const text = fs.readFileSync(pdfPath).toString('latin1');
    const m = text.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

async function main() {
  const results = [];
  for (const p of PLAN) {
    const mappedPath = path.join(OUT, `${p.id}-opencode.mapped.json`);
    if (!fs.existsSync(mappedPath)) {
      results.push({ ...p, status: 'no-mapped', reason: 'mapped json missing' });
      console.log(`[SKIP] ${p.id} (no mapped json)`);
      continue;
    }
    const config = JSON.parse(fs.readFileSync(mappedPath, 'utf-8'));
    const dir = path.join(EXPORT, `${p.id}-${p.template}`);
    fs.mkdirSync(dir, { recursive: true });
    const pdfPath = smoke ? null : path.join(dir, 'resume.pdf');

    // smoke：不落 PDF/PNG（旧数据快速验证渲染）；正式回归落证据
    const res = await exportProductResume({
      config,
      template: p.template,
      baseUrl,
      expectedName: config.basics?.name,
      expectText: p.expectText,
      forbidText: p.forbidText,
      pdf: pdfPath,
      png: smoke ? null : path.join(dir, 'page.png'),
      metrics: true,
    });
    const missing = res.dom?.missingTexts ?? [];
    const forbidden = res.dom?.forbiddenFound ?? [];
    const pageCount = pdfPath ? pdfPageCount(pdfPath) : null;
    const isDefaultSample = DEFAULT_SAMPLE_IDS.has(p.id);
    const pageCountProblem = isDefaultSample && pageCount !== 1;
    const pass = !missing.length && !forbidden.length && !!res.dom?.nameFound && !pageCountProblem;
    results.push({
      id: p.id,
      template: p.template,
      expectedName: config.basics?.name,
      nameFound: res.dom?.nameFound ?? false,
      expectText: p.expectText,
      missingTexts: missing,
      forbidText: p.forbidText,
      forbiddenFound: forbidden,
      isDefaultSample,
      pageCount,
      pageCountProblem,
      pass,
      metrics: res.metrics ?? null,
      problems: res.problems?.length ?? 0,
    });
    console.log(
      `[${pass ? 'PASS' : 'FAIL'}] ${p.id} -> ${p.template} | name=${res.dom?.nameFound} | missing=${JSON.stringify(missing)} | forbidden=${JSON.stringify(forbidden)} | pageCount=${pageCount ?? '-'}${pageCountProblem ? ' (default-sample must be 1)' : ''} | whitespace=${res.metrics?.whitespacePct ?? '-'}%`,
    );
  }

  const reportPath = path.join(OUT, '_10x-export-regression.json');
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    smoke,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    pageCountProblems: results.filter((r) => r.pageCountProblem).length,
    results,
  };
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`\nreport: ${reportPath} (${summary.passed}/${summary.total} PASS)`);
  if (results.some((r) => r.pass === false)) process.exitCode = 1;
}

main().catch((e) => {
  console.error('export-regression crashed:', e);
  process.exitCode = 1;
});