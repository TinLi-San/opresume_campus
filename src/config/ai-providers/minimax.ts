import type { AIProviderPreset } from '@/types';

/**
 * MiniMax（国产大模型平台，OpenAI 兼容接口）
 * 官方 OpenAI 兼容接入：Base URL https://api.minimaxi.com/v1（国内）/ https://api.minimax.io/v1（海外）
 *
 * 模型 ID 于 2026-08 实测校准（models.dev minimax-cn 与平台控制台一致）：
 * - 当前仅 M 系列（MiniMax-M*）；abab6.5s-chat 等旧模型已从平台模型列表移除，不再收录。
 */
const models: AIProviderPreset['models'] = [
  { id: 'MiniMax-M3', name: 'MiniMax-M3', tags: ['chat'] },
  { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', tags: ['chat'] },
  { id: 'MiniMax-M2.7-highspeed', name: 'MiniMax-M2.7-HighSpeed', tags: ['chat'] },
  { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5', tags: ['chat'] },
  { id: 'MiniMax-M2.5-highspeed', name: 'MiniMax-M2.5-HighSpeed', tags: ['chat'] },
  { id: 'MiniMax-M2.1', name: 'MiniMax-M2.1', tags: ['chat'] },
  { id: 'MiniMax-M2', name: 'MiniMax-M2', tags: ['chat'] },
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