import type { AIProviderPreset } from '@/types';

/**
 * 小米 MiMo（Xiaomi MiMo 官方模型平台）
 * 官方 OpenAI 兼容接入：Base URL https://api.xiaomimimo.com/v1
 * 模型 ID 于 2026-08 实测校准（models.dev xiaomi 目录与平台一致），端点探测 401=鉴权正常。
 * 本表为「常用 + 高性价比」精选：v2.5（推荐）/ v2.5-pro / v2-pro / v2-flash（快速轻量），
 * ultraspeed 与 omni 变体不列出。
 */
const models: AIProviderPreset['models'] = [
  { id: 'mimo-v2.5', name: 'MiMo-V2.5', description: '默认推荐，日常生成性价比高', tags: ['chat'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', description: '更强推理与生成质量', tags: ['chat'] },
  { id: 'mimo-v2-pro', name: 'MiMo-V2-Pro', description: '上一代旗舰，稳定可用', tags: ['chat'] },
  { id: 'mimo-v2-flash', name: 'MiMo-V2-Flash', description: '轻量快速，适合高频调用', tags: ['chat'] },
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