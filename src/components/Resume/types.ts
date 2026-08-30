import type { ReactNode, ComponentType } from 'react';
import type { JsonResume } from '@/types/json-resume';
import type { ModuleLayout } from '@/types/resume';

/**
 * 样式令牌 — 控制共享模块的视觉差异。
 *
 * 默认值集中在 `tokens-defaults.ts` 的 BASE_STYLE_TOKENS，模板经 defineTokens()
 * 只声明差异部分（深合并），不要再全量重声明。
 *
 * 注意：模块间距是**单轨机制**——由外观设置驱动的全局 CSS 变量
 * `--resume-module-gap` 控制（见 index.css `div.resume-module > div > section`），
 * 不属于本令牌；这里只保留条目级间距 spacing.item。
 */
export interface StyleTokens {
  spacing: {
    item: string;
  };
  typography: {
    titleWeight: string;
    titleSize: string;
    contentSize: string;
  };
  colors: {
    primary: string;
    secondary: string;
    muted: string;
  };
  components: {
    SectionTitle: ComponentType<{ title: string; icon?: string }>;
  };
  variants: {
    skill: 'bar' | 'list' | 'tags';
    project: 'compact' | 'detailed';
    education: 'inline' | 'stacked';
  };
  layout: {
    awardTimeInline: boolean;
    flexAlign: string;
  };
}

/** 共享模块组件的 props */
export interface ModuleProps {
  config: JsonResume;
  tokens: StyleTokens;
  /** 列表型模块的条目渲染范围 [start, end)，默认渲染全部 */
  itemRange?: [number, number];
  /** 是否显示模块标题（跨页续渲时为 false），默认 true */
  showTitle?: boolean;
}

/**
 * 模板定义 — 每个模板实现此接口。
 *
 * 新增模板的完整清单（不是 1 个文件！）：
 *   1. 在 templates/ 目录新建 templateN.tsx，default export 本接口
 *      （import.meta.glob 会自动注册渲染通路，这一步确实零接线）；
 *   2. 在 zh-CN.json / en-US.json 的 `template` 组补 `template.${id}` 键
 *      （模板选择器按 `template.${id}` 取显示名，缺键时只能回退裸 id）；
 *   3. 若使用带 `templateTag.${tag}` 的新标签，同样需要两语言键。
 * tokens 用 defineTokens(差异) 声明，公共默认见 tokens-defaults.ts。
 */
export interface TemplateDefinition {
  /** 模板唯一标识，同时用作 i18n 键名（`template.${id}`）和布局配置键 */
  id: string;
  /** 模板特征标签，值为 i18n 键名后缀（完整键名 `templateTag.${tag}`） */
  tags: string[];
  /** 默认模块布局：sidebar 和 main 各放哪些模块（不含 profile） */
  defaultLayout: ModuleLayout;
  getTokens: () => StyleTokens;
  /** 侧栏专用 tokens，未提供时回退到 getTokens() */
  getSidebarTokens?: () => StyleTokens;
  LayoutShell: ComponentType<LayoutShellProps>;
}

/** 布局壳 props */
export interface LayoutShellProps {
  config: JsonResume;
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  /** 页码索引（0 = 首页含 Profile，1+ = 续页不含 Profile），默认 0 */
  pageIndex?: number;
}
