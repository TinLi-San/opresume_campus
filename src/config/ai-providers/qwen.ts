import type { AIProviderPreset } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';

/**
 * 千问（通义千问，阿里云百炼 DashScope）
 * 官方 OpenAI 兼容接入：Base URL https://dashscope.aliyuncs.com/compatible-mode/v1
 *
 * 模型 ID 于 2026-08 对照阿里云百炼「模型大全」官方页
 * （help.aliyun.com/zh/model-studio/models）实测校准：
 * 当前官方在售的文本生成模型为 qwen3.8-max / qwen3.7-plus / qwen3.8-flash；
 * 旧的 qwen-flash / qwen-turbo / qwen-plus / qwen-max / qwen-long、
 * qwen3-coder-plus、qwq-plus 等档位已不在官方模型列表，不再收录。
 *
 * 说明：
 * - 运行期仍会以 /v1/models 实测结果再过滤一次，显示名称与官方 ID 一致；
 * - qwen3.8-flash 等并非免费模型（按量计费），不标注 free；
 * - models.dev alibaba-cn 数据集更新滞后（暂缺 qwen3.8-flash），自检以官方页为准。
 */
const models: AIProviderPreset['models'] = [
  { id: 'qwen3.8-max', name: 'Qwen3.8-Max', description: '旗舰模型，复杂任务质量最高', tags: ['chat'] },
  { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', description: '默认推荐，综合质量与成本均衡', tags: ['chat'] },
  { id: 'qwen3.8-flash', name: 'Qwen3.8-Flash', description: '轻量快速，成本最低，适合高频调用', tags: ['chat'] },
];

const qwen: AIProviderPreset = {
  id: 'qwen',
  nameKey: 'provider.qwen',
  abbr: 'QW',
  brandColor: 'bg-fuchsia-600',
  icon: qwenIcon,
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
  recommendedModel: 'qwen3.7-plus',
  apiKeyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
  website: 'https://dashscope.aliyun.com',
  models,
};

export default qwen;