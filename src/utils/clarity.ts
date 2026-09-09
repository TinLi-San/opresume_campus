/**
 * Sends a custom event to Microsoft Clarity when the production script is
 * available. The optional call keeps local development and blocked analytics
 * scripts from affecting the application flow.
 */
export function trackClarityEvent(eventName: string): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') return;
  window.clarity('event', eventName);
}

/** Adds a session-level tag for dimensions such as the active resume template. */
const sentTags = new Map<string, string>();

export function setClarityTag(key: string, value: string): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') return;
  if (sentTags.get(key) === value) return;
  sentTags.set(key, value);
  window.clarity('set', key, value);
}

declare global {
  interface Window {
    clarity?: (command: string, ...args: string[]) => void;
  }
}
