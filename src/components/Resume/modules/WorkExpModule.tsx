import type { ModuleProps } from '../types';
import type { JsonWork } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, PolishHost, TimeRange, getTitle, isHidden, useModuleIcon, usePrivacyMask } from '../shared';

export function WorkExpModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('workExpList');
  const { SectionTitle } = tokens.components;
  const mask = usePrivacyMask();
  if (isHidden(config, 'workExpList') || !config.work?.length) return null;

  const allWork = config.work as JsonWork[];
  const list = itemRange ? allWork.slice(itemRange[0], itemRange[1]) : allWork;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="workExpList">
      <section>
        {showTitle && <SectionTitle title={getTitle(config, 'workExpList', t('module.workExpList'))} icon={moduleIcon} />}
        {list.map((work, i) => (
          <div key={work['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {mask(work.name, 'companyName')}
                </p>
                {/* P1-8 修复：岗位名称必须渲染（导入端 position 已正确映射，此前渲染层丢失） */}
                {work.position && (
                  <p className={cn(tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.secondary)}>
                    {mask(work.position, 'position')}
                  </p>
                )}
                {work['x-op-departmentName'] && (
                  <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                    {mask(work['x-op-departmentName'], 'departmentName')}
                  </p>
                )}
              </div>
              <TimeRange startDate={work.startDate} endDate={work.endDate} />
            </div>
            {work['x-op-workDescHtml'] && (
              <PolishHost className="mt-1" itemIndex={indexOffset + i}>
                <RichContent content={work['x-op-workDescHtml']} textSize={tokens.typography.contentSize} />
              </PolishHost>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
