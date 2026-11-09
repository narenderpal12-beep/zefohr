import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useContent, usePublicPages } from '@/lib/content';
import { linkOptions } from '@/lib/site-pages';

const cls = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--ph-indigo)] focus:ring-2 focus:ring-[color:var(--ph-indigo)]/20';
const CUSTOM = '__custom';

export function useLinkOptions() {
  const content = useContent();
  const { pages } = usePublicPages();
  return useMemo(() => linkOptions(content, pages), [content, pages]);
}

/** Choose a website page from a dropdown; custom or external URLs are an explicit opt-in. */
export function LinkPicker({ value, onChange, testId = 'select-link' }: { value: string; onChange: (v: string) => void; testId?: string }) {
  const groups = useLinkOptions();
  const known = groups.some((g) => g.options.some((o) => o.href === value));
  const [custom, setCustom] = useState(!!value && !known);
  const sel = custom || (value && !known) ? CUSTOM : value;
  return (
    <div className="space-y-1.5">
      <select className={cls} value={sel} onChange={(e) => { const v = e.target.value; if (v === CUSTOM) setCustom(true); else { setCustom(false); onChange(v); } }} data-testid={testId}>
        <option value="">Choose a page...</option>
        {groups.map((g) => <optgroup key={g.label} label={g.label}>{g.options.map((o) => <option key={o.href} value={o.href}>{o.label} ({o.href})</option>)}</optgroup>)}
        <option value={CUSTOM}>Custom or external URL...</option>
      </select>
      {sel === CUSTOM ? (
        <div className="flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input className={cls} value={value} placeholder="https://example.com or /path#anchor" onChange={(e) => onChange(e.target.value)} data-testid={`${testId}-custom`} />
        </div>
      ) : null}
    </div>
  );
}
