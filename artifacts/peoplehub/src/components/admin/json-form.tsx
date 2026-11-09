/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { encodeLogo } from '@/lib/logo-upload';
import { cn } from '@/lib/utils';
import { LinkPicker } from './link-picker';

export const aInput = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--ph-indigo)] focus:ring-2 focus:ring-[color:var(--ph-indigo)]/20';
export const aBtn = 'inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.08] disabled:opacity-50';
export const aBtnPrimary = 'inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-on-brand disabled:opacity-50';

const humanize = (k: string) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function blankLike(sample: any): any {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankLike(v)]));
  if (typeof sample === 'number') return 0;
  if (typeof sample === 'boolean') return false;
  return '';
}

/** Typed templates so empty collections get proper item shapes. Matched against the editor path. */
const TEMPLATES: [RegExp, () => any][] = [
  [/^clients-items$/, () => ({ id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c-${Date.now()}`, name: '', alt: '', logoUrl: '', website: '', visible: true })],
  [/^media-items$/, () => ({ title: '', publication: '', date: '', url: '', description: '', imageUrl: '', imageAlt: '' })],
  [/^caseStudies-items$/, () => ({ title: '', industry: '', summary: '', body: '', slug: '', imageUrl: '', imageAlt: '' })],
  [/^careers-items$/, () => ({ title: '', department: '', location: '', employmentType: '', description: '', applyEmail: '' })],
  [/-faq$/, () => ({ question: '', answer: '' })],
  [/^nav-megaMenu$/, () => ({ label: '', href: '', groups: [{ title: '', links: [{ label: '', href: '', description: '', icon: '' }] }] })],
  [/^nav-megaMenu-\d+-groups$/, () => ({ title: '', links: [{ label: '', href: '', description: '', icon: '' }] })],
  [/^nav-megaMenu-\d+-groups-\d+-links$/, () => ({ label: '', href: '', description: '', icon: '' })],
  [/^footer-columns$/, () => ({ title: '', links: [{ label: '', href: '' }] })],
  [/^footer-columns-\d+-links$/, () => ({ label: '', href: '' })],
  [/^footer-socials$/, () => ({ platform: 'instagram', label: '', url: '', enabled: true })],
  [/^block-cards-items$/, () => ({ title: '', description: '', icon: 'Sparkles', href: '' })],
  [/^(footer-links|nav-links)$/, () => ({ label: '', href: '' })],
];
export function templateFor(path: string, sample?: any): any {
  const t = TEMPLATES.find(([r]) => r.test(path));
  if (t) return t[1]();
  if (/^(block-)?(suites|services)-items$/.test(path)) return { ...(sample && typeof sample === 'object' ? blankLike(sample) : {}), imageUrl: '', imageAlt: '' };
  return sample !== undefined ? blankLike(sample) : '';
}

const IMAGE_PATH = /^((block-)?(suites|services)-items-\d+-imageUrl|(media|caseStudies)-items-\d+-imageUrl|block-[A-Za-z]+(-\w+)*-imageUrl)$/;
const HREF_PATH = /^(nav-megaMenu|nav-links|footer-columns|footer-links|block-[A-Za-z]+)(-\w+)*-(href|ctaHref)$/;
const HERO_COLOR_PATH = /^hero-(titleColor|descriptionColor|buttonColor|buttonTextColor)$/;
const HEX_COLOR = /^#[\da-f]{6}$/i;
const BusyCtx = createContext<(delta: number) => void>(() => undefined);

function HeroColorField({ value, onChange, path }: { value: string; onChange: (v: string) => void; path: string }) {
  const swatches: Record<string, string> = { titleColor: '#5751b9', descriptionColor: '#8a91a5', buttonColor: '#e84ba8', buttonTextColor: '#ffffff' };
  const notes: Record<string, string> = {
    titleColor: 'Default: a bright theme-matched heading color.',
    descriptionColor: 'Default: the site’s readable secondary text color.',
    buttonColor: 'Default: the bright brand-gradient buttons.',
    buttonTextColor: 'Default: automatic high-contrast text.',
  };
  const color = HEX_COLOR.test(value) ? value : swatches[path.split('-').at(-1)!] ?? '#5751b9';
  const useDefault = () => onChange('');
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid={`hero-color-${path}`}>
      <input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1" value={color} onChange={(e) => onChange(e.target.value)} aria-label={`Choose ${humanize(path.split('-').at(-1) ?? 'hero color')}`} data-testid={`input-${path}`} />
      <span className="font-mono text-xs text-muted-foreground">{HEX_COLOR.test(value) ? value.toUpperCase() : notes[path.split('-').at(-1)!]}</span>
      {value ? <button type="button" className={aBtn} onClick={useDefault} data-testid={`button-reset-${path}`}>Use default</button> : null}
    </div>
  );
}

/** Browse + preview + remove for suite/service photos. Whole form is locked while encoding, so the result cannot land on a stale draft or a moved item. */
export function ImageField({ value, onChange, path, onBusyChange }: { value: string; onChange: (v: string) => void; path: string; onBusyChange?: (busy: boolean) => void }) {
  const bump = useContext(BusyCtx);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [value]);
  const pick = async (file?: File) => {
    if (!file) return;
    setErr(null); setBusy(true); bump(1); onBusyChange?.(true);
    try { const url = await encodeLogo(file); setBroken(false); onChange(url); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); bump(-1); onBusyChange?.(false); if (input.current) input.current.value = ''; }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="solution-frame grid aspect-[4/3] w-40 place-items-center overflow-hidden rounded-xl">
        {value && !broken ? <img src={value} alt="Current photo" className="h-full w-full object-cover" onError={() => setBroken(true)} data-testid={`preview-${path}`} /> : <span className="px-2 text-center text-[11px] text-slate-500">{broken ? 'Image unavailable' : 'No image'}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} data-testid={`file-${path}`} />
        <button type="button" className={aBtn} onClick={() => input.current?.click()} disabled={busy} data-testid={`button-browse-${path}`}>{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}{busy ? 'Processing...' : value ? 'Replace image' : 'Browse image'}</button>
        {value ? <button type="button" className={cn(aBtn, 'text-red-300')} onClick={() => { setBroken(false); onChange(''); }} disabled={busy} data-testid={`button-remove-image-${path}`}><Trash2 className="h-3 w-3" />Remove image</button> : null}
        <span className="text-[11px] text-muted-foreground">PNG, JPEG or WebP, up to 150KB after processing. Removing hides the image on the site. Click Save to publish.</span>
        {err ? <span className="text-[11px] text-red-300">{err}</span> : null}
      </div>
    </div>
  );
}

/** Generic recursive editor for any JSON value. */
export function JsonForm(props: { value: any; onChange: (v: any) => void; path?: string; depth?: number; onBusyChange?: (busy: boolean) => void }) {
  const [count, setCount] = useState(0);
  const cb = useRef(props.onBusyChange);
  cb.current = props.onBusyChange;
  useEffect(() => { cb.current?.(count > 0); }, [count]);
  if (props.depth) return <JsonNode {...props} />;
  return (
    <BusyCtx.Provider value={(d) => setCount((c) => c + d)}>
      <fieldset disabled={count > 0} className={cn('min-w-0', count > 0 && 'opacity-80')} aria-busy={count > 0}>
        <JsonNode {...props} />
      </fieldset>
    </BusyCtx.Provider>
  );
}

function JsonNode({ value, onChange, path = 'root', depth = 0 }: { value: any; onChange: (v: any) => void; path?: string; depth?: number }) {
  if (IMAGE_PATH.test(path) && (typeof value === 'string' || value == null)) return <ImageField value={value ?? ''} onChange={onChange} path={path} />;
  if (value === null || value === undefined) {
    return <input className={aInput} value="" placeholder="(empty)" onChange={(e) => onChange(e.target.value)} data-testid={`input-${path}`} />;
  }
  if (typeof value === 'boolean') {
    return (
      <button type="button" onClick={() => onChange(!value)} className={cn('relative h-6 w-11 rounded-full transition', value ? 'bg-brand' : 'bg-white/15')} aria-pressed={value} data-testid={`toggle-${path}`}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-on-brand transition-all', value ? 'left-[22px]' : 'left-0.5')} />
      </button>
    );
  }
  if (typeof value === 'number') {
    return <input type="number" className={aInput} value={value} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} data-testid={`input-${path}`} />;
  }
  if (HERO_COLOR_PATH.test(path) && typeof value === 'string') return <HeroColorField value={value} onChange={onChange} path={path} />;
  if (HREF_PATH.test(path) && (typeof value === 'string' || value == null)) return <LinkPicker value={value ?? ''} onChange={onChange} testId={`input-${path}`} />;
  if (typeof value === 'string') {
    const long = value.length > 70 || value.includes('\n');
    return long
      ? <textarea className={cn(aInput, 'min-h-[90px]')} value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-${path}`} />
      : <input className={aInput} value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-${path}`} />;
  }
  if (Array.isArray(value)) {
    const move = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Item {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" className={aBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" data-testid={`button-up-${path}-${i}`}><ArrowUp className="h-3 w-3" /></button>
                <button type="button" className={aBtn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down" data-testid={`button-down-${path}-${i}`}><ArrowDown className="h-3 w-3" /></button>
                <button type="button" className={cn(aBtn, 'text-red-300')} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove" data-testid={`button-remove-${path}-${i}`}><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <JsonNode
              value={(path === 'media-items' || path === 'caseStudies-items') && item && typeof item === 'object' && !Array.isArray(item)
                ? { ...item, imageUrl: item.imageUrl ?? '', imageAlt: item.imageAlt ?? '' }
                : item}
              onChange={(v) => { const n = [...value]; n[i] = v; onChange(n); }}
              path={`${path}-${i}`}
              depth={depth + 1}
            />
          </div>
        ))}
        <button type="button" className={aBtn} onClick={() => onChange([...value, templateFor(path, value.length ? value[0] : undefined)])} data-testid={`button-add-${path}`}><Plus className="h-3 w-3" />Add item</button>
      </div>
    );
  }
  return (
    <div className={cn('grid gap-4', depth > 0 && 'border-l border-white/[0.07] pl-3')}>
      {Object.entries(value).filter(([k]) => !(/^(media|caseStudies)-items-\d+$/.test(path) && ['sample', 'sampleId'].includes(k))).map(([k, v]) => (
        <div key={k}>
          <div className="mb-1.5 text-xs font-medium text-foreground/80">{IMAGE_PATH.test(`${path}-${k}`) ? 'Photo' : humanize(k)}</div>
          <JsonNode value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} path={`${path}-${k}`} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

/** Raw JSON textarea with validation. */
export function RawJson({ value, onChange, testId = 'input-raw-json' }: { value: any; onChange: (v: any) => void; testId?: string }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setText(JSON.stringify(value ?? null, null, 2)); setErr(null); }, [value]);
  return (
    <div>
      <textarea
        className={cn(aInput, 'min-h-[360px] font-mono text-xs leading-relaxed')}
        value={text}
        spellCheck={false}
        onChange={(e) => { setText(e.target.value); try { JSON.parse(e.target.value); setErr(null); } catch (x) { setErr((x as Error).message); } }}
        onBlur={() => { if (!err) { try { onChange(JSON.parse(text)); } catch { /* invalid */ } } }}
        data-testid={testId}
      />
      <p className={cn('mt-1 text-xs', err ? 'text-red-300' : 'text-emerald-300/80')}>{err ? `Invalid JSON: ${err}` : 'Valid JSON. Changes apply when you leave the field.'}</p>
    </div>
  );
}
