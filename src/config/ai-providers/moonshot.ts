import type { AIProviderPreset } from '@/types';

/**
 * Kimi（月之暗面 Moonshot）
 * 官方 OpenAI 兼容接入：Base URL https://api.moonshot.cn（追加 /v1/chat/completions）
 *
 * 模型 ID 于 2026-08 实测校准，依据 Kimi 开放平台官方「模型列表」
 * （platform.kimi.com/docs/models.md）：
 * - 当前开放：kimi-k3 / kimi-k2.7-code / kimi-k2.7-code-highspeed / kimi-k2.6 / kimi-k2.5；
 * - 已移除：kimi-latest（平台从未提供该模型名）、kimi-k2-thinking（kimi-k2 系列已下线）、
 *   moonshot-v1-*（已停止向新注册用户开放，全平台 8 月 31 日下线）。
 */
const models: AIProviderPreset['models'] = [
  { id: 'kimi-k3', name: 'Kimi-K3', tags: ['chat'] },
  { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', tags: ['code', 'chat'] },
  { id: 'kimi-k2.7-code-highspeed', name: 'Kimi-K2.7-Code-HighSpeed', tags: ['code', 'chat'] },
  { id: 'kimi-k2.6', name: 'Kimi-K2.6', tags: ['chat'] },
  { id: 'kimi-k2.5', name: 'Kimi-K2.5', tags: ['chat'] },
];

const moonshot: AIProviderPreset = {
  id: 'moonshot',
  nameKey: 'provider.moonshot',
  abbr: 'MK',
  brandColor: 'bg-slate-700',
  defaultApiUrl: 'https://api.moonshot.cn',
  recommendedModel: 'kimi-k3',
  apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
  website: 'https://www.moonshot.cn',
  models,
};

export default moonshot;