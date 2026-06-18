import type { TemplateDefinition, StyleTokens, LayoutShellProps } from '../types';
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
    <div className="mb-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <h3 className="flex shrink-0 items-center gap-1.5 resume-title-text font-bold text-gray-800">
        {showIcons && <DynamicIcon name={icon} className="h-3.5 w-3.5 text-resume-primary" />}
        {title}
      </h3>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

const tokens: StyleTokens = {
  spacing: { module: 'mb-5', item: 'mb-3' },
  typography: { titleWeight: 'font-semibold', titleSize: 'resume-title-text', contentSize: 'resume-body-text' },
  colors: { primary: 'text-gray-900', secondary: 'text-gray-600', muted: 'text-gray-500' },
  components: { SectionTitle },
  variants: { skill: 'list', project: 'compact', education: 'inline' },
  layout: { awardTimeInline: true, flexAlign: 'items-baseline' },
};

function Template5Shell({ config, mainContent, pageIndex = 0 }: LayoutShellProps) {
  const basics = config.basics;
  const avatar = config['x-op-avatar'];
  const { t } = useTranslation();
  const age = calculateAge(config['x-op-birthday']);
  const customFieldIconMap = useCustomFieldIconMap();
  const mask = usePrivacyMask();

  return (
    <div className="min-h-[297mm] w-[210mm] bg-white text-gray-800 shadow-lg print:shadow-none">
      <div className="resume-padding">
        {pageIndex === 0 && (
          <EditableSection module="profile">
            <header className="mb-5 text-center">
              <ResumeAvatar avatar={avatar} name={basics?.name} className="mx-auto mb-2" />
              <h1 className="resume-name-text font-bold tracking-normal text-gray-950">{mask(basics?.name, 'name')}</h1>
              {basics?.label && <p className="mt-1 text-sm text-gray-600">{basics.label}</p>}

              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
                {basics?.phone && <ProfileField icon={getProfileIcon('mobile')} label={t('field.mobile')}>{mask(basics.phone, 'mobile')}</ProfileField>}
                {basics?.email && <ProfileField icon={getProfileIcon('email')} label={t('field.email')}>{mask(basics.email, 'email')}</ProfileField>}
                {basics?.location?.city && <ProfileField icon={getProfileIcon('workPlace')} label={t('field.workPlace')}>{mask(basics.location.city, 'workPlace')}</ProfileField>}
                {age !== null && !config['x-op-ageHidden'] && <ProfileField icon={getProfileIcon('age')} label={t('field.ageLabel')}>{t('field.age', { age })}</ProfileField>}
                {config['x-op-workExpYear'] && <ProfileField icon={getProfileIcon('workExpYear')} label={t('field.workExpYear')}>{t('common.yearsExp', { years: config['x-op-workExpYear'] })}</ProfileField>}
                {config['x-op-customFields']?.filter((f) => f.key.trim() || f.value.trim()).map((field, i) => (
                  <ProfileField key={`${field.key}-${i}`} icon={customFieldIconMap[field.key]} label={field.key}>{field.value}</ProfileField>
                ))}
              </div>
            </header>
          </EditableSection>
        )}
        <main>{mainContent}</main>
      </div>
    </div>
  );
}

const definition: TemplateDefinition = {
  id: 'template5',
  tags: ['singleColumn', 'multiPage'],
  defaultLayout: {
    sidebar: [],
    main: ['skillList', 'workExpList', 'projectList', 'educationList', 'awardList', 'achievementList', 'workList', 'aboutme'],
  },
  getTokens: () => tokens,
  LayoutShell: Template5Shell,
};

export default definition;
