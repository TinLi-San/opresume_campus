import type { AIProviderPreset } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';

/**
 * 千问（通义千问，阿里云百炼 DashScope）
 * 官方 OpenAI 兼容接入：Base URL https://dashscope.aliyuncs.com/compatible-mode/v1
 *
 * 模型 ID 于 2026-08 实测校准（交叉核对阿里云百炼「模型大全」页
 * help.aliyun.com/zh/model-studio/models 与 models.dev alibaba-cn 数据集）。
 *
 * 本表为「常用 + 高性价比」精选列表（应用场景：简历内容生成/润色），
 * 未罗列全部 Qwen3.x 变体；完整模型目录见官方模型大全页，
 * 运行期还会用 /v1/models 实测结果过滤。
 * - qwen-flash / qwen3.x-flash 并非免费模型（按量计费），不标注 free；
 * - reasoning 类模型（qwq-plus）按需选用，速度较慢。
 */
const models: AIProviderPreset['models'] = [
  { id: 'qwen-flash', name: 'Qwen-Flash', description: '轻量快速，成本最低，适合高频调用', tags: ['chat'] },
  { id: 'qwen-turbo', name: 'Qwen-Turbo', description: '速度快、价格低，日常问答性价比之选', tags: ['chat'] },
  { id: 'qwen-plus', name: 'Qwen-Plus', description: '默认推荐，综合质量与成本均衡', tags: ['chat'] },
  { id: 'qwen-long', name: 'Qwen-Long', description: '超长上下文（10M），适合整篇长文档处理', tags: ['chat'] },
  { id: 'qwen-max', name: 'Qwen-Max', description: '旗舰模型，复杂任务质量最高', tags: ['chat'] },
  { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', description: '代码生成与开发辅助', tags: ['code', 'chat'] },
  { id: 'qwq-plus', name: 'QWQ-Plus（深度思考）', description: '推理增强，适合复杂逻辑分析', tags: ['reasoning'] },
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