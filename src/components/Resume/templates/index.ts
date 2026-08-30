/**
 * 模板自动注册中心。
 *
 * 使用 Vite 的 import.meta.glob 扫描当前目录下所有 template*.tsx 文件，
 * 每个文件必须 default export 一个 TemplateDefinition 对象。
 *
 * 自动注册只覆盖**渲染通路**（这里收集 definitions/templateIds）：
 * 新增模板仍需在两语言包（zh-CN.json / en-US.json）为 `template.${id}` 补显示名，
 * 否则模板选择器按 `template.${id}` 取文案时会回退成裸 id。完整清单见
 * `src/components/Resume/types.ts` 中 `TemplateDefinition` 的注释。
 */
import type { TemplateDefinition } from '../types';

const modules = import.meta.glob<{ default: TemplateDefinition }>(
  './template*.tsx',
  { eager: true },
);

/**
 * 所有已注册模板的映射表，键为 definition.id。
 * 由 glob 自动收集，按文件名排序保证顺序稳定。
 */
export const definitions: Record<string, TemplateDefinition> = {};

/** 模板 ID 有序列表，用于选择器等 UI 展示 */
export const templateIds: string[] = [];

// 按文件路径排序后依次注册，保证 template1 < template2 < ... 的稳定顺序
for (const path of Object.keys(modules).sort()) {
  const def = modules[path].default;
  definitions[def.id] = def;
  templateIds.push(def.id);
}

if (templateIds.length === 0) {
  throw new Error('未找到任何模板文件，请确认 templates/ 目录下存在 template*.tsx');
}

/** 第一个模板作为 fallback 默认值 */
export const defaultDefinition: TemplateDefinition = definitions[templateIds[0]];
