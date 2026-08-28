/**
 * AI provider 模型列表核对脚本（无需 API key）
 *
 * 目的：把 src/config/ai-providers/*.ts 中手写的预设模型 ID 与真实数据源交叉核对：
 * - models.dev 数据集（https://models.dev/api.json，各厂商官方模型的聚合）；CN 站取对应
 *   -cn 分组（bailing / alibaba-cn / moonshotai-cn / minimax-cn / siliconflow-cn / xiaomi）；
 * - qwen 额外合并阿里云百炼「模型大全」官方页（help.aliyun.com/zh/model-studio/models）——
 *   models.dev alibaba-cn 更新滞后（如暂缺 qwen3.8-flash），以官方页为第一手真值；
 * - opencode 走其公开 /v1/models 端点（实测无需鉴权，200）。
 *
 * 用法：
 *   node scripts/verify-model-lists.ts            # 打印差异报告
 *   node scripts/verify-model-lists.ts --strict   # 任一预设 ID 不在真值表 → 退出码 1
 *
 * 输出判定：
 * - 「不在官方列表」→ 预设里写了官方列表没有的 ID（应删除或核实后更新）
 * - 「官方列表有但预设缺」→ 仅供参考（官方列表包含图像/音频等非 chat 模型）
 */
import fs from 'node:fs';
import path from 'node:path';

const PROVIDERS_DIR = path.resolve(import.meta.dirname, '../src/config/ai-providers');
const PRESET_IDS = ['qwen', 'deepseek', 'siliconflow', 'moonshot', 'minimax', 'mimo', 'opencode'];

/** models.dev 分组 → 我们的 provider id */
const MDEV_KEY: Record<string, string> = {
  qwen: 'alibaba-cn',
  deepseek: 'deepseek',
  siliconflow: 'siliconflow-cn',
  moonshot: 'moonshotai-cn',
  minimax: 'minimax-cn',
  mimo: 'xiaomi',
};

/** 从预设文件解析 models 数组中的 ID 列表 */
function readPresetIds(id: string): string[] {
  const src = fs.readFileSync(path.join(PROVIDERS_DIR, `${id}.ts`), 'utf-8');
  const block = src.match(/const models[^=]*=[\s\S]*?\n\];/)?.[0] ?? '';
  const ids: string[] = [];
  const re = /\bid:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) ids.push(m[1]);
  return ids;
}

async function fetchModelsDev(): Promise<Record<string, { models: Record<string, unknown> }>> {
  const res = await fetch('https://models.dev/api.json', { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`models.dev HTTP ${res.status}`);
  return res.json() as Promise<Record<string, { models: Record<string, unknown> }>>;
}

/**
 * 从阿里云百炼「模型大全」官方页提取当前模型 ID（qwen 的第一手真值源）。
 * models.dev 的 alibaba-cn 分组更新滞后（如暂缺 qwen3.8-flash），两者合并使用。
 */
async function fetchAliyunModelIds(): Promise<string[]> {
  const res = await fetch('https://help.aliyun.com/zh/model-studio/models', {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`help.aliyun.com HTTP ${res.status}`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const ids = new Set<string>();
  for (const m of text.matchAll(/\bqwen[\w.\-]*\b|\bqwq[\w.\-]*\b/g)) ids.add(m[0]);
  return [...ids];
}

interface Diff {
  notInTruth: string[];
  missingFromPreset: string[];
}

function diff(presetIds: string[], truthIds: string[]): Diff {
  const truth = new Set(truthIds);
  return {
    notInTruth: presetIds.filter((id) => !truth.has(id)),
    missing: truthIds.filter((id) => !presetIds.includes(id)).sort(),
  };
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const md = await fetchModelsDev();
  const reports: Array<{ id: string; source: string; notInTruth: string[]; missing: string[]; total: number }> = [];

  for (const id of PRESET_IDS) {
    const presetIds = readPresetIds(id);
    let truthIds: string[];
    let source: string;
    if (id === 'opencode') {
      const res = await fetch('https://opencode.ai/zen/go/v1/models', { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`opencode /v1/models HTTP ${res.status}`);
      const json = (await res.json()) as { data: Array<{ id: string }> };
      truthIds = json.data.map((m) => m.id);
      source = 'opencode.ai/zen/go/v1/models（实测 200）';
    } else if (id === 'qwen') {
      // 百炼官方页为第一手真值，models.dev alibaba-cn 合并兜底（滞后风险）
      const official = await fetchAliyunModelIds();
      truthIds = [...new Set([...official, ...Object.keys(md['alibaba-cn']?.models ?? {})])];
      source = '阿里云百炼模型大全官方页 + models.dev alibaba-cn';
    } else {
      const key = MDEV_KEY[id];
      truthIds = md[key] ? Object.keys(md[key].models) : [];
      source = `models.dev ${key}`;
    }
    const d = diff(presetIds, truthIds);
    reports.push({ id, source, notInTruth: d.notInTruth, missing: d.missing, total: truthIds.length });
  }

  console.log('\n=== AI provider 模型列表核对 ===\n');
  let bad = 0;
  for (const r of reports) {
    console.log(`\n[${r.id}] 真值源: ${r.source}（${r.total} 个模型）`);
    if (r.notInTruth.length === 0) {
      console.log('  ✓ 预设中的模型全部存在于官方列表');
    } else {
      bad += 1;
      console.log(`  ✗ 预设中存在但官方列表没有（疑似错误名称）: ${r.notInTruth.join(', ')}`);
    }
    if (r.missing.length > 0) {
      console.log(`  ~ 官方列表有但预设未收录（仅供参考）: ${r.missing.slice(0, 40).join(', ')}${r.missing.length > 40 ? ' …' : ''}`);
    }
  }

  console.log(`\nsummary: ${reports.length - bad}/${reports.length} provider presets fully consistent`);
  if (strict && bad > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('verify-model-lists failed:', e);
  process.exitCode = 1;
});