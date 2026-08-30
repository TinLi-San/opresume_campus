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
import {
  pageItemsToText,
  normalizeText,
  capTextForAI,
  cleanExtractedText,
  stripPrivateUseGlyphs,
  splitNumberedRuns,
  pageItemsToStructuredLines,
  sortLinesInReadingOrder,
  structuredLinesToText,
} from '../src/utils/pdf-text.ts';

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

/* ---------------- 5. 修读课程：education.courses → x-op-courses ---------------- */

test('教育经历 courses 汇总为 x-op-courses', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    education: [
      { institution: '东华大学', courses: ['机械设计', '材料力学', '机械制造技术基础'] },
      { institution: '某校', courses: ['机械设计', '控制工程基础'] },
    ],
  });
  const texts = (r['x-op-courses'] ?? []).map((c) => c.text);
  assert.deepEqual(texts, ['机械设计', '材料力学', '机械制造技术基础', '控制工程基础']); // 去重保序
  assert.equal(r.education![0].courses?.length, 3); // 标准字段保留
});

/* ---------------- 6. 自定义模块：customSections → x-op-customModules ---------------- */

test('customSections 映射为自定义模块（标题 + 富文本内容）', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    customSections: [
      { title: '证书资质', items: ['CET-6', '计算机二级'] },
      { title: '兴趣爱好', content: '阅读，跑步' },
    ],
  });
  const mods = r['x-op-customModules']!;
  assert.equal(mods.length, 2);
  assert.equal(mods[0].title, '证书资质');
  assert.ok(mods[0].id.startsWith('custom-'));
  assert.ok(mods[0].contentHtml.includes('<li><p>CET-6</p></li>'));
  assert.ok(mods[1].contentHtml.includes('阅读，跑步'));
});

test('customSections 支持 name 别名，无标题无内容条目被跳过', () => {
  const r = mapAIJsonToResume({
    basics: { name: 'X' },
    customSections: [{ name: '校园活动', items: ['迎新志愿者'] }, {}],
  });
  assert.equal(r['x-op-customModules']?.length, 1);
  assert.equal(r['x-op-customModules']![0].title, '校园活动');
});

/* ---------------- 7. 校验器：customSections 与修读课程内容级检查 ---------------- */

test('校验器：customSections 结构错误被检出', () => {
  const v = validateAIResumeJson({ basics: { name: 'X' }, customSections: 'not-array' });
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((s) => s.includes('customSections')));
});

test('校验器：原文有修读课程但 education 无 courses → 提示修复', () => {
  const source = '教育背景\n东华大学\n修读课程\n• 机械设计，材料力学';
  const v = validateAIResumeJson(
    { basics: { name: 'X' }, education: [{ institution: '东华大学' }] },
    source,
  );
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((s) => s.includes('courses')));
});

test('校验器：education 有 courses 时通过内容级检查', () => {
  const source = '教育背景\n东华大学\n修读课程\n• 机械设计';
  const v = validateAIResumeJson(
    { basics: { name: 'X' }, education: [{ institution: '东华大学', courses: ['机械设计'] }] },
    source,
  );
  assert.equal(v.ok, true);
});

/* ---------------- 8. pdf-text：PUA 过滤 / 编号拆分 / 双栏阅读顺序 ---------------- */

test('stripPrivateUseGlyphs 过滤图标私用区字符', () => {
  assert.equal(stripPrivateUseGlyphs('王小明\uF0D5 22 岁 \uF004 XX 省'), '王小明 22 岁  XX 省');
});

test('splitNumberedRuns 拆分折行编号列表', () => {
  assert.equal(
    splitNumberedRuns('1. 整合市场调研； 2. 针对 xx 场景； 3. 协作组员'),
    '1. 整合市场调研\n2. 针对 xx 场景\n3. 协作组员',
  );
  // 非列表行不拆分（普通句子的分号保留）
  assert.equal(splitNumberedRuns('这是普通句子；2. 后面的内容不是编号'), '这是普通句子；2. 后面的内容不是编号');
});

test('splitNumberedRuns 支持子弹符前缀与跨物理行折行', () => {
  // 行首 "- 1."（真实模板形态）与折行后落在续行的 "； 3." 都能拆
  assert.equal(
    splitNumberedRuns('- 1. 整合调研； 2. 方案研判\n能化程度低； 3. 周期规划'),
    '- 1. 整合调研\n2. 方案研判\n能化程度低\n3. 周期规划',
  );
});

test('cleanExtractedText 组合清理', () => {
  const t = cleanExtractedText('1. 整合调研； 2. 方案研判\uF0D7\n\n  ');
  assert.equal(t, '1. 整合调研\n2. 方案研判');
});

test('双栏版式按阅读顺序重排（先左栏后右栏）', () => {
  // 页面宽 600；左栏 x≈40（两行），右栏 x≈340（两行），内容互为交错
  const items = [
    { str: '工作经历', transform: [1, 0, 0, 1, 40, 700] },
    { str: '某公司', transform: [1, 0, 0, 1, 40, 660] },
    { str: '张三', transform: [1, 0, 0, 1, 340, 720] },
    { str: '联系方式', transform: [1, 0, 0, 1, 340, 680] },
  ];
  const lines = pageItemsToStructuredLines(items);
  const ordered = sortLinesInReadingOrder(lines, 600);
  assert.equal(ordered.count, 2);
  const text = structuredLinesToText(ordered.lines, { column: ordered.column, count: ordered.count });
  // 先左栏两行（[左] 工作经历 → [左] 某公司），再右栏两行（[右] 张三 → [右] 联系方式）
  assert.equal(
    text,
    '[左] 工作经历\n[左] 某公司\n[右] 张三\n[右] 联系方式',
  );
});

/* ---------------- 汇总 ---------------- */

console.log(`\n=== summary: ${passed} passed, ${failed} failed ===`);
process.exitCode = failed > 0 ? 1 : 0;