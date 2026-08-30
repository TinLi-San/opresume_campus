/**
 * AI 返回 JSON 的结构校验器（纯函数，零依赖）
 *
 * 与 mapAIJsonToResume 的取词口径保持一致（接受别名），
 * 但只做结构/类型层面的检查（是否缺关键字段、类型是否正确），
 * 不做内容正确性判断——内容问题交给修复循环让模型自查。
 */

export interface ResumeValidation {
  ok: boolean;
  /** 问题列表（中文，供修复提示词直接引用） */
  issues: string[];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

/** basics 下各文本字段（含常见别名） */
const BASICS_TEXT_KEYS = ['name', 'email', 'phone', 'label', 'title', 'position', 'workExpYear', 'yearsOfExperience', 'city'];

/** work 条目必需字段（至少其一） */
const WORK_KEYS = ['name', 'company', 'companyName', 'position', 'title', 'role'];
/** education 条目必需字段（至少其一） */
const EDU_KEYS = ['institution', 'school', 'university', 'college'];
/** projects 条目必需字段（至少其一） */
const PROJ_KEYS = ['name', 'projectName'];
/** skills 条目必需字段（至少其一） */
const SKILL_KEYS = ['name', 'skillName'];
/** awards 条目必需字段（至少其一） */
const AWARD_KEYS = ['title', 'name', 'awardInfo'];

/** 数组字段需要至少满足关键字段之一的对象条目 */
function checkArraySection(
  data: Record<string, unknown>,
  section: 'work' | 'education' | 'projects' | 'skills' | 'awards',
  reqKeys: string[],
  label: string,
  issues: string[],
): void {
  const raw = data[section];
  if (raw === undefined) return; // 允许省略
  if (!Array.isArray(raw)) {
    issues.push(`${label}（${section}）必须是数组`);
    return;
  }
  for (const item of raw) {
    if (!isPlainObject(item)) {
      issues.push(`${label}（${section}）中有一项不是对象`);
      continue;
    }
    const hasRequired = reqKeys.some((k) => isNonEmptyString(item[k]));
    if (!hasRequired) {
      issues.push(`${label}（${section}）中有一项缺少必要字段（${reqKeys.join('/')}）`);
    }
  }
}

/** 校验日期字段：允许 ''（省略）或可识别的日期文本 */
function checkDateField(item: Record<string, unknown>, key: string, issues: string[]): void {
  const v = item[key];
  if (v === undefined || v === null) return;
  if (typeof v !== 'string') {
    issues.push(`字段 ${key} 应为字符串（形如 "2021-03" 或 "present"），实际是 ${typeof v}`);
    return;
  }
  const s = v.trim().toLowerCase();
  if (s === '' || s === 'present' || s === '至今' || s === '现在') return;
  // 宽松日期形态：YYYY 或 YYYY-MM 或 中文年月 或 英文月份
  const dateish =
    /^\d{4}([年.\-/]\d{1,2}([月日.]*)?)?$/.test(s) ||
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[- .]?\d{4}$/i.test(s);
  if (!dateish && s.length > 24) {
    issues.push(`字段 ${key} 的取值看起来不是日期：${v.slice(0, 40)}`);
  }
}

/**
 * 校验 AI 返回的简历 JSON 结构
 * @param json AI 输出（解析后）
 * @param sourceText 原始提取文本（可选）。提供时做内容级检查：
 *   原文存在「修读课程」但输出 education 无 courses → 记为 issue 触发修复轮
 * @returns 校验结果；issues 为空视为通过
 */
export function validateAIResumeJson(json: unknown, sourceText?: string): ResumeValidation {
  const issues: string[] = [];

  if (!json) {
    return { ok: false, issues: ['输出为空'] };
  }
  if (Array.isArray(json)) {
    return { ok: false, issues: ['顶层必须是 JSON 对象，而不是数组'] };
  }
  if (!isPlainObject(json)) {
    return { ok: false, issues: ['顶层必须是 JSON 对象'] };
  }

  // basics
  if (json.basics !== undefined) {
    if (!isPlainObject(json.basics)) {
      issues.push('basics 必须是对象');
    } else {
      for (const k of BASICS_TEXT_KEYS) {
        const v = json.basics[k];
        if (v !== undefined && v !== null && typeof v !== 'string') {
          issues.push(`basics.${k} 应为字符串`);
        }
      }
      if (json.basics.location !== undefined && !isPlainObject(json.basics.location)) {
        issues.push('basics.location 应为对象（如 { "city": "上海" }）');
      }
    }
  }

  // 各 section
  checkArraySection(json, 'work', WORK_KEYS, '工作经历', issues);
  checkArraySection(json, 'education', EDU_KEYS, '教育经历', issues);
  checkArraySection(json, 'projects', PROJ_KEYS, '项目经历', issues);
  checkArraySection(json, 'skills', SKILL_KEYS, '技能列表', issues);
  checkArraySection(json, 'awards', AWARD_KEYS, '获奖经历', issues);
  checkCustomSections(json, issues);

  // 日期字段类型（work/education/projects）
  for (const section of ['work', 'education', 'projects'] as const) {
    const arr = json[section];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!isPlainObject(item)) continue;
      checkDateField(item, 'startDate', issues);
      checkDateField(item, 'endDate', issues);
    }
  }
  // awards 的 date 字段
  if (Array.isArray(json.awards)) {
    for (const item of json.awards) {
      if (!isPlainObject(item)) continue;
      checkDateField(item, 'date', issues);
    }
  }

  // 内容级检查：课程 / GPA / 岗位 / 奖项月份保真
  checkCoursesPresence(json, sourceText, issues);
  checkGPAPresence(json, sourceText, issues);
  checkWorkPositionPresence(json, issues);
  checkAwardDateFaithfulness(json, sourceText, issues);

  return { ok: issues.length === 0, issues };
}

/** 校验 customSections（非预设栏目）结构 */
function checkCustomSections(
  data: Record<string, unknown>,
  issues: string[],
): void {
  const raw = data.customSections;
  if (raw === undefined) return; // 允许省略
  if (!Array.isArray(raw)) {
    issues.push('customSections 必须是数组');
    return;
  }
  for (const item of raw) {
    if (!isPlainObject(item)) {
      issues.push('customSections 中有一项不是对象');
      continue;
    }
    const titleOk = isNonEmptyString(item.title) || isNonEmptyString(item.name);
    const contentOk =
      Array.isArray(item.items) ||
      Array.isArray(item.content) ||
      isNonEmptyString(item.items) ||
      isNonEmptyString(item.content);
    if (!titleOk && !contentOk) {
      issues.push('customSections 中有一项缺少标题（title）与内容（items/content）');
      continue;
    }
    for (const k of ['items', 'content'] as const) {
      const v = item[k];
      if (v === undefined) continue;
      if (typeof v === 'string' && v.trim() !== '') continue;
      if (Array.isArray(v)) continue;
      issues.push(`customSections.${k} 应为字符串或字符串数组`);
    }
  }
}

/** 内容级检查：原文有修读课程字样但 education 条目没有 courses */
function checkCoursesPresence(
  data: Record<string, unknown>,
  sourceText: string | undefined,
  issues: string[],
): void {
  if (!sourceText) return;
  if (!/修读课程|主修课程|核心课程|相关课程|所学课程/.test(sourceText)) return;
  const edu = Array.isArray(data.education) ? data.education : [];
  if (edu.length === 0) return;
  const hasCourses = edu.some(
    (it) =>
      isPlainObject(it) &&
      Array.isArray(it.courses) &&
      it.courses.some((c) => isNonEmptyString(c)),
  );
  if (!hasCourses) {
    issues.push('原文教育背景包含「修读课程」信息，education 条目缺少 courses 数组，请逐门保留原文课程名称');
  }
}
/** 内容级检查：原文含 GPA/成绩/排名 但 education 条目没有 score → 提示修复 */
function checkGPAPresence(
  data: Record<string, unknown>,
  sourceText: string | undefined,
  issues: string[],
): void {
  if (!sourceText) return;
  if (!/GPA|绩点|成绩|排名|\d\.\d\/\d/.test(sourceText)) return;
  const edu = Array.isArray(data.education) ? data.education : [];
  if (edu.length === 0) return;
  const hasScore = edu.some(
    (it) => (isPlainObject(it) && isNonEmptyString(it.score)) || (isPlainObject(it) && isNonEmptyString(it.gpa)),
  );
  if (!hasScore) {
    issues.push('原文教育背景包含 GPA/成绩/排名信息，education 条目缺少 score 字段，请逐字照抄原文（如 "3.6/4.0"、"专业前8%"）；原文确实没有则忽略此提示');
  }
}

/** 内容级检查：工作经历有公司名却缺岗位字段 → 提示补回（原文明确写了岗位时） */
function checkWorkPositionPresence(
  data: Record<string, unknown>,
  issues: string[],
): void {
  const work = Array.isArray(data.work) ? data.work : [];
  for (const item of work) {
    if (!isPlainObject(item)) continue;
    const hasCompany = ['name', 'company', 'companyName'].some((k) => isNonEmptyString(item[k]));
    const hasPosition = ['position', 'title', 'role'].some((k) => isNonEmptyString(item[k]));
    if (hasCompany && !hasPosition) {
      issues.push('工作经历条目至少一条只有公司名、缺少岗位字段（position/title/role）：岗位名称是 HR 必读信息，原文明确写了岗位请补回，确实没有可保持空缺');
    }
  }
}

/** 内容级检查：奖项 date 疑似被编造月份（原文只有年份 "2023"，输出却写成 "2023-01"） */
function checkAwardDateFaithfulness(
  data: Record<string, unknown>,
  sourceText: string | undefined,
  issues: string[],
): void {
  if (!sourceText) return;
  const awards = Array.isArray(data.awards) ? data.awards : [];
  for (const item of awards) {
    if (!isPlainObject(item)) continue;
    const d = item.date ?? item.awardTime;
    if (typeof d !== 'string') continue;
    const m = d.trim().match(/^(\d{4})-01$/);
    if (!m) continue;
    const year = m[1];
    // 原文存在该年份与月份的组合才视为合法；只出现裸年份则判定为编造月份
    const hasMonthEvidence = new RegExp(
      year + '\\s*[-年./]\\s*1(?:月|\\b)',
    ).test(sourceText);
    if (!hasMonthEvidence) {
      issues.push(`奖项日期 "${d}" 疑似将原文只写的年份 "${year}" 编造补全为 1 月——请逐字照抄原文日期（只有年份就写 "${year}"）`);
    }
  }
}