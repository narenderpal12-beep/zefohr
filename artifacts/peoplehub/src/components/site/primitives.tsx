import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Scroll reveal that never hides content from server HTML: content renders visible,
 * and only elements below the fold are hidden after hydration, then revealed on scroll.
 */
export function Reveal({
  children, className, delay = 0, as: Tag = 'div', style,
}: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li' | 'article'; style?: CSSProperties }) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || typeof IntersectionObserver === 'undefined') return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) return;
    setState('hidden');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { setState('shown'); io.disconnect(); } }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as 'div';
  return (
    <T
      ref={ref as never}
      data-reveal={state === 'idle' ? undefined : state}
      className={className}
      style={{ ...style, ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </T>
  );
}

/** Animated counter. SSR renders the final value. */
export function Counter({ value }: { value: string }) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const target = m ? Number(m[2]) : 0;
  const [n, setN] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!m || reduced() || !ref.current) return;
    const el = ref.current;
    let raf = 0;
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        const eased = 1 - Math.pow(1 - p, 4);
        setN(target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setN(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  if (!m) return <span>{value}</span>;
  const shown = n === null ? m[2] : Number.isInteger(target) ? Math.round(n).toString() : n.toFixed(1);
  return <span ref={ref}>{m[1]}{shown}{m[3]}</span>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[color:var(--ph-cyan)]', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ph-cyan)] shadow-[0_0_12px_var(--ph-cyan)]" />
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, description, center, h1 }: { eyebrow?: string; title?: string; description?: string; center?: boolean; h1?: boolean }) {
  const H = h1 ? 'h1' : 'h2';
  return (
    <Reveal className={cn('max-w-3xl', center && 'mx-auto text-center')}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <H className={cn('font-display mt-5 text-balance font-bold leading-[1.02] text-foreground', h1 ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl')}>
          <span className="text-gradient">{title}</span>
        </H>
      ) : null}
      {description ? <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p> : null}
    </Reveal>
  );
}

export function GlassCard({ children, className, tilt = true, ...rest }: { children: ReactNode; className?: string; tilt?: boolean; 'data-testid'?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    if (tilt) el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-2px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn('glass tilt group relative overflow-hidden rounded-3xl hover:border-white/20', className)} {...rest}>
      <div className="glow-follow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand shadow-[0_10px_40px_-12px_var(--ph-indigo)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/[0.09] disabled:opacity-60';

export function CtaLink({ href, children, variant = 'primary', className, testId }: { href: string; children: ReactNode; variant?: 'primary' | 'ghost'; className?: string; testId?: string }) {
  const cls = cn(variant === 'primary' ? btnPrimary : btnGhost, className);
  if (/^(https?:|mailto:|tel:)/.test(href)) return <a href={href} className={cls} data-testid={testId}>{children}</a>;
  return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
}

export function Aurora({ className, intense }: { className?: string; intense?: boolean }) {
  return (
    <div aria-hidden className={cn('aurora-backdrop pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="aurora-blob anim-a" style={{ width: '46vw', height: '46vw', left: '-8vw', top: '-14vw', background: 'var(--ph-indigo)', opacity: intense ? 0.6 : 0.4 }} />
      <div className="aurora-blob anim-b" style={{ width: '38vw', height: '38vw', right: '-6vw', top: '-4vw', background: 'var(--ph-cyan)', opacity: intense ? 0.38 : 0.25 }} />
      <div className="aurora-blob anim-c" style={{ width: '34vw', height: '34vw', left: '34vw', top: '14vw', background: 'var(--ph-pink)', opacity: intense ? 0.4 : 0.22 }} />
      <div className="grid-lines absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[color:var(--ph-bg)]" />
    </div>
  );
}

export function FaqList({ items, idPrefix = 'faq' }: { items: { question?: string; answer?: string }[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/[0.07] rounded-3xl glass">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="px-5 sm:px-7">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium text-foreground sm:text-lg"
                data-testid={`button-${idPrefix}-${i}`}
              >
                <span>{f.question}</span>
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 transition-transform duration-300', isOpen && 'rotate-45 bg-white/10')}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            {/* Answer kept in DOM for crawlers; collapsed visually */}
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }} className="overflow-hidden">
                  <p className="pb-6 pr-10 leading-relaxed text-muted-foreground">{f.answer}</p>
                </motion.div>
              ) : (
                <p className="sr-only">{f.answer}</p>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrap relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <ul className="marquee-track flex w-max gap-4 py-2">
        {doubled.map((t, i) => (
          <li key={i} aria-hidden={i >= items.length} className="glass whitespace-nowrap rounded-2xl px-6 py-4 font-display text-lg font-semibold text-foreground/80">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 ? <span className="text-white/20">/</span> : null}
            {it.href ? <Link href={it.href} className="hover:text-foreground">{it.label}</Link> : <span className="text-foreground/80">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ crumbs, eyebrow, title, description, children }: { crumbs?: { label: string; href?: string }[]; eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <SectionHead eyebrow={eyebrow} title={title} description={description} h1 />
        {children}
      </div>
    </section>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative mx-auto max-w-6xl px-5 sm:px-8', className)}>{children}</div>;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/[0.05]', className)} />;
}
