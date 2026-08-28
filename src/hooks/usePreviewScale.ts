import { useCallback, useState } from 'react';

/** A4 宽度（210mm → CSS px，按 96dpi 换算） */
export const RESUME_PAGE_WIDTH_PX = (210 / 25.4) * 96;
/** A4 高度（297mm → CSS px，按 96dpi 换算） */
export const RESUME_PAGE_HEIGHT_PX = (297 / 25.4) * 96;

/**
 * 缩放基准：把原稿 110% 的显示比例重定标为新的「100%」。
 * 100% 的含义从此不再是 210mm 原始物理尺寸，而是基准比例下的显示尺寸；
 * 缩放控制条上的百分比均相对该基准计算。
 */
export const PREVIEW_BASE_SCALE = 1.1;

/** 缩放百分比上下限（相对新基准） */
export const MIN_PREVIEW_PERCENT = 50;
export const MAX_PREVIEW_PERCENT = 300;

/** 单次缩放的步进（百分比，相对新基准） */
const ZOOM_STEP_PERCENT = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 内部倍数 → 显示百分比（相对基准） */
export function percentOf(scale: number): number {
  return Math.round((scale / PREVIEW_BASE_SCALE) * 100);
}

/** 显示百分比 → 内部倍数（相对基准） */
function scaleOf(percent: number): number {
  return (PREVIEW_BASE_SCALE * percent) / 100;
}

export interface PreviewScale {
  /** 是否启用预览缩放（仅主编辑画布开启，模板缩略图不缩放） */
  enabled: boolean;
  /** 当前显示缩放倍数（内部值，基准 PREVIEW_BASE_SCALE 对应「100%」） */
  scale: number;
  /** 手动放大（每次 +10%） */
  zoomIn: () => void;
  /** 手动缩小（每次 -10%） */
  zoomOut: () => void;
  /** 重置为新基准 100% */
  set100: () => void;
}

/**
 * 简历预览缩放：采用固定的缩放基准（默认即「100%」，对应原稿 110% 的显示尺寸），
 * 不随显示器/窗口分辨率动态变化——笔记本与大屏默认观感一致。
 */
export function usePreviewScale(enabled: boolean): PreviewScale {
  const [scale, setScale] = useState(PREVIEW_BASE_SCALE);

  const zoomBy = useCallback((percentDelta: number) => {
    setScale((prev) => {
      const nextPercent = clamp(percentOf(prev) + percentDelta, MIN_PREVIEW_PERCENT, MAX_PREVIEW_PERCENT);
      return Math.round(scaleOf(nextPercent) * 100) / 100;
    });
  }, []);

  const set100 = useCallback(() => {
    setScale(PREVIEW_BASE_SCALE);
  }, []);

  return {
    enabled,
    scale,
    zoomIn: () => zoomBy(ZOOM_STEP_PERCENT),
    zoomOut: () => zoomBy(-ZOOM_STEP_PERCENT),
    set100,
  };
}