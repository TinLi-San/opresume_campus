import type { TemplateDefinition, LayoutShellProps } from '../types';
import { defineTokens } from '../tokens-defaults';
import { useTranslation } from 'react-i18next';
import {
  EditableSection,
  ResumeAvatar,
  calculateAge,
  getProfileIcon,
  useCustomFieldIconMap,
  ProfileField,
  usePrivacyMask,
} from '../shared';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useUIStore } from '@/store/ui';

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  const showIcons = useUIStore((s) => s.showIcons);
  return (
    <div className="mb-3 flex items-center gap-2">
      {showIcons && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-resume-primary text-white">
          <DynamicIcon name={icon} className="h-3.5 w-3.5" />
        </span>
      )}
      <h3 className="resume-title-text font-bold tracking-normal text-gray-900">{title}</h3>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function SidebarSectionTitle({ title, icon }: { title: string; icon?: string }) {
  const showIcons = useUIStore((s) => s.showIcons);
  return (
    <div className="mb-3 flex items-center gap-2">
      {showIcons && <DynamicIcon name={icon} className="h-3.5 w-3.5 shrink-0 text-white/70" />}
      <h3 className="resume-title-text font-bold tracking-normal text-white">{title}</h3>
      <div className="h-px flex-1 bg-white/25" />
    </div>
  );
}

const tokens = defineTokens({
  components: { SectionTitle },
  variants: { skill: 'tags', project: 'detailed', education: 'stacked' },
  layout: { awardTimeInline: false, flexAlign: 'items-start' },
});

/** 侧栏为深底（bg-resume-primary）：弱化色用 white/75（对默认主色 #2f5785 约 5.0:1，AA 达标） */
const sidebarTokens = defineTokens({
  components: { SectionTitle: SidebarSectionTitle },
  colors: { primary: 'text-white', secondary: 'text-white/85', muted: 'text-white/75' },
  variants: { skill: 'list', project: 'compact', education: 'stacked' },
  layout: { awardTimeInline: true, flexAlign: 'items-start' },
});

function Template6Shell({ config, sidebarContent, mainContent }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const age = calculateAge(config['x-op-birthday']);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <div className="flex min-h-[297mm]">
        <aside className="w-[64mm] shrink-0 bg-resume-primary px-5 py-7 text-white">
          <EditableSection module="profile">
            <div className="mb-6">
              <ResumeAvatar avatar={avatar} name={basics?.name} className="mb-4 ring-4 ring-white/20" />
              <h1 className="resume-name-text font-bold leading-tight text-white">{mask(basics?.name, 'name')}</h1>
              {basics?.label && <p className="mt-1 text-sm text-white/80">{basics.label}</p>}
            </div>

            <div className="space-y-2 text-xs text-white/85">
              {basics?.phone && <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>{mask(basics.phone, 'mobile')}</ProfileField>}
              {basics?.email && <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>{mask(basics.email, 'email')}</ProfileField>}
              {basics?.location?.city && <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>{mask(basics.location.city, 'workPlace')}</ProfileField>}
              {age !== null && !config['x-op-ageHidden'] && <ProfileField icon={getProfileIcon('age')} label={t('field.ageLabel')}>{t('field.age', { age })}</ProfileField>}
              {config['x-op-workExpYear'] && <ProfileField icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')}>{t('common.yearsExp', { years: config['x-op-workExpYear'] })}</ProfileField>}
              {config['x-op-customFields']?.filter((f) => f.key.trim() || f.value.trim()).map((field, i) => (
                <ProfileField key={`${field.key}-${i}`} icon={customFieldIconMap[field.key]} label={field.key}>{field.value}</ProfileField>
              ))}
            </div>
          </EditableSection>

          <div className="mt-4 text-white/90">
            {sidebarContent}
          </div>
        </aside>

        <main className="flex-1 px-7 py-7">
          {mainContent}
        </main>
      </div>
    </div>
  );
}

const definition: TemplateDefinition = {
  id: 'template6',
  tags: ['twoColumn', 'singlePage'],
  defaultLayout: {
    sidebar: ['skillList', 'educationList', 'awardList', 'achievementList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  getSidebarTokens: () => sidebarTokens,
  LayoutShell: Template6Shell,
};

export default definition;
