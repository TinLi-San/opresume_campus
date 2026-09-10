import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { trackClarityEvent } from '@/utils/clarity';
import { markStarPromptClicked, markStarPromptDismissed } from '@/utils/star-prompt';

const GITHUB_REPO_URL = 'https://github.com/oopooa/opresume';

/**
 * 「Star 支持」提示卡片：导出 PDF 完成后延迟数秒在页面正中浮现。
 */
export function StarPromptCard() {
  const { t } = useTranslation();
  const open = useUIStore((s) => s.starPromptOpen);
  const closeStarPrompt = useUIStore((s) => s.closeStarPrompt);
  // 减少动画偏好 → 退化为无动画直接呈现，避免对前庭敏感用户造成不适
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) trackClarityEvent('star_prompt_shown');
  }, [open]);

  const handleDismiss = (reason: 'dismissed' | 'later') => {
    markStarPromptDismissed();
    trackClarityEvent(reason === 'later' ? 'star_prompt_later' : 'star_prompt_dismissed');
    closeStarPrompt();
  };

  const handleStarClick = () => {
    markStarPromptClicked();
    trackClarityEvent('star_prompt_clicked');
    closeStarPrompt();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center print:hidden"
          // 卡片整体过渡：淡入上浮进入、下滑淡出退出；reduceMotion 用户直接呈现无动画
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion
              ? undefined
              : {
                  opacity: 0,
                  y: 16,
                  scale: 0.96,
                  // cubic-bezier(0.42, 0, 1, 1)：加速下滑淡出，scale 与入场的 0.96 对称
                  transition: { duration: 0.25, ease: [0.42, 0, 1, 1] },
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }
              : {
                  // opacity 单独 0.2s 快速完成：避免长尾曲线下"半透明爬行到位置后才变实"的顿挫
                  // cubic-bezier(0, 0, 0.58, 1)
                  opacity: { duration: 0.2, ease: [0, 0, 0.58, 1] },
                  // cubic-bezier(0.16, 1, 0.3, 1)：ease-out quint，浮起主曲线
                  default: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                }
          }
        >
          {/* 卡片本体：毛玻璃加在这里，居中后背后正是简历内容 */}
          <div
            role="dialog"
            aria-label={t('starPrompt.title')}
            className="pointer-events-auto relative w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-white/90 p-5 shadow-xl backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => handleDismiss('dismissed')}
              aria-label={t('common.close')}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <p className="text-base font-semibold text-foreground">
                  {t('starPrompt.title')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t('starPrompt.desc')}
                </p>
              </div>
            </div>
            {/* 与徽章右缘对齐（徽章 40px + 间距 12px） */}
            <div className="mt-4 flex items-center gap-2 pl-[52px]">
              {/* 落地页 header github-star-btn 同款：极光渐变底 + outline 星 hover 点亮 */}
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleStarClick}
                className="group relative isolate inline-flex h-9 items-center gap-2 overflow-hidden rounded-full border border-black/5 px-4 text-sm font-semibold text-[#1A1A1A] transition-[filter,border-color] duration-300 hover:border-black/10 hover:brightness-[1.04] hover:saturate-[1.2]"
              >
                {/* 极光层：撑大到 200% 只动 transform（合成层动画），isolate 限住 -z-10 作用域 */}
                <span
                  aria-hidden="true"
                  className="absolute -inset-1/2 -z-10 animate-aurora bg-[linear-gradient(135deg,#FFF1E8_0%,#EAF1FF_25%,#F1E8FF_50%,#EAF1FF_75%,#FFF1E8_100%)] will-change-transform motion-reduce:animate-none"
                />
                <Star
                  className="h-4 w-4 fill-transparent text-[#F5B400] transition-[fill,transform] duration-300 group-hover:rotate-[144deg] group-hover:fill-[#F5B400]"
                />
                {t('starPrompt.cta')}
              </a>
              <button
                type="button"
                onClick={() => handleDismiss('later')}
                className="inline-flex h-9 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('starPrompt.later')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
