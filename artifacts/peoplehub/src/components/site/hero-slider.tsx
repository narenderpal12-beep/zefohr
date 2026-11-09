import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { arr, str, type AnyObj } from '@/lib/content';
import { Container, CtaLink, Eyebrow } from './primitives';
import { cn } from '@/lib/utils';

export const SLIDER_VARIANTS = [
  { id: 'split', label: 'Split', desc: 'Text beside a framed photo.' },
  { id: 'centered', label: 'Centered', desc: 'Centered headline, wide photo below.' },
  { id: 'cover', label: 'Full-image', desc: 'Photo fills the band, text over a scrim.' },
] as const;
export type SliderVariant = (typeof SLIDER_VARIANTS)[number]['id'];
export const clampInterval = (ms: unknown) => Math.min(20000, Math.max(3000, Number(ms) || 6000));

function Ctas({ s, cover, i }: { s: AnyObj; cover: boolean; i: number }) {
  const p = str(s.ctaLabel) && str(s.ctaHref);
  const q = str(s.secondaryLabel) && str(s.secondaryHref);
  if (!p && !q) return null;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {p ? <CtaLink href={str(s.ctaHref)} testId={`link-slide-cta-${i}`}>{str(s.ctaLabel)} <ArrowRight className="h-4 w-4" /></CtaLink> : null}
      {q ? <CtaLink href={str(s.secondaryHref)} variant="ghost" className={cn(cover && '!border-white/40 !text-white')} testId={`link-slide-secondary-${i}`}>{str(s.secondaryLabel)}</CtaLink> : null}
    </div>
  );
}

function Slide({ s, v, i }: { s: AnyObj; v: SliderVariant; i: number }) {
  const img = str(s.imageUrl);
  const textColor = /^#[\da-f]{6}$/i.test(str(s.textColor)) ? str(s.textColor) : undefined;
  const textStyle = textColor ? { color: textColor, WebkitTextFillColor: textColor, background: 'none' } : undefined;
  const title = <h2 className={cn('font-display font-bold leading-[1.05] tracking-tight', v === 'centered' ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-3xl sm:text-5xl')}><span className={textColor || v === 'cover' ? '' : 'text-gradient'} style={textStyle}>{str(s.title)}</span></h2>;
  if (v === 'cover') return (
    <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] sm:min-h-[520px]">
      {img ? <img src={img} alt={str(s.imageAlt)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[color:var(--ph-indigo)]/40" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1020]/90 via-[#0b1020]/65 to-[#0b1020]/10" />
      <div className="relative flex min-h-[460px] max-w-2xl flex-col justify-end p-7 text-white sm:min-h-[520px] sm:p-12">
        {s.eyebrow ? <Eyebrow className={cn('w-fit !border-white/25 !bg-white/10', !textColor && '!text-white')} style={textColor ? { color: textColor } : undefined}>{str(s.eyebrow)}</Eyebrow> : null}
        <div className="mt-4">{title}</div>
        {s.description ? <p className={cn('mt-4 max-w-xl text-base leading-relaxed sm:text-lg', textColor ? '' : 'text-white/85')} style={textColor ? { color: textColor } : undefined}>{str(s.description)}</p> : null}
        <Ctas s={s} cover i={i} />
      </div>
    </div>
  );
  if (v === 'centered') return (
    <div className="flex flex-col items-center text-center">
      {s.eyebrow ? <Eyebrow style={textColor ? { color: textColor } : undefined}>{str(s.eyebrow)}</Eyebrow> : null}
      <div className="mt-5 max-w-3xl">{title}</div>
      {s.description ? <p className={cn('mt-5 max-w-2xl text-base leading-relaxed sm:text-lg', !textColor && 'text-muted-foreground')} style={textColor ? { color: textColor } : undefined}>{str(s.description)}</p> : null}
      <div className="flex justify-center"><Ctas s={s} cover={false} i={i} /></div>
      <div className="solution-frame mt-10 aspect-[21/9] w-full overflow-hidden rounded-3xl">
        {img ? <img src={img} alt={str(s.imageAlt)} className="solution-photo h-full w-full object-cover" /> : null}
      </div>
    </div>
  );
  return (
    <div className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr]">
      <div>
        {s.eyebrow ? <Eyebrow style={textColor ? { color: textColor } : undefined}>{str(s.eyebrow)}</Eyebrow> : null}
        <div className="mt-5">{title}</div>
        {s.description ? <p className={cn('mt-5 max-w-xl text-base leading-relaxed sm:text-lg', !textColor && 'text-muted-foreground')} style={textColor ? { color: textColor } : undefined}>{str(s.description)}</p> : null}
        <Ctas s={s} cover={false} i={i} />
      </div>
      <div className="solution-frame relative aspect-[4/3] overflow-hidden rounded-3xl md:rotate-[0.6deg]">
        {img ? <img src={img} alt={str(s.imageAlt)} className="solution-photo h-full w-full object-cover" /> : null}
      </div>
    </div>
  );
}

export function HeroSlider({ content, preview }: { content: AnyObj; preview?: boolean }) {
  const slides = arr<AnyObj>(content.slides).filter((s) => s && typeof s === 'object').slice(0, 8);
  const n = slides.length;
  const v: SliderVariant = (['split', 'centered', 'cover'] as const).includes(content.variant) ? content.variant : 'split';
  const interval = clampInterval(content.intervalMs);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLElement>(null);
  const idx = n ? Math.min(active, n - 1) : 0;
  useEffect(() => { if (active > 0 && active >= n) setActive(Math.max(0, n - 1)); }, [active, n]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setReduced(m.matches); f();
    m.addEventListener?.('change', f); return () => m.removeEventListener?.('change', f);
  }, []);
  const running = content.autoplay === true && n > 1 && !hover && !focus && !stopped && !reduced && !preview;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % n), interval);
    return () => window.clearTimeout(t);
  }, [running, idx, n, interval]);
  if (!n) return null;
  const go = (i: number) => setActive(((i % n) + n) % n);
  const onBlur = (e: FocusEvent) => { if (!root.current?.contains(e.relatedTarget as Node | null)) setFocus(false); };
  const ctl = 'grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-foreground transition hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ph-indigo)]';
  return (
    <section ref={root} className="relative py-14 sm:py-20" role="region" aria-roledescription="carousel" aria-label={str(slides[0]?.title, 'Highlights')}
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={onBlur} data-testid="hero-slider" data-variant={v}>
      <Container>
        <div className="grid" aria-live={running ? 'off' : 'polite'}>
          {slides.map((s, i) => {
            const on = i === idx;
            return (
              <div key={i} className={cn('col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none', on ? 'opacity-100' : 'invisible opacity-0')} role="group" aria-roledescription="slide" aria-label={`Slide ${i + 1} of ${n}`} aria-hidden={!on} inert={!on} data-testid={`slide-${i}`}>
                <Slide s={s} v={v} i={i} />
              </div>
            );
          })}
        </div>
        {n > 1 ? (
          <div className={cn('mt-6 flex flex-wrap items-center gap-3', v === 'centered' && 'justify-center')}>
            <button type="button" className={ctl} onClick={() => go(idx - 1)} aria-label="Previous slide" data-testid="button-slider-prev"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose slide">
              {slides.map((s, i) => (
                <button key={i} type="button" onClick={() => go(i)} aria-label={`Show slide ${i + 1}: ${str(s.title, 'Untitled')}`} aria-current={i === idx ? 'true' : undefined} data-testid={`button-slider-dot-${i}`}
                  className="grid h-8 w-8 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ph-indigo)]">
                  <span className={cn('block h-2 rounded-full transition-all', i === idx ? 'w-6 bg-[color:var(--ph-indigo)]' : 'w-2 bg-foreground/30')} />
                </button>
              ))}
            </div>
            <button type="button" className={ctl} onClick={() => go(idx + 1)} aria-label="Next slide" data-testid="button-slider-next"><ChevronRight className="h-4 w-4" /></button>
            <span className="font-mono text-xs text-muted-foreground" data-testid="text-slider-count">{idx + 1} / {n}</span>
            {content.autoplay === true && !preview ? (
              <button type="button" className={cn(ctl, 'ml-auto h-9 w-auto gap-1.5 px-3 text-xs', v === 'centered' && 'ml-0')} onClick={() => setStopped((x) => !x)} aria-label={stopped ? 'Resume autoplay' : 'Pause autoplay'} data-testid="button-slider-autoplay">
                <span className="flex items-center gap-1.5">{stopped ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{stopped ? 'Play' : 'Pause'}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
