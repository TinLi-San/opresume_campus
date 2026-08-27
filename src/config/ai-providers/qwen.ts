import type { AIProviderPreset } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';

/**
 * 千问（通义千问，阿里云百炼 DashScope）
 * 官方 OpenAI 兼容接入：Base URL https://dashscope.aliyuncs.com/compatible-mode/v1
 *
 * 模型 ID 于 2026-08 实测校准：
 * - 交叉核对阿里云百炼「模型大全」页（help.aliyun.com/zh/model-studio/models）与
 *   models.dev alibaba-cn 数据集，剔除不存在的名称；
 * - 注意：qwen-flash / qwen3.x-flash 并非免费模型（按量计费），不再标注 free；
 * - qwen3.8-flash / qwen3.7-flash / qwen3.5-flash 等新名称仅以官方文档出现时收录。
 */
const models: AIProviderPreset['models'] = [
  { id: 'qwen-plus', name: 'Qwen-Plus', tags: ['chat'] },
  { id: 'qwen-max', name: 'Qwen-Max', tags: ['chat'] },
  { id: 'qwen-turbo', name: 'Qwen-Turbo', tags: ['chat'] },
  { id: 'qwen-flash', name: 'Qwen-Flash', tags: ['chat'] },
  { id: 'qwen-long', name: 'Qwen-Long', tags: ['chat'] },
  { id: 'qwen3-max', name: 'Qwen3-Max', tags: ['chat'] },
  { id: 'qwen3.8-max', name: 'Qwen3.8-Max', tags: ['chat'] },
  { id: 'qwen3.7-max', name: 'Qwen3.7-Max', tags: ['chat'] },
  { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', tags: ['chat'] },
  { id: 'qwen3.7-flash', name: 'Qwen3.7-Flash', tags: ['chat'] },
  { id: 'qwen3.6-max-preview', name: 'Qwen3.6-Max-Preview', tags: ['chat'] },
  { id: 'qwen3.6-plus', name: 'Qwen3.6-Plus', tags: ['chat'] },
  { id: 'qwen3.6-flash', name: 'Qwen3.6-Flash', tags: ['chat'] },
  { id: 'qwen3.5-plus', name: 'Qwen3.5-Plus', tags: ['chat'] },
  { id: 'qwen3.5-flash', name: 'Qwen3.5-Flash', tags: ['chat'] },
  { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', tags: ['code', 'chat'] },
  { id: 'qwen3-coder-flash', name: 'Qwen3-Coder-Flash', tags: ['code', 'chat'] },
  { id: 'qwq-plus', name: 'QWQ-Plus（深度思考）', tags: ['reasoning'] },
];

const qwen: AIProviderPreset = {
  id: 'qwen',
  nameKey: 'provider.qwen',
  abbr: 'QW',
  brandColor: 'bg-fuchsia-600',
  icon: qwenIcon,
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
  recommendedModel: 'qwen-plus',
  apiKeyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
  website: 'https://dashscope.aliyun.com',
  models,
};

export default qwen;