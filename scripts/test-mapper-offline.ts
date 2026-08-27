/**
 * resume-mapper / resume-validate / pdf-text 的离线单元测试（无需 API key）
 *
 * 用法：
 *   node scripts/test-mapper-offline.ts
 *
 * 覆盖：
 * - 日期与区间解析（中文年月、英文月份、2021.03-2024.01、2021年3月至今）
 * - 技能“纯标签罗列”回退
 * - 校验器对坏 JSON 的检出
 * - pdf-text 的行重建与 CJK 不插空格、长文本头尾保留
 */
import assert from 'node:assert/strict';
import { mapAIJsonToResume } from '../src/services/resume-mapper.ts';
import { validateAIResumeJson } from '../src/services/resume-validate.ts';
import { pageItemsToText, normalizeText, capTextForAI } from '../src/utils/pdf-text.ts';

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`[PASS] ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`[FAIL] ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}

/* ---------------- 1. 映射：日期与区间 ---------------- */

test('日期区间 2021.03-2024.01 拆分为起止', () => {
  const r = mapAIJsonToResume({
    basics: { name: '张三' },
    work: [{ name: '某公司', position: '前端', startDate: '2021.03-2024.01' }],
  });
  const w = r.work![0];
  assert.equal(w.startDate, '2021-03');
  assert.equal(w.endDate, '2024-01');
});

test('中文区间 2021年3月至今', () => {
  const r = mapAIJsonToResume({
    basics: { name: '李四' },
    work: [{ company: '某厂', role: '后端', startDate: '2021年3月至今' }],
  });
  const w = r.work![0];
  assert.equal(w.startDate, '2021-03');
  assert.equal(w.endDate, 'present');
});

test('英文月份 Sep 2021', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    education: [{ institution: 'U', startDate: 'Sep 2021', endDate: '2023.06' }],
  });
  assert.equal(r.education![0].startDate, '2021-09');
  assert.equal(r.education![0].endDate, '2023-06');
});

test('纯年份 2021', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    projects: [{ name: 'P', startDate: '2021' }],
  });
  assert.equal(r.projects![0].startDate, '2021-01');
});

test('无法解析的日期应返回空串而非脏数据', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    work: [{ name: 'C', position: 'P', startDate: '未知时间' }],
  });
  assert.equal(r.work![0].startDate, '');
});

/* ---------------- 2. 映射：技能回退 ---------------- */

test('纯标签罗列技能不再整段丢失', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    skills: [{ name: 'Java' }, { name: 'Python' }, { name: 'SQL' }],
  });
  assert.equal(r.skills!.length, 3);
  assert.equal(r.skills![0].name, 'Java');
  assert.ok(r.skills![0]['x-op-skillLevel'] !== undefined);
});

test('带熟练度的技能保持原样', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    skills: [{ name: 'Vue', level: '精通' }, { name: 'React', level: '了解' }],
  });
  assert.equal(r.skills!.length, 2);
  assert.equal(r.skills![0].level, '精通');
  assert.equal(r.skills![1].level, '了解');
});

test('句子型内容不会误判为技能标签', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    skills: [{ name: '熟悉前端工程化，包括 Webpack 与 Vite 的配置与优化。', level: undefined }],
  });
  assert.equal(r.skills, undefined);
});

/* ---------------- 3. 校验器 ---------------- */

test('校验器：合法 JSON 通过', () => {
  const v = validateAIResumeJson({
    basics: { name: '张三', email: 'a@b.com' },
    work: [{ name: '公司', position: '工程师', startDate: '2021-03' }],
    education: [{ institution: '学校' }],
  });
  assert.equal(v.ok, true);
});

test('校验器：检出 work 不是数组', () => {
  const v = validateAIResumeJson({ basics: { name: 'X' }, work: 'not-array' });
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((s) => s.includes('work')));
});

test('校验器：检出日期类型错误', () => {
  const v = validateAIResumeJson({
    basics: { name: 'X' },
    work: [{ name: 'C', position: 'P', startDate: 2021 }],
  });
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((s) => s.includes('startDate')));
});

test('校验器：顶层数组直接拒绝', () => {
  assert.equal(validateAIResumeJson([1, 2]).ok, false);
});

/* ---------------- 4. pdf-text 行重建 ---------------- */

test('同基线文本项合并为一行（CJK 不插空格）', () => {
  const text = pageItemsToText([
    { str: '张三', transform: [1, 0, 0, 1, 0, 100] },
    { str: '简历', transform: [1, 0, 0, 1, 40, 100] },
  ]);
  assert.equal(text, '张三简历');
});

test('跨行（不同 y）拆分为多行', () => {
  const text = pageItemsToText([
    { str: '工作经历', transform: [1, 0, 0, 1, 0, 100] },
    { str: '某公司 前端', transform: [1, 0, 0, 1, 0, 80] },
  ]);
  assert.equal(text, '工作经历\n某公司 前端');
});

test('hasEOL 触发换行', () => {
  const text = pageItemsToText([
    { str: 'A', hasEOL: true, transform: [1, 0, 0, 1, 0, 100] },
    { str: 'B', transform: [1, 0, 0, 1, 0, 100] },
  ]);
  assert.equal(text, 'A\nB');
});

test('超长文本保留头部与尾部', () => {
  const long = '头部内容\n' + 'x'.repeat(80_000) + '\n尾部技能与获奖';
  const capped = capTextForAI(long, 1000);
  assert.ok(capped.startsWith('头部内容'));
  assert.ok(capped.includes('尾部技能与获奖'));
  assert.ok(capped.length <= 1000 + 40);
  assert.ok(capped.includes('中间部分已省略'));
});

test('normalizeText 折叠多余空行', () => {
  const t = normalizeText('  工作经历  \n\n\n\n  某公司  ');
  assert.equal(t, '工作经历\n\n某公司');
});

/* ---------------- 汇总 ---------------- */

console.log(`\n=== summary: ${passed} passed, ${failed} failed ===`);
process.exitCode = failed > 0 ? 1 : 0;