import type { ModuleProps } from '../types';
import type { JsonPublication } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

export function AchievementModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('achievementList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'achievementList') || !config.publications?.length) return null;

  const allPublications = config.publications as JsonPublication[];
  const list = itemRange ? allPublications.slice(itemRange[0], itemRange[1]) : allPublications;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="achievementList">
      <section>
        {showTitle && <SectionTitle title={getTitle(config, 'achievementList', t('module.achievementList'))} icon={moduleIcon} />}
        {list.map((publication, i) => (
          <div
            key={publication['x-op-id'] ?? i}
            data-item-index={indexOffset + i}
            className={tokens.spacing.item}
          >
            {/* 第一行：标题 + 日期（支持内联/右对齐切换）*/}
            <div className={cn(
              tokens.typography.contentSize,
              !tokens.layout.awardTimeInline && 'flex justify-between',
              !tokens.layout.awardTimeInline && tokens.layout.flexAlign,
            )}>
              <span>{publication.name}</span>
              {publication.releaseDate && (
                tokens.layout.awardTimeInline
                  ? <span className={cn('ml-1', tokens.colors.muted)}>({publication.releaseDate})</span>
                  : <span className={cn('ml-2 shrink-0', tokens.colors.muted)}>{publication.releaseDate}</span>
              )}
            </div>

            {/* 第二行：类型 + 机构 + 编号（视觉降权）*/}
            {(publication['x-op-type'] || publication.publisher || publication['x-op-identifier']) && (
              <div className={cn('mt-0.5 flex items-center gap-2 text-sm', tokens.colors.muted)}>
                {publication['x-op-type'] && <span>{publication['x-op-type']}</span>}

                {publication.publisher && (
                  <>
                    {publication['x-op-type'] && <span>·</span>}
                    <span>{publication.publisher}</span>
                  </>
                )}

                {publication['x-op-identifier'] && (
                  <>
                    {(publication['x-op-type'] || publication.publisher) && <span>·</span>}
                    <span>{publication['x-op-identifier']}</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
