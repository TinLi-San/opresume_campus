import { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Eye, EyeOff, ChevronDown, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SchoolLogo } from '@/types/json-resume';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useUIStore } from '@/store/ui';
import { trackClarityEvent } from '@/utils/clarity';

const MAX_SIZE = 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg']);
const ACCEPT_ATTR = 'image/png,image/jpeg';

const PREVIEW_WIDTH = 120;
const PREVIEW_HEIGHT = 80;

interface SchoolLogoEditorProps {
  logo?: SchoolLogo;
  onChange: (logo: SchoolLogo) => void;
}

/**
 * 校徽编辑器 —— 与 AvatarEditor 同一套交互范式（上传 / 替换 / 删除 / 隐藏）。
 *
 * 校园模板（template7）左上角的校徽：未上传时模板渲染内置的默认校徽，
 * 上传后以本组件写入的 `x-op-schoolLogo.src` 为准；`hidden` 可整体隐藏。
 */
export function SchoolLogoEditor({ logo, onChange }: SchoolLogoEditorProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const expanded = useUIStore((s) => s.schoolLogoEditorOpen);
  const setExpanded = useCallback((open: boolean) => useUIStore.setState({ schoolLogoEditorOpen: open }), []);

  const hidden = logo?.hidden ?? false;
  const hasSrc = !!logo?.src;

  const set = useCallback(
    (partial: Partial<SchoolLogo>) => onChange({ ...logo, ...partial }),
    [logo, onChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) { toast.error(t('field.invalidFileType')); return; }
      if (file.size > MAX_SIZE) { toast.error(t('field.schoolLogoTooLarge')); return; }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        set({ src: dataUrl, hidden: false });
        trackClarityEvent('resume_school_logo_uploaded');
      } catch {
        toast.error(t('field.uploadFailed'));
      }
    },
    [set, t],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void uploadFile(file);
      e.target.value = '';
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && ACCEPTED_TYPES.has(file.type)) void uploadFile(file);
      else if (file) toast.error(t('field.invalidFileType'));
    },
    [uploadFile, t],
  );

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between py-1">
          <span className="text-sm font-medium">{t('field.schoolLogo')}</span>
          <div className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-accent hover:text-gray-600"
              aria-label={t(hidden ? 'common.show' : 'common.hide')}
              onClick={(e) => { e.stopPropagation(); set({ hidden: !hidden }); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); set({ hidden: !hidden }); } }}
            >
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <Card className="flex gap-6 p-5">
          {/* 左侧：预览区 */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className={cn(
                'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg transition-all',
                hasSrc
                  ? 'bg-white shadow-sm ring-1 ring-black/5'
                  : cn(
                      'border-2 border-dashed',
                      dragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50',
                    ),
              )}
              style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {hasSrc ? (
                <img src={logo!.src} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-300">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-[11px] text-slate-400">{t('field.uploadSchoolLogo')}</span>
                </div>
              )}
              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                <Upload className="mb-1 h-4 w-4" />
                <span className="text-[11px] font-medium">
                  {hasSrc ? t('field.changeSchoolLogo') : t('field.uploadSchoolLogo')}
                </span>
              </div>
            </div>
            {hasSrc && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-red-500"
                onClick={() => {
                  set({ src: undefined });
                  trackClarityEvent('resume_school_logo_deleted');
                }}
              >
                <Trash2 className="h-3 w-3" />
                {t('field.removeSchoolLogo')}
              </button>
            )}
          </div>

          {/* 右侧：说明与操作 */}
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-slate-500">{t('field.schoolLogoHint')}</p>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {t('field.uploadSchoolLogo')}
              </button>
            </div>
            {hidden && (
              <p className="text-[11px] text-slate-400">{t('field.schoolLogoHiddenHint')}</p>
            )}
          </div>
        </Card>
      </CollapsibleContent>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        aria-label={t('field.uploadSchoolLogo')}
        onChange={onFileChange}
      />
    </Collapsible>
  );
}
