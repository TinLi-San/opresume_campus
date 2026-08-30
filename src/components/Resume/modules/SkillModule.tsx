import type { ModuleProps } from '../types';
import type { JsonSkill } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

interface SkillListProps {
  skills: JsonSkill[];
  tokens: ModuleProps['tokens'];
  showLevel: boolean;
}

/** 分组技能渲染：组名（粗体）+ 标签一行多门（顿号连接，自然换行） */
function SkillGroupRow({ skill, tokens }: { skill: JsonSkill; tokens: ModuleProps['tokens'] }) {
  const tags = skill.keywords ?? [];
  return (
    <div className={tokens.spacing.item}>
      <span className={cn(tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.primary)}>
        {skill.name}：
      </span>
      <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
        {tags.join('、')}
      </span>
    </div>
  );
}

function SkillBarList({ skills, tokens, showLevel }: SkillListProps) {
  return (
    <>
      {skills.map((skill, i) =>
        skill.keywords?.length ? (
          <SkillGroupRow key={skill['x-op-id'] ?? i} skill={skill} tokens={tokens} />
        ) : (
          <div key={skill['x-op-id'] ?? i} className={tokens.spacing.item}>
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

function SkillNumberList({ skills, tokens, showLevel }: SkillListProps) {
  return (
    <ul className="list-inside space-y-1">
      {skills.map((skill, i) => (
        <li key={skill['x-op-id'] ?? i} className={tokens.spacing.item}>
          {skill.keywords?.length ? (
            <SkillGroupRow skill={skill} tokens={tokens} />
          ) : (
            <span className={cn(tokens.typography.contentSize, tokens.colors.primary)}>
              <span className={cn('mr-1 text-xs', tokens.typography.titleWeight, 'text-resume-primary')}>
                {i + 1}.
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

function SkillTagList({ skills, tokens }: SkillListProps) {
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
          >
            {skill.name}: {(skill.keywords ?? []).join('、')}
          </span>
        ) : (
          <span
            key={skill['x-op-id'] ?? i}
            className={cn('rounded-full px-3 py-1', tokens.typography.contentSize, tokens.colors.primary)}
            style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 15%, transparent)' }}
          >
            {skill.name}
          </span>
        ),
      )}
    </div>
  );
}

export function SkillModule({ config, tokens, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('skillList');
  const skillList = config.skills as JsonSkill[] | undefined;
  if (isHidden(config, 'skillList') || !skillList?.length) return null;

  const { SectionTitle } = tokens.components;
  // 「是否显示熟练度」开关：x-op-showSkillLevel（默认 true=跟随数据，原文无 level 自然不显示；
  // false=隐藏全部熟练度标识与进度条）
  const showLevel = config['x-op-showSkillLevel'] !== false;

  return (
    <EditableSection module="skillList">
      <div className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} icon={moduleIcon} />}
        {tokens.variants.skill === 'bar' && <SkillBarList skills={skillList} tokens={tokens} showLevel={showLevel} />}
        {tokens.variants.skill === 'list' && <SkillNumberList skills={skillList} tokens={tokens} showLevel={showLevel} />}
        {tokens.variants.skill === 'tags' && <SkillTagList skills={skillList} tokens={tokens} showLevel={showLevel} />}
      </div>
    </EditableSection>
  );
}