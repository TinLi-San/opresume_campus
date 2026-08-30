import type { ModuleProps } from '../types';
import type { JsonSkill } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

interface SkillListProps {
  skills: JsonSkill[];
  tokens: ModuleProps['tokens'];
  showLevel: boolean;
  /** 条目索引偏移（itemRange 切片续页时保持全局序号） */
  offset: number;
}

/** 分组技能渲染：组名（粗体）+ 标签一行多门（顿号连接，自然换行） */
function SkillGroupRow({
  skill,
  tokens,
  itemIndex,
}: {
  skill: JsonSkill;
  tokens: ModuleProps['tokens'];
  /** 该条目的全局序号（data-item-index，供分页测量） */
  itemIndex: number;
}) {
  const tags = skill.keywords ?? [];
  return (
    <div className={tokens.spacing.item} data-item-index={itemIndex}>
      <span className={cn(tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.primary)}>
        {skill.name}：
      </span>
      <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
        {tags.join('、')}
      </span>
    </div>
  );
}

function SkillBarList({ skills, tokens, showLevel, offset }: SkillListProps) {
  return (
    <>
      {skills.map((skill, i) =>
        skill.keywords?.length ? (
          <SkillGroupRow key={skill['x-op-id'] ?? i} skill={skill} tokens={tokens} itemIndex={offset + i} />
        ) : (
          <div key={skill['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={offset + i}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span>{skill.name}</span>
            </div>
            {showLevel && (
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-resume-primary"
                  style={{ width: `${skill['x-op-skillLevel'] ?? 0}%` }}
                />
              </div>
            )}
          </div>
        ),
      )}
    </>
  );
}

function SkillNumberList({ skills, tokens, showLevel, offset }: SkillListProps) {
  return (
    <ul className="list-inside space-y-1">
      {skills.map((skill, i) => (
        <li key={skill['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={offset + i}>
          {skill.keywords?.length ? (
            // 分组内容直接并入 li（避免嵌套条目造成重复 data-item-index）
            <span>
              <span className={cn(tokens.typography.titleWeight, tokens.colors.primary)}>{skill.name}：</span>
              <span className={tokens.colors.secondary}>{(skill.keywords ?? []).join('、')}</span>
            </span>
          ) : (
            <span className={cn(tokens.typography.contentSize, tokens.colors.primary)}>
              <span className={cn('mr-1 text-xs', tokens.typography.titleWeight, 'text-resume-primary')}>
                {offset + i + 1}.
              </span>
              {skill.name}
              {showLevel && skill.level && (
                <span className={cn('ml-1 text-xs', tokens.colors.muted)}>— {skill.level}</span>
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkillTagList({ skills, tokens, offset }: SkillListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) =>
        skill.keywords?.length ? (
          // 分组项：整组一个圆角标签（标签内顿号连接），保持一行多门
          <span
            key={skill['x-op-id'] ?? i}
            className={cn('rounded-full px-3 py-1', tokens.typography.contentSize, tokens.colors.primary)}
            style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 15%, transparent)' }}
            title={(skill.keywords ?? []).join('、')}
            data-item-index={offset + i}
          >
            {skill.name}: {(skill.keywords ?? []).join('、')}
          </span>
        ) : (
          <span
            key={skill['x-op-id'] ?? i}
            className={cn('rounded-full px-3 py-1', tokens.typography.contentSize, tokens.colors.primary)}
            style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 15%, transparent)' }}
            data-item-index={offset + i}
          >
            {skill.name}
          </span>
        ),
      )}
    </div>
  );
}

export function SkillModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('skillList');
  const allSkills = config.skills as JsonSkill[] | undefined;
  if (isHidden(config, 'skillList') || !allSkills?.length) return null;

  // 分页契约：与 Work/Project/Education 等列表模块一致——按 itemRange 切片，
  // 每个条目始终带 data-item-index（measureFromDOM 据此在条目边界拆分）。
  const list = itemRange ? allSkills.slice(itemRange[0], itemRange[1]) : allSkills;
  const offset = itemRange ? itemRange[0] : 0;

  const { SectionTitle } = tokens.components;
  // 「是否显示熟练度」开关：x-op-showSkillLevel（默认 true=跟随数据，原文无 level 自然不显示；
  // false=隐藏全部熟练度标识与进度条）
  const showLevel = config['x-op-showSkillLevel'] !== false;

  return (
    <EditableSection module="skillList">
      <div>
        {showTitle && <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} icon={moduleIcon} />}
        {tokens.variants.skill === 'bar' && <SkillBarList skills={list} tokens={tokens} showLevel={showLevel} offset={offset} />}
        {tokens.variants.skill === 'list' && <SkillNumberList skills={list} tokens={tokens} showLevel={showLevel} offset={offset} />}
        {tokens.variants.skill === 'tags' && <SkillTagList skills={list} tokens={tokens} showLevel={showLevel} offset={offset} />}
      </div>
    </EditableSection>
  );
}
