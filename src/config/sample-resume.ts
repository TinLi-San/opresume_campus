import type { JsonResume } from '@/types/json-resume';
import { definitions } from '@/components/Resume/templates';
import zhCN from './sample-resume.zh-CN.json';
import enUS from './sample-resume.en-US.json';

const sampleResumes: Record<string, JsonResume> = {
  'zh-CN': zhCN as JsonResume,
  'en-US': enUS as JsonResume,
};

/** 语言模糊匹配：'en' 匹配 'en-US'，'zh' 匹配 'zh-CN'，未知语言回退英文表 */
function pickByLang(samples: Record<string, JsonResume>, lang: string): JsonResume | undefined {
  if (lang in samples) return samples[lang];
  const prefix = lang.split('-')[0];
  if (prefix === 'zh') return samples['zh-CN'] ?? samples['en-US'];
  return samples['en-US'] ?? samples['zh-CN'];
}

/**
 * 根据语言获取示例简历数据。
 *
 * 模板可以自带示例数据（TemplateDefinition.sampleResume）——例如校园应届生模板
 * 的示例是应届生简历，而不是面向通用场景的共享示例。传入 templateId 时优先返回
 * 该模板自带的示例，未声明则回退共享示例，因此既有模板的行为完全不变。
 */
export function getSampleResume(lang: string, templateId?: string): JsonResume {
  const perTemplate = templateId ? definitions[templateId]?.sampleResume : undefined;
  return (
    (perTemplate && pickByLang(perTemplate, lang)) ||
    pickByLang(sampleResumes, lang) ||
    (enUS as JsonResume)
  );
}
