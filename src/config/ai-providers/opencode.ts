import type { AIProviderPreset } from '@/types';

/**
 * OpenCode Go（opencode.ai「Go」订阅套餐，10 美元/月访问精选开源编程模型）
 * 官方文档：https://opencode.ai/docs/zh-cn/go
 * API 端点：https://opencode.ai/zen/go/v1/chat/completions（OpenAI 兼容，实测 401= 需鉴权）
 * 模型列表：https://opencode.ai/zen/go/v1/models（实测返回 OpenAI 格式 { data: [{ id }] }）
 *
 * ✅ 2026-08 实测校准（scripts/verify-provider-endpoints.ts + 直连 /v1/models 无鉴权可读）：
 * - 官方 /v1/models 实时返回 31 个模型（含 hy3-preview），本表只收录「常用 + 高性价比」
 *   子集（覆盖各家热门主力模型），不再罗列全部 27 个可用模型；
 * - grok-4.6 / gpt-5.6-luna 走 /v1/responses（官方文档标注），不适用本应用的
 *   chat/completions 请求格式，故不列出；grok-4.5、muse-spark-1.2-contributor
 *   端点类型未确认，同样不列出。
 * - ⚠️ 浏览器直连限制（已实测）：官方端点对 OPTIONS 预检返回 404、响应不带
 *   Access-Control-Allow-Origin，浏览器无法直连。曾用 Vercel AI Gateway 中转
 *   （https://ai-sdk-gateway.vercel.ai），但该网关已下线（全部返回
 *   DEPLOYMENT_NOT_FOUND，含 gateway.vercel.ai / ai-gateway.vercel.ai 变体）。
 *   因此：服务端/Node（本仓库 scripts/*.ts 测试脚本）可直连官方端点使用；
 *   浏览器端需自备 OpenAI 兼容 CORS 中转（在设置中添加自定义供应商，或恢复
 *   本预设的 relay 字段指向可用网关）。
 */
const models: AIProviderPreset['models'] = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', description: '默认推荐，通用编程性价比之选', tags: ['chat'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', description: '顶级编程与推理能力', tags: ['chat'] },
  { id: 'kimi-k3', name: 'Kimi-K3', description: '长上下文通用助手', tags: ['chat'] },
  { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', description: '专注代码生成的 Kimi 模型', tags: ['code', 'chat'] },
  { id: 'glm-5.3-flash', name: 'GLM-5.3-Flash', description: '轻量快速，高频调用成本低', tags: ['chat'] },
  { id: 'glm-5.3', name: 'GLM-5.3', description: '智谱最新旗舰，综合能力强', tags: ['chat'] },
  { id: 'qwen3.8-max', name: 'Qwen3.8-Max', description: '阿里最新旗舰大杯', tags: ['chat'] },
  { id: 'minimax-m3', name: 'MiniMax-M3', description: 'MiniMax 最新旗舰', tags: ['chat'] },
  { id: 'minimax-m2.7', name: 'MiniMax-M2.7', description: 'MiniMax 均衡主力', tags: ['chat'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', description: '小米增强版推理', tags: ['chat'] },
];

const opencode: AIProviderPreset = {
  id: 'opencode',
  nameKey: 'provider.opencode',
  abbr: 'OC',
  brandColor: 'bg-slate-900',
  defaultApiUrl: 'https://opencode.ai/zen/go',
  recommendedModel: 'deepseek-v4-flash',
  apiKeyUrl: 'https://opencode.ai/auth',
  website: 'https://opencode.ai',
  models,
};

export default opencode;