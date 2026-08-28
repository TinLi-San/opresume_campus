import type { AIProviderPreset } from '@/types';

/**
 * 小米 MiMo（Xiaomi MiMo 官方模型平台）
 * 官方 OpenAI 兼容接入：Base URL https://api.xiaomimimo.com/v1
 * 模型 ID 于 2026-08 实测校准：端点探测 401=鉴权正常；模型在售状态经平台确认——
 * **v2 系列（mimo-v2-pro / mimo-v2-flash）已下架**，不再收录；
 * 阿里云百炼官方页当前亦仅列出 mimo-v2.5-pro 一款 MiMo 模型，作为交叉佐证。
 *
 * 本表为「常用 + 高性价比」精选：v2.5（推荐）/ v2.5-pro；
 * ultraspeed（高价旗舰）与 omni（多模态非纯文本）变体不列出。
 */
const models: AIProviderPreset['models'] = [
  { id: 'mimo-v2.5', name: 'MiMo-V2.5', description: '默认推荐，日常生成性价比高', tags: ['chat'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', description: '更强推理与生成质量', tags: ['chat'] },
];

const mimo: AIProviderPreset = {
  id: 'mimo',
  nameKey: 'provider.mimo',
  abbr: 'MiMo',
  brandColor: 'bg-amber-500',
  defaultApiUrl: 'https://api.xiaomimimo.com',
  recommendedModel: 'mimo-v2.5',
  apiKeyUrl: '',
  website: 'https://www.xiaomimimo.com',
  models,
};

export default mimo;