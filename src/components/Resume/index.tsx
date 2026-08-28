import { useRef, useState, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { JsonResume } from '@/types/json-resume';
import type { TemplateDefinition } from './types';
import { useUIStore } from '@/store/ui';
import { useTemplateModules, renderPageSlices } from './modules';
import { definitions, defaultDefinition } from './templates';
import { getEffectiveLayout } from '@/config/layout';
import { measureFromDOM, allocatePages } from '@/utils/pagination';
import type { PageAllocation } from '@/utils/pagination';
import {
  usePreviewScale,
  RESUME_PAGE_WIDTH_PX,
  RESUME_PAGE_HEIGHT_PX,
  type PreviewScale,
} from '@/hooks/usePreviewScale';
import { PreviewZoomControl } from './PreviewZoomControl';

/* ---------- 原始单页渲染（用于测量和双栏模板） ---------- */

function TemplateRenderer({ def, config }: { def: TemplateDefinition; config: JsonResume }) {
  const { sidebarContent, mainContent } = useTemplateModules(def, config);
  const Shell = def.LayoutShell;
  return (
    <div className="resume-layout">
      <Shell config={config} sidebarContent={sidebarContent} mainContent={mainContent} />
    </div>
  );
}

/* ---------- 判断模板是否支持分页 ---------- */

function supportsPagination(def: TemplateDefinition, config: JsonResume): boolean {
  const layout = getEffectiveLayout(def.id, config['x-op-moduleLayout']);
  // 双栏模板（sidebar 有模块）不分页
  if (layout.sidebar.length > 0) return false;
  // 显式标记为单页模板的（如校园应届生 A4 一页模板）也不分页
  if (def.tags.includes('singlePage')) return false;
  return true;
}

/* ---------- 页码指示器 ---------- */

function PageIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-black shadow-md print:hidden">
      <FileText className="h-4 w-4" />
      <span>{current} / {total}</span>
    </div>
  );
}

/* ---------- 预览缩放容器 ----------
 *
 * 仅主编辑画布（scaled）启用：A4 简历以固定物理尺寸（210mm × 297mm）渲染，
 * 这里按固定缩放基准（默认 100% = 原稿 110% 的显示比例）用 transform 等比缩放预览，
 * 不随显示器/窗口分辨率动态变化，笔记本与大屏默认观感一致。
 *
 * 结构说明：
 * - .resume-scale-host：占位容器，宽/高 = 缩放后的可视尺寸，保证滚动区域与实际观感一致；
 * - .resume-scale-content：实际简历内容，绝对定位 + transform: scale（transformOrigin 左上），
 *   其 offsetHeight（不随 transform 变化）由 ResizeObserver 实时反馈给宿主高度；
 * - overlay：不受缩放影响的内容（缩放百分比控制条、页码指示器），置于宿主内、缩放层之外；
 *   分页测量的隐藏容器也放在 overlay 中，保证 DOM 测量始终按原始尺寸进行（transform
 *   会影响 getBoundingClientRect，若被缩放会污染分页算法）。
 * - 打印时由 index.css 的 @media print 规则还原（transform:none / 尺寸 auto）。
 */

function ScaledFrame({
  enabled,
  scale,
  children,
  overlay,
}: {
  enabled: boolean;
  scale: number;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(RESUME_PAGE_HEIGHT_PX);

  // 内容实际高度（未缩放）变化时（如内容编辑、分页结果变化）同步宿主高度
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !enabled) return;
    const update = () => setContentHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, children]);

  if (!enabled) {
    return (
      <>
        {children}
        {overlay}
      </>
    );
  }

  return (
    <div
      className="resume-scale-host"
      style={{
        position: 'relative',
        width: RESUME_PAGE_WIDTH_PX * scale,
        height: contentHeight * scale,
      }}
    >
      <div
        ref={contentRef}
        className="resume-scale-content"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RESUME_PAGE_WIDTH_PX,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}

/* ---------- 分页渲染 ---------- */

function PaginatedResumeView({
  def,
  config,
  preview,
}: {
  def: TemplateDefinition;
  config: JsonResume;
  preview: PreviewScale;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageAllocation[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const layout = useUIStore((s) => s.layout);
  const tokens = def.getTokens();
  const Shell = def.LayoutShell;

  const doMeasure = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const measurement = measureFromDOM(container, layout.pageMargin, layout.moduleGap);
    if (!measurement) return;

    const result = allocatePages(measurement);
    setPages(result);
  }, [layout.pageMargin, layout.moduleGap]);

  // 测量容器渲染后立即测量（同步，避免闪烁）
  useLayoutEffect(() => {
    doMeasure();
  }, [doMeasure, config, layout.lineHeight]);

  // 通过 IntersectionObserver 追踪当前可见页
  useEffect(() => {
    if (!pages || pages.length <= 1) {
      setCurrentPage(1);
      return;
    }
    const container = pagesRef.current;
    if (!container) return;

    const pageEls = container.querySelectorAll<HTMLElement>('[data-page-index]');
    if (pageEls.length === 0) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-page-index') ?? 0);
          ratios.set(idx, entry.intersectionRatio);
        });

        let maxRatio = 0;
        let maxIdx = 0;
        ratios.forEach((ratio, idx) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxIdx = idx;
          }
        });
        if (maxRatio > 0) setCurrentPage(maxIdx + 1);
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    );

    pageEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  return (
    <ScaledFrame
      enabled={preview.enabled}
      scale={preview.scale}
      overlay={
        <>
          {/* 隐藏测量容器：完整渲染用于 DOM 测量。
              放在缩放层之外，保证测量始终按原始 210mm 尺寸进行
              （transform 会缩放 getBoundingClientRect，若被缩放会污染分页算法）。 */}
          <div
            ref={measureRef}
            aria-hidden
            className="resume-measure-container"
          >
            <TemplateRenderer def={def} config={config} />
          </div>

          {/* 页码指示器：不受缩放影响 */}
          {pages && pages.length > 0 && (
            <PageIndicator current={currentPage} total={pages.length} />
          )}

          {/* 缩放控制条（仅主编辑画布） */}
          {preview.enabled && <PreviewZoomControl preview={preview} />}
        </>
      }
    >
      {/* 分页渲染结果 */}
      {pages && pages.length > 0 ? (
        <div ref={pagesRef} className="flex flex-col items-center gap-8 print:gap-0">
          {pages.map((page, i) => {
            const mainContent = renderPageSlices(page.slices, config, tokens, def.id);
            return (
              <div key={i} data-page-index={i} className="resume-page h-[297mm] w-[210mm] overflow-hidden">
                <div className="resume-layout">
                  <Shell
                    config={config}
                    sidebarContent={<></>}
                    mainContent={mainContent}
                    pageIndex={i}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 测量完成前显示原始渲染（避免空白）
        <TemplateRenderer def={def} config={config} />
      )}
    </ScaledFrame>
  );
}

/* ---------- 入口 ---------- */

export function ResumeView({
  config,
  templateId,
  disablePagination,
  scaled = false,
}: {
  config: JsonResume;
  templateId?: string;
  disablePagination?: boolean;
  /** 主编辑画布：按固定基准缩放预览（默认 100%，不随分辨率动态调整） */
  scaled?: boolean;
}) {
  const storeTemplate = useUIStore((s) => s.template);
  const activeId = templateId ?? storeTemplate;
  const def = definitions[activeId] ?? defaultDefinition;
  const reduceMotion = useReducedMotion();
  const preview = usePreviewScale(scaled);

  const inner =
    !disablePagination && supportsPagination(def, config) ? (
      <PaginatedResumeView def={def} config={config} preview={preview} />
    ) : (
      <ScaledFrame
        enabled={preview.enabled}
        scale={preview.scale}
        overlay={preview.enabled ? <PreviewZoomControl preview={preview} /> : null}
      >
        <TemplateRenderer def={def} config={config} />
      </ScaledFrame>
    );

  // 简历"从下到上"淡入：duration 1.0s + ease-out quint，足够慢让用户看清整体浮入过程；
  // y 80→0 让位移幅度大一点（之前 60 偏含蓄）；exit 留给模板切换用，淡出快一点不阻塞新模板。
  //
  // motion.div 主动接管布局：用 `flex w-full justify-center` 让它自己作为 flex container
  // 强制内部 inner 水平居中。两次失败都源于把 motion.div 当默认块级 flex item：
  //   1. 不指定 className 时 motion.div 的 flex item width 由内容决定（210mm），
  //      理论上 main `justify-center` 应居中，但实测双栏模板会左对齐 —— 推测 transform
  //      创建了新 stacking context 让 flex 算法对它的尺寸/位置推断不稳。
  //   2. align-items:stretch 把 motion.div 高度撑到 main 内容区高度，内部 resume-page
  //      297mm 远超 stretched 高度，向下 visible overflow 让 main 的 scrollHeight 计算
  //      把顶部 padding 吞掉，简历贴 header。
  // 现在让 motion.div w-full 明确撑满 main，自己作为 flex container 居中 inner，
  // padding 仍由父 main 的 py-8 提供 —— 这样布局完全可预测。
  //
  // key={activeId} + mode="wait"：模板切换时旧模板退出完毕再播新模板，避免 PaginatedResumeView
  // 的 useLayoutEffect 测量在两个模板间互相污染。
  //
  // scaled（主编辑画布）：简历始终以固定 A4 物理尺寸渲染，缩放仅作用在显示层
  // （ScaledFrame 的 transform），不影响打印/导出；默认 100% = 原稿 110% 的显示比例，
  // 固定基准不随分辨率动态调整，可手动缩放微调（见底部缩放控制条）。
  //
  // onAnimationStart 中把父 main 强制滚到顶：
  // 浏览器的 scroll-anchoring 默认会跟随 motion.div 的视觉位置（initial 时 translateY(80)）
  // 自动滚动 main 来"保持视线"，导致动画结束 transform 归零后 main.scrollTop > 0，
  // padding-top 被滚到视口外，用户感觉简历贴 header。手动把 scrollTop 拉回 0 即可。
  const handleAnimationStart = () => {
    // 找到承载滚动的 main（第一层 ancestor 即为 App.tsx 的 main）
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeId}
        className="flex w-full justify-center"
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 80 }
        }
        animate={{ opacity: 1, y: 0 }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.18 } }
            : { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } }
        }
        transition={
          reduceMotion
            ? { duration: 0.25, ease: 'easeOut' }
            : { duration: 1.15, ease: [0.16, 1, 0.3, 1] }
        }
        onAnimationStart={handleAnimationStart}
      >
        {inner}
      </motion.div>
    </AnimatePresence>
  );
}
