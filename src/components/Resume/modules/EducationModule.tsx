import type { ModuleProps } from '../types';
import type { JsonEducation } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon, usePrivacyMask } from '../shared';

export function EducationModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('educationList');
  const { SectionTitle } = tokens.components;
  const mask = usePrivacyMask();
  if (isHidden(config, 'educationList') || !config.education?.length) return null;

  const isInline = tokens.variants.education === 'inline';
  const allEdu = config.education as JsonEducation[];
  const list = itemRange ? allEdu.slice(itemRange[0], itemRange[1]) : allEdu;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="educationList">
      <section className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} icon={moduleIcon} />}
        {list.map((edu, i) => (
          <div
            key={edu['x-op-id'] ?? i}
            className={cn(tokens.spacing.item, isInline && 'flex items-baseline justify-between')}
            data-item-index={indexOffset + i}
          >
            <div className={cn(isInline && 'flex items-baseline gap-2')}>
              <p className={cn(isInline ? tokens.typography.titleSize : tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                {mask(edu.institution, 'school')}
              </p>
              {isInline ? (
                <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {edu.area}{edu.studyType && ` · ${edu.studyType}`}
                  {/* P1-9 修复：GPA/成绩以括号+熟练度样式展示 */}
                  {edu.score && (
                    <span className={cn('ml-1 text-xs', tokens.colors.muted)}>（{edu.score}）</span>
                  )}
                </span>
              ) : (
                <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {edu.area}{edu.studyType && ` · ${edu.studyType}`}
                  {edu.score && (
                    <span className={cn('ml-1 text-xs', tokens.colors.muted)}>（{edu.score}）</span>
                  )}
                </p>
              )}
            </div>
            <TimeRange startDate={edu.startDate} endDate={edu.endDate} />
            {/* P1-12 修复：修读课程一行多门（顿号连接，自然换行），避免每门独占一行 */}
            {Array.isArray(edu.courses) && edu.courses.length > 0 && (
              <p className={cn('mt-0.5', tokens.typography.contentSize, tokens.colors.secondary)}>
                <span className={cn(tokens.typography.titleWeight, tokens.colors.secondary)}>
                  {t('field.courses')}：
                </span>
                {edu.courses.join('、')}
              </p>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
