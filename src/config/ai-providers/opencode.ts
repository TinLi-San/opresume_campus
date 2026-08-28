import type { AIProviderPreset } from '@/types';

/**
 * OpenCode Go（opencode.ai「Go」订阅套餐，10 美元/月访问精选开源编程模型）
 * 官方文档：https://opencode.ai/docs/zh-cn/go
 * 上游端点：https://opencode.ai/zen/go/v1（OpenAI 兼容，Authorization: Bearer
 * <OPENCODE_API_KEY>；/v1/models 无鉴权可读，chat 需鉴权，缺 key 返回 401）。
 *
 * ✅ 浏览器接入（2026-08 重构）：官方端点不支持浏览器 CORS（OPTIONS 预检 404、
 *   响应无 Access-Control-Allow-Origin），故本预设经**仓库内置同源代理**接入，
 *   与 DeepSeek Harness / mimo 等桌面端「标准 OpenAI 兼容 Bearer 调用」同构：
 *   - 请求地址为相对路径 /api/opencode（浏览器同源，无 CORS）；
 *   - 部署侧：vercel.json 的 rewrite 将 /api/opencode/* 转发到
 *     https://opencode.ai/zen/go/*（随仓库部署，Vercel 自动生效）；
 *   - 本地开发：vite.config.ts 的 server.proxy 做同样的映射。
 *   API Key 仍只保存在前端 localStorage（BYOK，与其他供应商一致），随请求
 *   Authorization 头原样转发给上游，无需自建中转服务。
 *
 * ✅ 模型口径（2026-08 实测，models.dev opencode-go 目录共 33 个 id，其中 8 个
 *   deprecated）：本表只收录「常用 + 高性价比」子集，全部为在售 id；grok-4.6 /
 *   gpt-5.6-luna 走 /v1/responses（官方文档标注），不适用 chat/completions，故不
 *   列出；grok-4.5、muse-spark-1.2-contributor 端点类型未确认，同样不列出。
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
  defaultApiUrl: '/api/opencode',
  recommendedModel: 'deepseek-v4-flash',
  apiKeyUrl: 'https://opencode.ai/auth',
  website: 'https://opencode.ai',
  models,
};

export default opencode;