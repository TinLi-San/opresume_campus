import type { AIProviderPreset } from '@/types';
import siliconflowIcon from '@/assets/icons/silicon.svg';

/**
 * 硅基流动（SiliconFlow）国内站
 * 来源：https://cloud.siliconflow.cn/models（模型目录），免费额度以平台为准
 *
 * 模型 ID 于 2026-08 实测校准（models.dev siliconflow-cn 目录交叉核对，
 * 验证时以 /v1/models?sub_type=chat 实时列表为准）：
 * - 已移除：deepseek-ai/DeepSeek-R1-0528-Qwen3-8B、deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
 *   （已不在平台模型目录）；
 * - free 仅标注目录中确认 ¥0 的 Qwen/Qwen3.5-4B。
 */
const models: AIProviderPreset['models'] = [
  { id: 'Qwen/Qwen3.5-4B', name: 'Qwen3.5-4B', tags: ['free', 'chat'] },
  { id: 'deepseek-ai/DeepSeek-V4-Flash', name: 'DeepSeek-V4-Flash', tags: ['chat'] },
  { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek-V3.2', tags: ['chat'] },
  { id: 'Qwen/Qwen3.5-27B', name: 'Qwen3.5-27B', tags: ['chat'] },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B', tags: ['chat'] },
  { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct', tags: ['chat'] },
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
