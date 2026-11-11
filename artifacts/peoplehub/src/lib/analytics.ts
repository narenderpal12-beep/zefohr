type AnalyticsParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: AnalyticsParams) => void;
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const safeValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100 || /@|\d{8,}/.test(trimmed)) return '';
  return trimmed.replace(/[^\w .:-]/g, '').slice(0, 100);
};

/** Uses the configured GA4 transport when present and otherwise does nothing. */
export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

/** Adds only the current path and an allowlist of sanitized UTM tags to a lead message. */
export function withLeadAttribution(message: string, maxLength = 6500) {
  if (typeof window === 'undefined') return message.slice(0, maxLength);

  const details = [`Source page: ${window.location.pathname.slice(0, 240)}`];
  const query = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const value = safeValue(query.get(key) ?? '');
    if (value) details.push(`${key}: ${value}`);
  }
  const attribution = `[Attribution] ${details.join('; ')}`;
  const body = message.trim();
  const separator = body ? '\n\n' : '';
  const available = Math.max(0, maxLength - attribution.length - separator.length);
  return `${body.slice(0, available)}${separator}${attribution}`.slice(0, maxLength);
}
