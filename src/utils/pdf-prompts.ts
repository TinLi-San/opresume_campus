/**
 * AI 简历解析 Prompt 模板
 *
 * 指导 AI 从 PDF 文本中提取结构化简历数据，
 * 严格遵循 JSON Resume 标准格式输出。
 */

/** 系统提示词 */
export const SYSTEM_PROMPT = `你是一个专业的简历解析助手。你的任务是从用户提供的简历文本中提取结构化信息，并严格按照指定的 JSON 格式输出。

硬性要求：
1. 只输出一个合法的 JSON 对象，不要输出 markdown 代码块、注释或任何解释文字。
2. 顶层字段只使用：basics、work、education、projects、skills、awards。
3. 简历原文中出现的每一条工作经历、教育经历、项目经历、获奖经历都必须逐条保留，禁止合并、遗漏或概括省略；即使原文只有一句话也应保留为一条。
4. 所有日期统一为 YYYY-MM 格式（如 "2021-03"），"至今/现在/present" 写作 "present"，不确定的具体日期按现有信息尽量还原。
5. 工作职责、项目内容等：原文分条列举时使用字符串数组（每条一个元素）；连续段落时使用普通字符串。
6. 无法从原文提取的字段直接省略该字段，不要输出 null 或空字符串。
7. 技能：原文为"技能名称+熟练程度"逐条格式时，输出 skills 数组（level 用中文：精通/熟练/了解）；原文为纯技能标签罗列（如 Java、Python、SQL）时，也将每个标签输出为 skills 项（此时省略 level 字段）。
8. 不要编造任何原文中不存在的信息。`;

/** JSON 模板 */
const JSON_TEMPLATE = `{
  "basics": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "手机号",
    "label": "职位头衔",
    "summary": "个人简介/自我评价",
    "location": {
      "city": "城市"
    },
    "workExpYear": "工作年限（如 5）",
    "extraFields": [
      { "key": "字段名", "value": "字段值" }
    ]  // 简历中除姓名、邮箱、手机号、职位、城市之外的其他联系方式或个人信息（如微信、GitHub、个人网站、博客等），每项一个对象
  },
  "work": [
    {
      "name": "公司名称",
      "position": "职位",
      "department": "部门（如有）",
      "startDate": "2021-03",
      "endDate": "2024-01",
      "summary": ["工作职责或成果要点1", "工作职责或成果要点2"]  // 分条列举时用数组，连续段落时用字符串
    }
  ],
  "education": [
    {
      "institution": "学校名称",
      "area": "专业",
      "studyType": "学历（如 本科/硕士/博士）",
      "startDate": "2017-09",
      "endDate": "2021-06"
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "description": "一句话项目简介",
      "content": ["项目详细内容要点1", "项目详细内容要点2"]  // 分条列举时用数组，连续段落时用字符串,
      "roles": ["担任角色"],
      "startDate": "2022-01",
      "endDate": "2023-06"
    }
  ],
  "skills": [
    {
      "name": "技能名称",
      "level": "熟练"
    }
  ]  // level 使用中文：精通/熟练/了解。纯标签罗列时省略 level,
  "awards": [
    {
      "title": "奖项名称",
      "date": "2023-06",
      "awarder": "颁发机构"
    }
  ]
}`;

/**
 * 构建用户提示词
 * @param pdfText PDF 提取的文本
 * @returns 完整的用户提示词
 */
export function buildUserPrompt(pdfText: string): string {
  return `请从以下简历文本中提取信息，并严格按照 JSON 格式输出。

简历文本：
---
${pdfText}
---

请提取以下信息（如果存在）：
- 基本信息（姓名、邮箱、手机号、职位头衔、所在城市、工作年限、个人简介，以及其他联系方式如微信、GitHub、网站等）
- 工作经历（公司、部门、职位、时间、工作描述）
- 教育背景（学校、专业、学历、时间）
- 项目经验（项目名称、一句话简介、详细内容、角色、时间）
- 技能列表（技能名称、熟练程度、关键词）
- 获奖经历（奖项、时间、颁发机构）

输出格式：
${JSON_TEMPLATE}

注意：只返回 JSON 对象，不要添加 markdown 代码块标记或其他文字。`;
}

/**
 * 构建修复提示词（校验失败后的二次修复）
 * @param issues 校验器返回的问题列表（中文描述）
 * @returns 修复提示词，要求模型只输出修正后的 JSON
 */
export function buildRepairPrompt(issues: string[]): string {
  const bullet = issues.length > 0
    ? issues.map((s) => `- ${s}`).join('\n')
    : '- 输出无法解析为合法的 JSON 对象';
  return `你上一次的输出不符合要求，存在以下问题：
${bullet}

请对照原始简历文本修正后，【只】返回一个完整的、符合上述 JSON 格式的对象。
不要输出任何解释文字、不要输出 markdown 代码块标记、不要省略简历中存在的条目。`;
}