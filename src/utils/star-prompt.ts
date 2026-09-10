import { useUIStore } from '@/store/ui';

/**
 * 「Star 支持」提示的频控与调度。
 *
 * 频控状态存 localStorage（键 `opresume:star-prompt`），与简历数据隔离：
 * - clicked：用户点过 Star 按钮（或任一 GitHub 入口）→ 永不再弹
 * - dismissed：用户主动关闭/稍后再说，或弹出后未交互 → 进入 15 天冷却期
 *
 * 实际节奏：每 15 天最多弹出一次，终身最多 MAX_SHOW_COUNT 次。
 */
const PROMPT_KEY = 'opresume:star-prompt';
const DISMISS_COOLDOWN_MS = 15 * 24 * 60 * 60 * 1000;
const MAX_SHOW_COUNT = 3;
/** 里程碑完成（导出 PDF 对话框关闭）后延迟弹出时长，避免打断用户当下操作 */
const SHOW_DELAY_MS = 3000;

type StarPromptStatus = 'dismissed' | 'clicked';

interface StarPromptState {
  status: StarPromptStatus;
  shownCount: number;
  lastShownAt: number;
}

function readState(): StarPromptState | null {
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StarPromptState>;
    if (parsed.status !== 'dismissed' && parsed.status !== 'clicked') return null;
    return {
      status: parsed.status,
      shownCount: typeof parsed.shownCount === 'number' ? parsed.shownCount : 0,
      lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : 0,
    };
  } catch {
    return null;
  }
}

function writeState(state: StarPromptState): void {
  try {
    localStorage.setItem(PROMPT_KEY, JSON.stringify(state));
  } catch {
    // localStorage 不可用时静默失败：提示照常弹出，只是频控不持久
  }
}

/** 当前是否允许弹出提示 */
export function canShowStarPrompt(now = Date.now()): boolean {
  const state = readState();
  if (!state) return true;
  if (state.status === 'clicked') return false;
  if (state.shownCount >= MAX_SHOW_COUNT) return false;
  return now - state.lastShownAt >= DISMISS_COOLDOWN_MS;
}

/**
 * 记录一次弹出：弹出即计数并进入冷却期（无论用户是否交互），
 * 未交互的用户短期内不重复打扰；复用 dismissed 状态（语义：未 clicked、处于冷却中）。
 */
export function markStarPromptShown(): void {
  const state = readState();
  writeState({
    status: 'dismissed',
    shownCount: (state?.shownCount ?? 0) + 1,
    lastShownAt: Date.now(),
  });
}

/** 用户点击了 Star 按钮，永久关闭提示 */
export function markStarPromptClicked(): void {
  const state = readState();
  writeState({
    status: 'clicked',
    shownCount: state?.shownCount ?? 0,
    lastShownAt: Date.now(),
  });
}

/** 用户主动关闭提示，进入冷却期 */
export function markStarPromptDismissed(): void {
  const state = readState();
  writeState({
    status: 'dismissed',
    shownCount: state?.shownCount ?? 0,
    lastShownAt: Date.now(),
  });
}

/** 会话内只调度一次，防止连续导出反复计时 */
let scheduled = false;

/**
 * 里程碑时刻（PDF 导出流程结束）后延迟调度一次 Star 提示。
 * 真正弹出时才写入频控记录；调度和弹出两个时点都检查频控。
 */
export function scheduleStarPrompt(): void {
  if (scheduled || !canShowStarPrompt()) return;
  scheduled = true;
  setTimeout(() => {
    if (!canShowStarPrompt()) return;
    markStarPromptShown();
    useUIStore.getState().openStarPrompt();
  }, SHOW_DELAY_MS);
}
