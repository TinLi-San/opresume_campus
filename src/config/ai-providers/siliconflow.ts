import type { AIProviderPreset } from '@/types';
import siliconflowIcon from '@/assets/icons/silicon.svg';

/**
 * 硅基流动（SiliconFlow）国内站
 * 来源：https://cloud.siliconflow.cn/models（模型目录），免费额度以平台为准
 *
 * 模型 ID 于 2026-08 实测校准（models.dev siliconflow-cn 目录交叉核对，
 * 验证时以 /v1/models?sub_type=chat 实时列表为准）。
 * 本表为「常用 + 高性价比」精选：主打社区热门开源模型，
 * Qwen3.5-4B 为目录中确认 ¥0 的免费模型；DeepSeek 为热门的国产闭源。
 */
const models: AIProviderPreset['models'] = [
  { id: 'Qwen/Qwen3.5-4B', name: 'Qwen3.5-4B', description: '免费模型（¥0），适合低成本批量生成', tags: ['free', 'chat'] },
  { id: 'deepseek-ai/DeepSeek-V4-Flash', name: 'DeepSeek-V4-Flash', description: '热门的国产闭源模型，通用质量好', tags: ['chat'] },
  { id: 'Qwen/Qwen3.5-27B', name: 'Qwen3.5-27B', description: '中杯开源模型，兼顾质量与成本', tags: ['chat'] },
  { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek-V3.2', description: '新版 DeepSeek，综合能力均衡', tags: ['chat'] },
];

const siliconflow: AIProviderPreset = {
  id: 'siliconflow',
  nameKey: 'provider.siliconflow',
  abbr: 'SF',
  brandColor: 'bg-violet-500',
  icon: siliconflowIcon,
  defaultApiUrl: 'https://api.siliconflow.cn',
  modelsEndpoint: '/v1/models?sub_type=chat',
  recommendedModel: 'Qwen/Qwen3.5-4B',
  apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
  website: 'https://siliconflow.cn',
  models,
};

export default siliconflow;