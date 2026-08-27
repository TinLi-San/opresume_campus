import type { AIProviderPreset } from '@/types';

/**
 * MiniMax（国产大模型平台，OpenAI 兼容接口）
 * 官方 OpenAI 兼容接入：Base URL https://api.minimaxi.com/v1（国内）/ https://api.minimax.io/v1（海外）
 *
 * 模型 ID 于 2026-08 实测校准（models.dev minimax-cn 与平台控制台一致）。
 * 本表为「常用 + 高性价比」精选：仅保留 M 系列中适合简历场景的
 * M3（旗舰）/ M2.7（推荐）/ M2.5（经济），M2 及以下旧代与 highspeed 变体不列出。
 */
const models: AIProviderPreset['models'] = [
  { id: 'MiniMax-M3', name: 'MiniMax-M3', description: '最新旗舰模型，综合能力最强', tags: ['chat'] },
  { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', description: '默认推荐，质量与成本均衡', tags: ['chat'] },
  { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5', description: '经济之选，日常生成性价比高', tags: ['chat'] },
];

const minimax: AIProviderPreset = {
  id: 'minimax',
  nameKey: 'provider.minimax',
  abbr: 'MX',
  brandColor: 'bg-orange-500',
  defaultApiUrl: 'https://api.minimaxi.com',
  recommendedModel: 'MiniMax-M2.7',
  apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
  website: 'https://www.minimaxi.com',
  models,
};

export default minimax;