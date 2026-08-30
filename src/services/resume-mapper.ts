/**
 * AI 返回的 JSON 数据 → JsonResume 格式映射
 *
 * 采用宽松映射策略：缺失字段使用默认值，格式错误尝试修复，
 * 确保即使 AI 返回不完美的数据也能正常工作。
 *
 * 2026-08 增强：
 * - 日期解析支持区间（2021.03-2024.01 / 2021年3月至今 / 2021 - 2024）、
 *   中文年月（2021年3月）与英文月份（Sep 2021）；
 * - 技能支持“纯标签罗列”回退（不再因为缺熟练度整段丢弃）；
 * - 补充 url / courses / summary 等字段透传。
 */

import type { JsonResume, JsonSkill } from '@/types/json-resume';

/**
 * 将 AI 返回的 JSON 映射为 JsonResume 格式
 * @param aiJson AI 解析的简历数据（类型未知，需要容错处理）
 * @returns 标准化的简历数据
 */
export function mapAIJsonToResume(aiJson: unknown): JsonResume {
  if (!aiJson || typeof aiJson !== 'object' || Array.isArray(aiJson)) {
    throw new Error('无效的数据格式');
  }

  const data = aiJson as Record<string, unknown>;

  const basics = extractBasics(data.basics);
  const work = extractWorkList(data.work);
  const education = extractEducationList(data.education);
  const projects = extractProjectList(data.projects);
  const skills = extractSkillList(data.skills);
  const awards = extractAwardList(data.awards);

  const result: JsonResume = {
    basics,
  };

  // 只添加非空数组
  if (work.length > 0) result.work = work;
  if (education.length > 0) result.education = education;
  if (projects.length > 0) result.projects = projects;
  if (skills.length > 0) result.skills = skills;
  if (awards.length > 0) result.awards = awards;

  // 修读课程：各教育经历的 courses 汇总为模板消费的 x-op-courses（template7 渲染层只读该字段）
  const allCourses = collectCourses(data.education);
  if (allCourses.length > 0) {
    result['x-op-courses'] = allCourses.map((text) => ({ id: generateId(), text }));
  }

  // 自我评价存储为 HTML（兼容数组和字符串；customSections 中的「个人介绍/自我评价」类栏目
  // 并入此处避免与自定义模块重复，保证以标准模块样式（标题+色条+内容）渲染）
  const rawBasics = data.basics as Record<string, unknown> | undefined;
  const baseAboutmeHtml = rawBasics ? toListHtml(rawBasics.summary) || toListHtml(rawBasics.about) || toListHtml(rawBasics.bio) : undefined;
  const { modules: customModules, aboutmeHtml } = extractCustomModules(data, baseAboutmeHtml ?? undefined);
  if (aboutmeHtml) {
    result['x-op-aboutmeHtml'] = aboutmeHtml;
  }

  // AI 识别出的非预设栏目 → x-op-customModules（自定义模块，含标题与富文本内容）
  if (customModules.length > 0) {
    result['x-op-customModules'] = customModules;
  }

  // 工作年限
  if (rawBasics) {
    const workExpYear = asString(rawBasics.workExpYear) || asString(rawBasics.yearsOfExperience);
    if (workExpYear) {
      result['x-op-workExpYear'] = workExpYear.replace(/[^\d.]/g, '');
    }
  }

  // 额外联系方式 → x-op-customFields
  const customFields = extractCustomFields(rawBasics);
  if (customFields.length > 0) {
    result['x-op-customFields'] = customFields;
  }

  return result;
}

/**
 * 验证 AI 返回的数据是否包含最基本的信息
 */
export function isValidAIResumeData(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  // 至少需要 basics 或任意一个 section
  return !!(obj.basics || obj.work || obj.education || obj.projects || obj.skills);
}

// --- 内部辅助函数 ---

function generateId(): string {
  return crypto.randomUUID();
}

/* ---------------- 日期解析 ---------------- */

const MONTHS_EN: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * 解析单个日期 token，返回 YYYY-MM；无法解析返回 ''。
 * 支持：2021-03 / 2021.3 / 2021/03 / 2021年3月 / 2021年 / 2021 / Sep 2021 / 2021 Sep
 */
function parseDateToken(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return '';
  if (s === 'present' || s === '至今' || s === '现在') return 'present';

  // 中文年月：2021年3月 / 2021年
  const cn = s.match(/^(\d{4})年(\d{1,2})月?$/);
  if (cn) return `${cn[1]}-${cn[2].padStart(2, '0')}`;
  const cnYear = s.match(/^(\d{4})年$/);
  if (cnYear) return `${cnYear[1]}-01`;

  // 分隔符年月：2021-03 / 2021.3 / 2021/03 / 2021.03
  const ymd = s.match(/^(\d{4})[.\-/](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}`;

  // 英文月份：Sep 2021 / September 2021 / 2021-Sep
  const en = s.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[.\- ]+(\d{4})$/i);
  if (en) return `${en[2]}-${String(MONTHS_EN[en[1]]).padStart(2, '0')}`;
  const en2 = s.match(/^(\d{4})[.\- ]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i);
  if (en2) return `${en2[1]}-${String(MONTHS_EN[en2[2]]).padStart(2, '0')}`;

  // 纯年份：2021
  const year = s.match(/^(\d{4})$/);
  if (year) return `${year[1]}-01`;

  return '';
}

/** 是否“present 类”值 */
function isPresentLike(s: string): boolean {
  const v = s.trim().toLowerCase();
  return v === 'present' || v === '至今' || v === '现在' || v === '至今';
}

/**
 * 拆分日期区间字符串（如 "2021.03-2024.01"、"2021年3月至今"、"2021 - 2024"）。
 * 只有两边都能被识别为日期（含 present）时才返回区间，否则原样返回。
 */
function splitDateRange(raw: string): { start: string; end: string } {
  const s = raw.trim();
  if (!s) return { start: '', end: '' };
  // 以“至今/到现在/迄今”结尾 → 区间到 present（含 "2021.03~至今" 这类写法）
  const toPresent = s.match(/^(.*?)(?:至今|到现在|迄今)$/);
  if (toPresent) {
    const startTok = toPresent[1].trim().replace(/[~〜至到\-—–\s]+$/, '');
    return { start: startTok, end: 'present' };
  }
  // 分隔符：~〜至到 — – － 或 “-（后随4位年份）”
  const parts = s.split(/[~〜至到]|—|–|－|\s+-\s+|-(?=\d{4})/);
  if (parts.length < 2) return { start: s, end: '' };
  const startTok = parts[0].trim();
  const endTok = parts.slice(1).join('').trim();
  if ((parseDateToken(startTok) || isPresentLike(startTok)) && (parseDateToken(endTok) || isPresentLike(endTok))) {
    return { start: startTok, end: endTok };
  }
  return { start: s, end: '' };
}

/** 统一格式化单侧日期（无区间时返回 ''） */
function formatDate(date?: unknown): string {
  if (!date || typeof date !== 'string') return '';
  const v = date.trim();
  if (!v) return '';
  if (isPresentLike(v)) return 'present';
  const parsed = parseDateToken(v);
  // 区间串（如 2021.03-2024.01）取第一部分；无法解析返回空串，避免脏数据入库
  if (!parsed) {
    const range = splitDateRange(v);
    if (range.end) return parseDateToken(range.start) || '';
    return '';
  }
  return parsed;
}

/** 计算条目的起止时间（endDate 缺失时从 startDate 区间中取） */
function resolveDates(
  item: Record<string, unknown>,
): { startDate: string; endDate: string } {
  const startToken = asString(item.startDate);
  const endToken = asString(item.endDate);
  const range = splitDateRange(startToken);
  const start = formatDate(range.start || startToken);
  const end = formatDate(endToken || (range.end || ''));
  return { startDate: start, endDate: end };
}

/* ---------------- 通用取值 ---------------- */

function asString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  return '';
}

/** 兼容字符串和字符串数组，数组时拼接为换行分隔的纯文本 */
function asFlexString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) {
    return val.filter((v): v is string => typeof v === 'string' && v.trim() !== '').join('\n');
  }
  return '';
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/**
 * 将字符串数组或纯文本转为 <ul><li><p>...</p></li></ul> 格式的 HTML
 * 兼容 AI 返回数组或字符串两种情况
 */
function toListHtml(val: unknown): string | undefined {
  // 数组 → 每个元素一个 <li>
  if (Array.isArray(val)) {
    const items = val.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    if (items.length === 0) return undefined;
    const lis = items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('');
    return `<ul>${lis}</ul>`;
  }

  // 字符串 → 按换行符拆分为列表
  if (typeof val === 'string' && val.trim()) {
    const lines = val.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      // 单行直接返回段落
      return lines[0] ? `<p>${escapeHtml(lines[0])}</p>` : undefined;
    }
    const lis = lines.map((line) => `<li><p>${escapeHtml(line)}</p></li>`).join('');
    return `<ul>${lis}</ul>`;
  }

  return undefined;
}

/** 转义 HTML 特殊字符，防止简历原文中的 < > & 破坏富文本结构 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ---------------- 各 section 提取 ---------------- */

function extractBasics(raw: unknown): NonNullable<JsonResume['basics']> {
  if (!raw || typeof raw !== 'object') {
    return { name: '' };
  }

  const obj = raw as Record<string, unknown>;

  const location = obj.location;
  let city = '';
  if (typeof location === 'string') {
    city = location;
  } else if (location && typeof location === 'object') {
    const loc = location as Record<string, unknown>;
    city = asString(loc.city) || asString(loc.region) || asString(loc.address) || '';
  }

  return {
    name: asString(obj.name),
    email: asString(obj.email) || undefined,
    phone: asString(obj.phone) || asString(obj.tel) || asString(obj.mobile) || undefined,
    label: asString(obj.label) || asString(obj.title) || asString(obj.position) || undefined,
    summary: asFlexString(obj.summary) || asFlexString(obj.about) || asFlexString(obj.bio) || undefined,
    location: city ? { city } : undefined,
  };
}

function extractWorkList(raw: unknown): JsonResume['work'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      // 至少需要公司名或职位
      const name = asString(item.name) || asString(item.company) || asString(item.companyName);
      const position = asString(item.position) || asString(item.title) || asString(item.role);
      return !!(name || position);
    })
    .map((item) => {
      const summary = asString(item.summary) || asString(item.description) || asString(item.content);
      const dates = resolveDates(item);
      return {
        name: asString(item.name) || asString(item.company) || asString(item.companyName),
        position: asString(item.position) || asString(item.title) || asString(item.role),
        startDate: dates.startDate,
        endDate: dates.endDate,
        summary,
        highlights: asStringArray(item.highlights),
        url: asString(item.url) || undefined,
        'x-op-id': generateId(),
        'x-op-departmentName': asString(item.department) || asString(item.departmentName) || undefined,
        'x-op-workDescHtml': toListHtml(item.summary) || toListHtml(item.description) || toListHtml(item.content),
      };
    });
}

function extractEducationList(raw: unknown): JsonResume['education'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      const institution = asString(item.institution) || asString(item.school);
      return !!institution;
    })
    .map((item) => {
      const dates = resolveDates(item);
      return {
        institution: asString(item.institution) || asString(item.school),
        area: asString(item.area) || asString(item.major) || asString(item.field),
        studyType: asString(item.studyType) || asString(item.degree),
        startDate: dates.startDate,
        endDate: dates.endDate,
        score: asString(item.score) || asString(item.gpa) || undefined,
        courses: asStringArray(item.courses),
        'x-op-id': generateId(),
      };
    });
}

function extractProjectList(raw: unknown): JsonResume['projects'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      const name = asString(item.name) || asString(item.projectName);
      return !!name;
    })
    .map((item) => {
      // description = 简短项目描述，content = 详细项目内容，两者分开映射
      const description = asString(item.description);
      const dates = resolveDates(item);
      return {
        name: asString(item.name) || asString(item.projectName),
        description: description || undefined,
        highlights: asStringArray(item.highlights),
        keywords: asStringArray(item.keywords),
        roles: asStringArray(item.roles) || (asString(item.role) ? [asString(item.role)] : undefined),
        startDate: dates.startDate,
        endDate: dates.endDate,
        url: asString(item.url) || undefined,
        'x-op-id': generateId(),
        'x-op-type': 'project' as const,
        'x-op-projectContentHtml': toListHtml(item.content) || toListHtml(item.details),
      };
    });
}

/** 判断名称是否像“技能标签”（简短、无句子标点） */
function looksLikeSkillTag(name: string): boolean {
  const n = name.trim();
  if (!n || n.length > 16) return false;
  if (/[。！？；：，、\n]/.test(n)) return false;
  return true;
}

function extractSkillList(raw: unknown): NonNullable<JsonResume['skills']> {
  if (!Array.isArray(raw)) return [];

  const items = raw.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  const out: JsonSkill[] = [];

  for (const item of items) {
    const name = asString(item.name) || asString(item.skillName) || asString(item.group) || asString(item.groupName);
    if (!name || name.length > 40) continue;

    // 形态 1：单条技能（name + 有效熟练度）——level 必须来自原文
    const level = asString(item.level);
    if (level && isValidSkillLevel(level)) {
      const normalizedLevel = normalizeSkillLevel(level);
      out.push({
        name,
        level: normalizedLevel,
        keywords: asStringArray(item.keywords),
        'x-op-id': generateId(),
        'x-op-skillLevel': skillLevelToNumber(normalizedLevel),
      });
      continue;
    }

    // 形态 2：技能分组（name=分组名 + keywords/items 标签数组，无 level）
    const tagSource = Array.isArray(item.keywords) ? item.keywords : Array.isArray(item.items) ? item.items : null;
    if (tagSource && tagSource.length > 0) {
      const tags = tagSource
        .map((k) =>
          typeof k === 'string'
            ? k.trim()
            : k && typeof k === 'object' && !Array.isArray(k)
              ? asString((k as Record<string, unknown>).name)
              : '',
        )
        .filter((s) => s !== '');
      if (tags.length > 0) {
        out.push({ name, keywords: tags, 'x-op-id': generateId() });
        continue;
      }
    }

    // 形态 3：纯标签（无 level、无分组）——不注入任何熟练度，避免臆造
    if (looksLikeSkillTag(name)) {
      out.push({ name, 'x-op-id': generateId() });
    }
  }

  return out;
}

/**
 * 奖项标题归一化键（用于去重）：去空白、去起始年份、去括号/限定语，
 * 仅用于比较是否同源，不影响保留的原文 title。
 */
function normalizeAwardKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^[（(]?\d{4}[年./-]?\d{0,2}[）)]?[-·—–]?/, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[·—–,，、]+$/, '')
    .trim();
}

/** 信息完整度评分：去重时保留 date/awarder 更齐全的条目 */
function awardInfoScore(item: Record<string, unknown>): number {
  let s = 0;
  if (asString(item.rawDate)) s += 1;
  if (asString(item.awarder)) s += 1;
  if (asString(item.summary)) s += 0.5;
  return s;
}

function extractAwardList(raw: unknown): JsonResume['awards'] & object[] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      title: asString(item.title) || asString(item.name) || asString(item.awardInfo),
      rawDate: asString(item.date) || asString(item.awardTime) || asString(item.year) || asString(item.time),
      awarder: asString(item.awarder) || asString(item.issuer) || asString(item.organization),
      summary: asString(item.summary),
    }))
    .filter((x) => x.title !== '');

  // 内容级去重（P0-1）：title 归一后同源合并，保留信息最全的一条（含日期/颁发方优先）
  const seen = new Map<string, Record<string, unknown>>();
  for (const item of normalized) {
    const key = normalizeAwardKey(item.title);
    if (!key) continue;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, item);
    } else if (awardInfoScore(item) > awardInfoScore(prev)) {
      seen.set(key, item);
    }
  }

  return [...seen.values()].map((item) => ({
    title: item.title as string,
    // 日期逐字照抄原文（只有年份就保留年份），禁止推断补全月份、禁止格式化丢弃
    date: asString(item.rawDate) || undefined,
    awarder: asString(item.awarder) || undefined,
    summary: asString(item.summary) || undefined,
    'x-op-id': generateId(),
  }));
}

/**
 * 汇总所有教育经历中的修读课程（去重、保持出现顺序）
 */
function collectCourses(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const courses = (item as Record<string, unknown>).courses;
    if (!Array.isArray(courses)) continue;
    for (const c of courses) {
      const s = asString(c);
      if (s && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}

/** 标题是否属于「自我评价/个人介绍」类栏目（并入 aboutme 而非自定义模块） */
function isAboutLikeTitle(title: string): boolean {
  return /个人介绍|自我介绍|自我评价|个人简介|个人宣言|关于我|个人概述|自我描述/.test(title);
}

/**
 * 将 AI 识别出的「非预设栏目」（customSections/customModules）映射为自定义模块：
 * - title：栏目名（支持 name 别名）
 * - contentHtml：items/content 分条转为 <ul><li>，单条或连续段落转 <p>
 * - 「个人介绍/自我评价」类栏目不生成自定义模块：基础 summary 缺失时并入 aboutmeHtml，
 *   已有 summary 时整段丢弃，避免与自我评价模块重复渲染
 * 跳过既无标题也无内容的条目。
 */
function extractCustomModules(
  raw: unknown,
  baseAboutmeHtml?: string,
): { modules: NonNullable<JsonResume['x-op-customModules']>; aboutmeHtml?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { modules: [], aboutmeHtml: baseAboutmeHtml };
  }
  const obj = raw as Record<string, unknown>;
  const source = Array.isArray(obj.customSections)
    ? obj.customSections
    : Array.isArray(obj.customModules)
      ? obj.customModules
      : [];

  const modules: NonNullable<JsonResume['x-op-customModules']> = [];
  let aboutmeHtml = baseAboutmeHtml || undefined;

  for (const item of source) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const title = asString(entry.title) || asString(entry.name);
    const html =
      toListHtml(entry.items) ||
      toListHtml(entry.content) ||
      toListHtml(entry.description);
    if (!title && !html) continue;

    // 自我评价类栏目：不生成自定义模块，避免与 aboutme 重复
    if (isAboutLikeTitle(title)) {
      if (!aboutmeHtml && html) aboutmeHtml = html;
      continue;
    }

    modules.push({
      id: `custom-${generateId()}`,
      title: title || '自定义模块',
      contentHtml: html ?? '<p></p>',
    });
  }
  return { modules, aboutmeHtml };
}

function normalizeSkillLevel(level: string): string {
  const l = level.toLowerCase();
  if (['master', '精通', '专家'].some((k) => l.includes(k))) return '精通';
  if (['advanced', '熟练', '高级'].some((k) => l.includes(k))) return '熟练';
  if (['beginner', '入门', '初级', '了解'].some((k) => l.includes(k))) return '了解';
  return '熟练';
}

/** 判断 level 值是否为有效的技能熟练度描述 */
function isValidSkillLevel(level: string): boolean {
  const l = level.toLowerCase();
  const keywords = ['精通', '熟练', '了解', '掌握', '熟悉', '入门', '初级', '高级', '专家',
    'master', 'advanced', 'intermediate', 'beginner', 'expert', 'proficient'];
  return keywords.some((k) => l.includes(k));
}

function skillLevelToNumber(level: string): number {
  switch (level) {
    case '了解': return 25;
    case '熟练': return 50;
    case '精通': return 95;
    default: return 50;
  }
}

/** basics 中已知字段之外的额外信息 → x-op-customFields */
function extractCustomFields(raw: unknown): Array<{ key: string; value: string }> {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;

  const results: Array<{ key: string; value: string }> = [];

  // 1. AI 返回的 extraFields 数组
  if (Array.isArray(obj.extraFields)) {
    for (const item of obj.extraFields) {
      if (!item || typeof item !== 'object') continue;
      const f = item as Record<string, unknown>;
      const key = asString(f.key);
      const value = asString(f.value);
      if (key && value) {
        results.push({ key, value });
      }
    }
  }

  // 2. 标准 JSON Resume 字段中 OpResume 不直接支持的，也转为自定义字段
  const url = asString(obj.url) || asString(obj.website);
  if (url) results.push({ key: '个人网站', value: url });

  // profiles 数组（GitHub、LinkedIn 等）
  if (Array.isArray(obj.profiles)) {
    for (const p of obj.profiles) {
      if (!p || typeof p !== 'object') continue;
      const profile = p as Record<string, unknown>;
      const network = asString(profile.network);
      const profileUrl = asString(profile.url) || asString(profile.username);
      if (network && profileUrl) {
        results.push({ key: network, value: profileUrl });
      }
    }
  }

  return results;
}