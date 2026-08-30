import type { ModuleLayout } from '@/types/resume';
import { definitions, defaultDefinition } from '@/components/Resume/templates';

/**
 * 每个模板的默认模块布局，从模板定义的 defaultLayout 字段自动派生。
 * 新增模板时无需修改此文件——只要模板文件声明了 defaultLayout 即可。
 *
 * profile 不在此列——它固定在侧栏首位，不参与拖拽排序。
 */
export const DEFAULT_LAYOUTS: Record<string, ModuleLayout> = Object.fromEntries(
  Object.values(definitions).map((def) => [def.id, def.defaultLayout]),
);

/** 模板是否支持双栏布局（sidebar 非空即为双栏） */
export function isTwoColumnTemplate(template: string): boolean {
  const layout = DEFAULT_LAYOUTS[template];
  return layout ? layout.sidebar.length > 0 : true;
}

/**
 * 获取当前生效的布局：用户自定义 > 模板默认。
 *
 * 当用户保存过自定义布局（custom）时，会做**增量合并**：把模板默认布局中「有、但用户布局缺失」的
 * 模块按默认顺序追加到对应列末尾，使新增栏目/新模板对存量用户自动生效（保留用户已排顺序）。
 * 注意：无法区分「主动移除」与「尚未出现」的默认模块，前者会随模板更新被重新追加（当前约定取舍）。
 */
export function getEffectiveLayout(
  template: string,
  moduleLayout?: Record<string, ModuleLayout>,
): ModuleLayout {
  const defaults = DEFAULT_LAYOUTS[template] ?? defaultDefinition.defaultLayout;
  const custom = moduleLayout?.[template];
  if (!custom) return defaults;
  // 无数据模块渲染为 null，追加空模块无害；自定义栏目（x-op-customModules）保留不动。
  const missingSidebar = defaults.sidebar.filter((m) => !custom.sidebar.includes(m));
  const missingMain = defaults.main.filter((m) => !custom.main.includes(m));
  return {
    sidebar: [...custom.sidebar, ...missingSidebar],
    main: [...custom.main, ...missingMain],
  };
}

/** 所有可排序的模块 ID（不含 profile） */
export const SORTABLE_MODULES = [
  'educationList',
  'workExpList',
  'projectList',
  'skillList',
  'awardList',
  'achievementList',
  'workList',
  'aboutme',
] as const;

/** 标题字号范围（px） */
export const TITLE_FONT_SIZE_RANGE = { min: 16, max: 24 } as const;

/** 正文字号范围（px） */
export const BODY_FONT_SIZE_RANGE = { min: 12, max: 16 } as const;
