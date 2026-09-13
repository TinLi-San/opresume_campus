import type { ReactNode, ComponentType } from 'react';
import type { JsonResume } from '@/types/json-resume';
import type { ModuleLayout } from '@/types/resume';

/** 样式令牌 — 控制共享模块的视觉差异 */
export interface StyleTokens {
  spacing: {
    module: string;
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
 * 新增模板只需在 templates/ 目录下新建文件并 default export 此接口的实现，
 * 即可被 import.meta.glob 自动发现和注册，无需手动修改其他文件。
 */
export interface TemplateDefinition {
  /** 模板唯一标识，同时用作 i18n 键名（`template.${id}`）和布局配置键 */
  id: string;
  /** 模板特征标签，值为 i18n 键名后缀（完整键名 `templateTag.${tag}`） */
  tags: string[];
  /** 默认模块布局：sidebar 和 main 各放哪些模块（不含 profile） */
  defaultLayout: ModuleLayout;
  /**
   * 模板为固定单页版式：渲染器不做分页（如校园应届生 A4 一页模板）。
   * 与 `tags` 里的 'singlePage' 是两件事——后者只是模板选择器上的展示标签。
   */
  singlePage?: boolean;
  /**
   * 模板自带的示例简历（可选，键为语言代码，如 'zh-CN' / 'en-US'）。
   *
   * 用于「按模板展示示例数据」的场景（模板选择器缩略图等）：例如校园应届生
   * 模板应当用应届生示例，而共享示例（src/config/sample-resume.*.json）是给
   * 其他模板用的通用示例。未声明时回退共享示例，故新增模板不会影响既有模板。
   */
  sampleResume?: Record<string, JsonResume>;
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
