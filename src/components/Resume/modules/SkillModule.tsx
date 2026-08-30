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

/**
 * 分组技能条目（'list' 默认版）：组名（加粗主色）+ 关键词一行（正文色，顿号连接自然换行）。
 * 去掉此前的圆点/编号前缀，改用左右两端对齐的简洁列表，视觉更干净。
 */
function SkillGroupRow({
  skill,
  tokens,
  itemIndex,
  showLevel,
}: {
  skill: JsonSkill;
  tokens: ModuleProps['tokens'];
  itemIndex: number;
  showLevel: boolean;
}) {
  return (
    <div className={cn(tokens.spacing.item, 'flex items-baseline justify-between gap-3')} data-item-index={itemIndex}>
      <span className={cn(tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.primary, 'shrink-0')}>
        {skill.name}：
      </span>
      <span className={cn('min-w-0 flex-1 text-left', tokens.typography.contentSize, tokens.colors.secondary)}>
        {(skill.keywords ?? []).join('、')}
        {showLevel && skill.level && <span className={cn('ml-1', tokens.colors.muted)}>（{skill.level}）</span>}
      </span>
    </div>
  );
}

/** 单个技能条目（'list' 默认版）：主色技能名 + 可选熟练度标注。 */
function SkillRow({
  skill,
  tokens,
  itemIndex,
  showLevel,
}: {
  skill: JsonSkill;
  tokens: ModuleProps['tokens'];
  itemIndex: number;
  showLevel: boolean;
}) {
  return (
    <div className={cn(tokens.spacing.item, 'flex items-baseline gap-3')} data-item-index={itemIndex}>
      <span className={cn(tokens.typography.contentSize, tokens.colors.primary)}>{skill.name}</span>
      {showLevel && skill.level && <span className={cn(tokens.typography.contentSize, tokens.colors.muted)}>— {skill.level}</span>}
    </div>
  );
}

/** 'list' 变体：简洁分组/单项列表（流畅的第一视觉，条目间按 spacing.item 分隔） */
function SkillList({ skills, tokens, showLevel, offset }: SkillListProps) {
  return (
    <div>
      {skills.map((skill, i) =>
        skill.keywords?.length ? (
          <SkillGroupRow key={skill['x-op-id'] ?? i} skill={skill} tokens={tokens} itemIndex={offset + i} showLevel={showLevel} />
        ) : (
          <SkillRow key={skill['x-op-id'] ?? i} skill={skill} tokens={tokens} itemIndex={offset + i} showLevel={showLevel} />
        ),
      )}
    </div>
  );
}

/** 'bar' 变体：分组行 + 熟练度进度条（保留给需要可视化熟练度的模板） */
function SkillBarList({ skills, tokens, showLevel, offset }: SkillListProps) {
  return (
    <>
      {skills.map((skill, i) =>
        skill.keywords?.length ? (
          <SkillGroupRow key={skill['x-op-id'] ?? i} skill={skill} tokens={tokens} itemIndex={offset + i} showLevel={showLevel} />
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
        {tokens.variants.skill === 'list' && <SkillList skills={list} tokens={tokens} showLevel={showLevel} offset={offset} />}
      </div>
    </EditableSection>
  );
}
