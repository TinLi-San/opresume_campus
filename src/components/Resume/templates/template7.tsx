/**
 * Campus Fresh Graduate（校园应届生）模板（template7）
 *
 * 复刻《DHU_CV_Template.pdf》的整体框架：
 * - 左上角：学校 logo（用户上传的校徽 `x-op-schoolLogo.src`；未上传时用模板内置的
 *   默认校徽；`x-op-schoolLogo.hidden` 可整体隐藏，与证件照同一套处理方式）
 * - 右上角：证件照（`x-op-avatar`）
 * - 居中：姓名 + 联系信息
 * - 章节：主题色 Lucide 模块图标 + 黑色标题 + 主题色分隔线（主体色从校徽图片提取，**先排除
 *   空白/近白背景**再取主色；提取失败时回退「外观→主题色」的 --resume-primary）
 * - 页脚：主题色横条（色条与章节箭头/分隔线共用 --campus-primary，随校徽主色自适应）
 *
 * 校徽解析顺序（全程浏览器端、零网络依赖，不请求任何第三方资源）：
 *   1. 用户上传的校徽（`x-op-schoolLogo.src`，data URL）
 *   2. 模板内置默认校徽 /school-logos/dhu-logo.png
 */
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicIcon } from '@/components/DynamicIcon';
import type { TemplateDefinition, StyleTokens } from '../types';
import type { JsonResume } from '@/types/json-resume';
import { useUIStore } from '@/store/ui';
import {
  EditableSection,
  calculateAge,
  usePrivacyMask,
} from '../shared';
import { CAMPUS_TEMPLATE_ID, CampusSectionTitle } from '../modules/CampusModules';
import { loadSchoolLogoImage, extractAccentColorFromImage } from '../modules/campus-logo';
/* 模板自带示例简历：模板选择器的缩略图按模板取示例，共享示例（其他模板用）保持不动 */
import campusSampleZhCN from '@/config/sample-resume.campus.zh-CN.json';
import campusSampleEnUS from '@/config/sample-resume.campus.en-US.json';

/** 校园模板内置默认校徽（本地静态资源，随模板打包，不产生网络请求） */
const DEFAULT_SCHOOL_LOGO = '/school-logos/dhu-logo.png';

/* ------------------------------------------------------------------ */
/*  校徽解析：logo src + 主体色（浏览器端，零网络依赖）                 */
/* ------------------------------------------------------------------ */

/** 解析校徽来源与主体色；主体色为 null 时由 CSS 回退到主题色 --resume-primary */
function useSchoolLogo(config: JsonResume): { logoSrc: string; accent: string | null } {
  const uploadedSrc = config['x-op-schoolLogo']?.src ?? '';
  const logoSrc = uploadedSrc || DEFAULT_SCHOOL_LOGO;
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAccent(null);

    (async () => {
      try {
        const img = await loadSchoolLogoImage(logoSrc);
        if (cancelled) return;
        const color = extractAccentColorFromImage(img);
        if (color) setAccent(color);
      } catch {
        /* 图片加载失败/Canvas 污染：保持 null，由 CSS 回退主题色 */
      }
    })();

    return () => { cancelled = true; };
  }, [logoSrc]);

  return { logoSrc, accent };
}

/* ------------------------------------------------------------------ */
/*  头部（姓名 + 联系信息）                                            */
/* ------------------------------------------------------------------ */

function Header({ config }: { config: JsonResume }) {
  const { t } = useTranslation();
  const basics = config.basics;
  const mask = usePrivacyMask();
  const showIcons = useUIStore((s) => s.showIcons);
  const age = calculateAge(config['x-op-birthday']);
  const workPlace = basics?.location?.city || basics?.location?.region;
  const showAge = age !== null && !config['x-op-ageHidden'];
  const showLabel = !!basics?.label;

  const contactItem = (icon: string, children: ReactNode, href?: string) => (
    <span className="campus-contact-item">
      {showIcons && <DynamicIcon name={icon} className="campus-contact-icon h-3 w-3" />}
      {href ? (
        <a className="campus-contact-link" href={href}>{children}</a>
      ) : (
        <span>{children}</span>
      )}
    </span>
  );

  // ── 智能自动居中布局 ──────────────────────────────────────────
  // 三种模式：
  // 1. 不显示岗位，且隐藏年龄：地点/电话/邮箱/自定义直接在姓名下方一行居中；
  // 2. 不显示岗位：年龄+地点一行，电话+邮箱+自定义一行（两行居中版式）；
  // 3. 显示岗位：岗位放在姓名正下方，年龄/地点/电话/邮箱/自定义合并为一行居中。
  const customFields = (config['x-op-customFields'] ?? []).filter(
    (f) => (f.key ?? '').trim() || (f.value ?? '').trim(),
  );

  const hasLocation = !!workPlace;
  const hasPhone = !!basics?.phone;
  const hasEmail = !!basics?.email;
  const hasCustom = customFields.length > 0;
  const hasRow1 = showAge || hasLocation;
  const hasRow2 = hasPhone || hasEmail || hasCustom;
  const hasAnyContact = hasRow1 || hasRow2;

  return (
    <div className="campus-header">
      {/* 姓名行：始终独立一行居中 */}
      <div className="campus-header-name-row">
        <h1 className="campus-name">{mask(basics?.name, 'name') || ' '}</h1>
      </div>

      {/* 显示岗位时：岗位放在姓名正下方 */}
      {showLabel && (
        <div className="campus-header-role-line">
          <span className="campus-header-role">{basics.label}</span>
        </div>
      )}

      {/* 模式 3：显示岗位时，其余基础信息合并为一行 */}
      {showLabel && hasAnyContact && (
        <div className="campus-contact">
          {showAge && contactItem('Cake', t('field.age', { age }))}
          {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
          {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
          {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
          {customFields.map((f, i) => (
            <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
              <span>{f.key}：{f.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* 模式 2：不显示岗位时，沿用两行居中版式 */}
      {!showLabel && showAge && (
        <>
          {hasRow1 && (
            <div className="campus-contact">
              {showAge && contactItem('Cake', t('field.age', { age }))}
              {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
            </div>
          )}
          {hasRow2 && (
            <div className="campus-contact">
              {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
              {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
              {customFields.map((f, i) => (
                <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
                  <span>{f.key}：{f.value}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* 模式 1：不显示岗位且隐藏年龄时，剩余信息在姓名下方一行居中 */}
      {!showLabel && !showAge && hasAnyContact && (
        <div className="campus-contact">
          {workPlace && contactItem('MapPin', mask(workPlace, 'workPlace'))}
          {basics?.phone && contactItem('Phone', mask(basics.phone, 'mobile'))}
          {basics?.email && contactItem('Mail', mask(basics.email, 'email'), `mailto:${basics.email}`)}
          {customFields.map((f, i) => (
            <span key={`${f.key}-${i}`} className="campus-contact-item campus-contact-custom">
              <span>{f.key}：{f.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LayoutShell                                                       */
/* ------------------------------------------------------------------ */

function Template7Shell({ config, mainContent, pageIndex = 0 }: {
  config: JsonResume;
  sidebarContent?: ReactNode;
  mainContent: ReactNode;
  pageIndex?: number;
}) {
  const { t } = useTranslation();
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { logoSrc, accent } = useSchoolLogo(config);
  const logoHidden = config['x-op-schoolLogo']?.hidden === true;
  const isFirstPage = pageIndex === 0;
  const openEditor = useUIStore((s) => s.openEditor);

  // 主体色来源：默认取校徽主色（提取失败则不设内联变量，由 CSS 回退主题色）；
  // 选择 'theme' 时始终使用「外观→主题色」。
  const accentSource = config['x-op-campusAccent'] ?? 'logo';
  const style = accentSource === 'logo' && accent
    ? ({ '--campus-primary': accent } as CSSProperties)
    : undefined;

  return (
    <div className="campus-resume relative min-h-[297mm] w-[210mm] bg-white text-gray-900 shadow-lg print:shadow-none" style={style}>
      {/* 左上角校徽：点击打开 Profile 编辑器，与证件照同一套交互 */}
      {isFirstPage && !logoHidden && (
        <button
          type="button"
          className="campus-logo campus-editable-image"
          onClick={(e) => { e.stopPropagation(); openEditor('profile'); }}
          aria-label={t('field.schoolLogo')}
        >
          <img
            className="campus-logo-img"
            src={logoSrc}
            alt={config.education?.[0]?.institution ?? t('field.schoolLogo')}
          />
        </button>
      )}

      {/* 右上角证件照：点击打开 Profile 编辑器 */}
      {isFirstPage && avatar?.src && !avatar.hidden && (
        <button
          type="button"
          className="campus-photo campus-editable-image"
          onClick={(e) => { e.stopPropagation(); openEditor('profile'); }}
          aria-label={t('field.avatar')}
        >
          <img className="campus-photo-img" src={avatar.src} alt={basics?.name ?? t('field.avatar')} />
        </button>
      )}

      <div className="resume-padding">
        {isFirstPage && (
          <EditableSection module="profile">
            <Header config={config} />
          </EditableSection>
        )}
        {mainContent}
      </div>

      {/* 页脚主体色横条 */}
      <div className="campus-footer-bar" aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StyleTokens                                                       */
/*  注：本模板的 5 个覆盖渲染器（CampusModules.tsx）走 campus-* 固定类， */
/*  单页钳制优先于令牌；这里维护的是 aboutme/achievementList 等共享模块。 */
/*  模块级间距不在此声明——由全局单轨 CSS 变量 --resume-module-gap 控制， */
/*  故 spacing.module 用无实际边距的占位类（StyleTokens 要求该字段存在）。 */
/* ------------------------------------------------------------------ */

const tokens: StyleTokens = {
  spacing: { module: 'mb-0', item: 'campus-item-space' },
  typography: {
    titleWeight: 'font-semibold',
    titleSize: 'resume-title-text',
    contentSize: 'resume-body-text',
  },
  colors: { primary: 'text-gray-800', secondary: 'text-gray-600', muted: 'text-gray-500' },
  components: {
    SectionTitle: (props) => {
      const showIcons = useUIStore((s) => s.showIcons);
      return <CampusSectionTitle {...props} showIcons={showIcons} />;
    },
  },
  variants: { skill: 'list', project: 'detailed', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

/* ------------------------------------------------------------------ */
/*  export                                                            */
/* ------------------------------------------------------------------ */

const definition: TemplateDefinition = {
  id: CAMPUS_TEMPLATE_ID,
  tags: ['singleColumn', 'singlePage'],
  /* 固定单页版式：渲染器不分页（详见 types.ts 的 singlePage 说明） */
  singlePage: true,
  /* 本模板的示例数据是应届生简历（见 src/config/sample-resume.campus.*.json），
     用于模板选择器缩略图；共享示例面向通用场景，留给其余模板，互不影响。 */
  sampleResume: {
    'zh-CN': campusSampleZhCN as JsonResume,
    'en-US': campusSampleEnUS as JsonResume,
  },
  defaultLayout: {
    sidebar: [],
    main: [
      'educationList',
      /* 修读课程：复用现有「自定义模块」（x-op-customModules 中 id 固定为
         custom-campusCourses 的那一项，用内置的 markdown 编辑器编辑），
         无需为本模板新增编辑器类型。对应数据随默认/示例简历一起提供。 */
      'custom-campusCourses',
      'workExpList',
      'projectList',
      'skillList',
      'awardList',
      'aboutme',
      'achievementList',
    ],
  },
  getTokens: () => tokens,
  LayoutShell: Template7Shell,
};

export default definition;