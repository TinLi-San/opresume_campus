import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { percentOf, type PreviewScale } from '@/hooks/usePreviewScale';

/**
 * 预览缩放控制条：显示当前缩放百分比（默认 100% = 重定标后的基准比例），
 * 支持放大/缩小，点击百分比重置为新基准 100%。
 */
export function PreviewZoomControl({ preview }: { preview: PreviewScale }) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full border bg-white/95 p-1 shadow-lg backdrop-blur print:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={preview.zoomOut}
            aria-label={t('toolbar.zoomOut')}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('toolbar.zoomOut')}</TooltipContent>
      </Tooltip>

      <button
        type="button"
        className="min-w-[3.25rem] px-1 text-center text-xs font-medium tabular-nums text-foreground hover:underline"
        onClick={preview.set100}
        title={t('toolbar.zoomReset')}
      >
        {percentOf(preview.scale)}%
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={preview.zoomIn}
            aria-label={t('toolbar.zoomIn')}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('toolbar.zoomIn')}</TooltipContent>
      </Tooltip>
    </div>
  );
}