import type { AIProviderPreset } from '@/types';
import deepseekIcon from '@/assets/icons/deepseek.svg';

/**
 * DeepSeek 官方平台
 * 官方 OpenAI 兼容接入：Base URL https://api.deepseek.com（等价 https://api.deepseek.com/v1）
 *
 * 模型 ID 于 2026-08 实测校准：
 * - 官方定价页（api-docs.deepseek.com/quick_start/pricing）当前仅有 deepseek-v4-* 三个模型，
 *   全部支持 JSON Output / Tool Calls / 1M 上下文；
 * - 旧别名 deepseek-chat / deepseek-reasoner 已从官方模型列表移除，调用会报模型不存在，不再收录。
 */
const models: AIProviderPreset['models'] = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', tags: ['chat'] },
  { id: 'deepseek-v4-flash-vision-exp', name: 'DeepSeek-V4-Flash-Vision-Exp', tags: ['chat'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', tags: ['chat'] },
];

const deepseek: AIProviderPreset = {
  id: 'deepseek',
  nameKey: 'provider.deepseek',
  abbr: 'DS',
  brandColor: 'bg-blue-600',
  icon: deepseekIcon,
  defaultApiUrl: 'https://api.deepseek.com',
  recommendedModel: 'deepseek-v4-flash',
  apiKeyUrl: 'https://platform.deepseek.com/api_keys',
  website: 'https://www.deepseek.com',
  models,
};

export default deepseek;