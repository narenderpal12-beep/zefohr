/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { encodeLogo } from '@/lib/logo-upload';
import { arr, str, type AnyObj } from '@/lib/content';
import { cn } from '@/lib/utils';
import { SLIDER_VARIANTS, clampInterval } from '@/components/site/hero-slider';
import { LinkPicker } from './link-picker';
import { aBtn, aInput } from './json-form';

const BLANK = { eyebrow: '', title: 'New slide headline', description: 'One or two lines on why this matters to your team.', textColor: '', imageUrl: '', imageAlt: '', ctaLabel: '', ctaHref: '', secondaryLabel: '', secondaryHref: '' };
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">{t}</span>{children}</label>;

export function HeroSliderEditor({ value, onChange, onBusy, id }: { value: AnyObj; onChange: (v: AnyObj) => void; onBusy: (b: boolean) => void; id: string }) {
  const latest = useRef(value); latest.current = value;
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const busyCb = useRef(onBusy); busyCb.current = onBusy;
  useEffect(() => { busyCb.current(busyIdx !== null); }, [busyIdx]);
  useEffect(() => () => busyCb.current(false), []);
  const slides = arr<AnyObj>(value.slides);
  const patch = (p: AnyObj) => onChange({ ...latest.current, ...p });
  const setSlides = (s: AnyObj[]) => patch({ slides: s });
  const setSlide = (i: number, p: AnyObj) => { const s = [...arr<AnyObj>(latest.current.slides)]; s[i] = { ...s[i], ...p }; setSlides(s); };
  const move = (i: number, d: number) => { const s = [...slides]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; setSlides(s); };
  const files = useRef<Record<number, HTMLInputElement | null>>({});
  const pick = async (i: number, f?: File) => {
    if (!f) return;
    setErr(null); setBusyIdx(i);
    try { const url = await encodeLogo(f); setSlide(i, { imageUrl: url }); } catch (e) { setErr((e as Error).message); } finally { setBusyIdx(null); const el = files.current[i]; if (el) el.value = ''; }
  };
  const variant = str(value.variant, 'split');
  const secs = Math.round(clampInterval(value.intervalMs) / 1000);
  const locked = busyIdx !== null;
  return (
    <fieldset disabled={locked} aria-busy={locked} className="min-w-0 space-y-5" data-testid={`slider-editor-${id}`}>
      <div>
        <span className="mb-2 block text-xs font-medium text-foreground/80">Layout</span>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Slider layout">
          {SLIDER_VARIANTS.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={variant === o.id} onClick={() => patch({ variant: o.id })} data-testid={`button-slider-variant-${o.id}`}
              className={cn('rounded-xl border p-3 text-left transition', variant === o.id ? 'border-[color:var(--ph-indigo)] bg-[color:var(--ph-indigo)]/10' : 'border-white/10 hover:bg-white/[0.04]')}>
              <div className="mb-2 h-12 overflow-hidden rounded-md border border-white/10 bg-white/[0.03] p-1.5">
                {o.id === 'split' ? <div className="flex h-full gap-1"><div className="flex flex-1 flex-col gap-1"><i className="h-1.5 w-4/5 rounded bg-foreground/40" /><i className="h-1 w-3/5 rounded bg-foreground/20" /></div><i className="w-2/5 rounded bg-[color:var(--ph-cyan)]/50" /></div>
                  : o.id === 'centered' ? <div className="flex h-full flex-col items-center gap-1"><i className="h-1.5 w-3/5 rounded bg-foreground/40" /><i className="h-1 w-2/5 rounded bg-foreground/20" /><i className="w-full flex-1 rounded bg-[color:var(--ph-cyan)]/50" /></div>
                  : <div className="relative h-full rounded bg-[color:var(--ph-cyan)]/50"><i className="absolute bottom-1 left-1 h-1.5 w-2/5 rounded bg-foreground/70" /></div>}
              </div>
              <span className="block text-sm font-semibold">{o.label}</span><span className="block text-[11px] text-muted-foreground">{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/[0.07] p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.autoplay === true} onChange={(e) => patch({ autoplay: e.target.checked })} data-testid={`toggle-slider-autoplay-${id}`} />Play slides automatically
        </label>
        <L t={`Seconds per slide (3 to 20): ${secs}`}>
          <input type="range" min={3} max={20} step={1} value={secs} disabled={value.autoplay !== true || locked} onChange={(e) => patch({ intervalMs: Number(e.target.value) * 1000 })} className="w-48" data-testid={`input-slider-interval-${id}`} />
        </L>
        <span className="w-full text-[11px] text-muted-foreground">Off by default for accessibility. Autoplay pauses on hover, keyboard focus and for visitors who prefer reduced motion.</span>
      </div>
      {err ? <p role="alert" className="text-xs text-red-300">{err}</p> : null}
      <div className="space-y-3">
        {slides.map((s, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-3" data-testid={`slide-editor-${i}`}>
            {/** Render the color input independently so every existing slide can use a theme default or its own explicit color. */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Slide {i + 1} of {slides.length}</span>
              <div className="flex gap-1">
                <button type="button" className={aBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move slide ${i + 1} up`} data-testid={`button-slide-up-${i}`}><ArrowUp className="h-3 w-3" />Move up</button>
                <button type="button" className={aBtn} onClick={() => move(i, 1)} disabled={i === slides.length - 1} aria-label={`Move slide ${i + 1} down`} data-testid={`button-slide-down-${i}`}><ArrowDown className="h-3 w-3" />Move down</button>
                <button type="button" className={cn(aBtn, 'text-red-300')} disabled={slides.length <= 1} onClick={() => { if (window.confirm(`Remove slide ${i + 1}?`)) setSlides(slides.filter((_, j) => j !== i)); }} aria-label={`Remove slide ${i + 1}`} data-testid={`button-slide-remove-${i}`}><Trash2 className="h-3 w-3" />Remove</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <L t="Eyebrow"><input className={aInput} value={str(s.eyebrow)} onChange={(e) => setSlide(i, { eyebrow: e.target.value })} data-testid={`input-slide-eyebrow-${i}`} /></L>
              <L t="Title"><input className={aInput} value={str(s.title)} onChange={(e) => setSlide(i, { title: e.target.value })} data-testid={`input-slide-title-${i}`} /></L>
              <div className="sm:col-span-2"><L t="Description"><textarea className={cn(aInput, 'min-h-[70px]')} value={str(s.description)} onChange={(e) => setSlide(i, { description: e.target.value })} data-testid={`input-slide-description-${i}`} /></L></div>
              <div className="sm:col-span-2">
                <L t="Text color for eyebrow, title and description">
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="color" value={/^#[\da-f]{6}$/i.test(str(s.textColor)) ? str(s.textColor) : '#5751b9'} onChange={(e) => setSlide(i, { textColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent p-1" aria-label={`Slide ${i + 1} text color`} data-testid={`input-slide-text-color-${i}`} />
                    <span className="font-mono text-xs text-muted-foreground">{/^#[\da-f]{6}$/i.test(str(s.textColor)) ? str(s.textColor).toUpperCase() : 'Theme default'}</span>
                    {s.textColor ? <button type="button" className={aBtn} onClick={() => setSlide(i, { textColor: '' })} data-testid={`button-reset-slide-text-color-${i}`}>Use theme default</button> : null}
                  </div>
                </L>
                <p className="mt-1 text-[11px] text-muted-foreground">Leave blank for the standard theme text and gradient heading.</p>
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <div className="solution-frame grid aspect-[4/3] w-36 place-items-center overflow-hidden rounded-xl">
                  {str(s.imageUrl) ? <img src={str(s.imageUrl)} alt="" className="h-full w-full object-cover" data-testid={`preview-slide-image-${i}`} /> : <span className="text-[11px] text-muted-foreground">No image</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input ref={(el) => { files.current[i] = el; }} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(i, e.target.files?.[0])} data-testid={`file-slide-image-${i}`} />
                  <button type="button" className={aBtn} onClick={() => files.current[i]?.click()} data-testid={`button-browse-slide-image-${i}`}>{busyIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}{busyIdx === i ? 'Processing...' : str(s.imageUrl) ? 'Replace image' : 'Browse image'}</button>
                  {str(s.imageUrl) ? <button type="button" className={cn(aBtn, 'text-red-300')} onClick={() => setSlide(i, { imageUrl: '' })} data-testid={`button-remove-slide-image-${i}`}><Trash2 className="h-3 w-3" />Remove image</button> : null}
                  <span className="text-[11px] text-muted-foreground">PNG, JPEG or WebP, up to 150KB after processing.</span>
                </div>
                <div className="min-w-[200px] flex-1"><L t="Image description (alt text)"><input className={aInput} value={str(s.imageAlt)} onChange={(e) => setSlide(i, { imageAlt: e.target.value })} placeholder="What the photo shows" data-testid={`input-slide-alt-${i}`} /></L></div>
              </div>
              <L t="Main button label"><input className={aInput} value={str(s.ctaLabel)} onChange={(e) => setSlide(i, { ctaLabel: e.target.value })} data-testid={`input-slide-cta-label-${i}`} /></L>
              <L t="Main button page"><LinkPicker value={str(s.ctaHref)} onChange={(v) => setSlide(i, { ctaHref: v })} testId={`select-slide-cta-href-${i}`} /></L>
              <L t="Second button label"><input className={aInput} value={str(s.secondaryLabel)} onChange={(e) => setSlide(i, { secondaryLabel: e.target.value })} data-testid={`input-slide-secondary-label-${i}`} /></L>
              <L t="Second button page"><LinkPicker value={str(s.secondaryHref)} onChange={(v) => setSlide(i, { secondaryHref: v })} testId={`select-slide-secondary-href-${i}`} /></L>
            </div>
          </div>
        ))}
        <button type="button" className={aBtn} disabled={slides.length >= 8} onClick={() => setSlides([...slides, { ...BLANK }])} data-testid={`button-add-slide-${id}`}><Plus className="h-3 w-3" />Add slide</button>
        <span className="ml-2 text-[11px] text-muted-foreground">{slides.length} of 8 slides</span>
      </div>
    </fieldset>
  );
}
