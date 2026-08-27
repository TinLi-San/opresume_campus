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
 * @returns 校验结果；issues 为空视为通过
 */
export function validateAIResumeJson(json: unknown): ResumeValidation {
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

  return { ok: issues.length === 0, issues };
}