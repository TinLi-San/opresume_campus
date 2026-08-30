import type { StyleTokens, TemplateDefinition } from './types';

/**
 * 中央默认样式令牌 — 所有模板共享的单一来源。
 *
 * 模板不再全量重声明 StyleTokens，而是通过 defineTokens() 只提供**差异**，
 * 由本文件与 BASE_STYLE_TOKENS 深合并（一级属性逐键合并）。
 *
 * 收敛约定（勿再漂移，改动需过 WCAG AA ≥4.5:1 检查）：
 * - typography.titleWeight 默认 'font-semibold'；
 * - colors.muted 默认 'text-gray-500'（#6b7280，白底 4.83:1），
 *   低于 gray-500 的弱化色（如 gray-400 ≈2.5:1）不得用于 14px 正文；
 * - colors.secondary 默认 'text-gray-600'；
 * - spacing.item 默认 'mb-2'（条目级间距；模块级间距是单轨 CSS 变量
 *   --resume-module-gap，不在令牌体系内）。
 */
export const BASE_STYLE_TOKENS: Omit<StyleTokens, 'components'> = {
  spacing: { item: 'mb-2' },
  typography: {
    titleWeight: 'font-semibold',
    titleSize: 'resume-title-text',
    contentSize: 'resume-body-text',
  },
  colors: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
  },
  variants: { skill: 'list', project: 'compact', education: 'stacked' },
  layout: { awardTimeInline: false, flexAlign: 'items-start' },
};

/** defineTokens() 的入参：各属性可局部覆盖，SectionTitle 为模板身份组件、必须提供 */
export interface TokensOverride {
  spacing?: Partial<StyleTokens['spacing']>;
  typography?: Partial<StyleTokens['typography']>;
  colors?: Partial<StyleTokens['colors']>;
  components: Pick<StyleTokens['components'], 'SectionTitle'>;
  variants?: Partial<StyleTokens['variants']>;
  layout?: Partial<StyleTokens['layout']>;
}

/** 差异 + 中央默认 → 完整 StyleTokens（一级键深合并） */
export function defineTokens(override: TokensOverride): StyleTokens {
  return {
    spacing: { ...BASE_STYLE_TOKENS.spacing, ...override.spacing },
    typography: { ...BASE_STYLE_TOKENS.typography, ...override.typography },
    colors: { ...BASE_STYLE_TOKENS.colors, ...override.colors },
    components: { ...override.components },
    variants: { ...BASE_STYLE_TOKENS.variants, ...override.variants },
    layout: { ...BASE_STYLE_TOKENS.layout, ...override.layout },
  };
}

/**
 * 便捷构造 TemplateDefinition：tokens 直接传差异（见 TokensOverride），
 * 其余字段与 TemplateDefinition 一致。
 */
export function defineTemplate(
  def: Omit<TemplateDefinition, 'getTokens' | 'getSidebarTokens'> & {
    tokens: TokensOverride;
    sidebarTokens?: TokensOverride;
  },
): TemplateDefinition {
  const tokens = defineTokens(def.tokens);
  const sidebarTokens = def.sidebarTokens ? defineTokens(def.sidebarTokens) : undefined;
  const { tokens: _t, sidebarTokens: _s, ...rest } = def;
  return {
    ...rest,
    getTokens: () => tokens,
    ...(sidebarTokens ? { getSidebarTokens: () => sidebarTokens } : {}),
  };
}
