import { cloneElement, isValidElement, lazy, Suspense, useEffect, useId, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, IndianRupee, Mail, Phone, MapPin, ShieldCheck, Fingerprint, MessageCircle, Send, Sparkles, UsersRound } from 'lucide-react';
import { useCreateLead } from '@workspace/api-client-react';
import { arr, cta, errMsg, formatINR, iconFor, str, useSection, type AnyObj } from '@/lib/content';
import { Aurora, Container, Counter, CtaLink, Eyebrow, FaqList, GlassCard, Marquee, Reveal, SectionHead, btnPrimary } from './primitives';
import { cn } from '@/lib/utils';
import {orbitAnimation} from '@/lib/lottie-data';
import { SolutionImage } from './solution-image';
import { trackEvent, withLeadAttribution } from '@/lib/analytics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LottiePlayer = lazy(() => import('lottie-react').then((m) => ({ default: m.Lottie as ComponentType<any> })));

function HeroLottie({ url }: { url?: string }) {
  const [data, setData] = useState<object | null>(null);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!url) {setData(orbitAnimation);return;}
    let alive = true;
    fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive && j) setData(j); }).catch(() => undefined);
    return () => { alive = false; };
  }, [url]);
  if (!data) return null;
  return (
    <Suspense fallback={null}>
      <LottiePlayer src={data} autoplay loop className="absolute inset-[12%] opacity-90" />
    </Suspense>
  );
}

function HeroVisual({ lottieUrl }: { lottieUrl?: string }) {
  const preview=useSection('preview');
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[20%] rounded-full border border-dashed border-white/[0.09] orbit-spin-rev" />
      <div className="ambient-glow absolute inset-[34%] rounded-full bg-[radial-gradient(circle,rgba(109,108,246,.55),transparent_70%)] blur-2xl" />
      <div className="orbit-spin absolute inset-[6%]">
        {['var(--ph-indigo)', 'var(--ph-cyan)', 'var(--ph-pink)', '#fbbf24'].map((c, i) => (
          <span key={i} className="absolute h-3 w-3 rounded-full" style={{ background: c, boxShadow: `0 0 18px ${c}`, left: `${50 + 50 * Math.cos((i * Math.PI) / 2)}%`, top: `${50 + 50 * Math.sin((i * Math.PI) / 2)}%`, transform: 'translate(-50%,-50%)' }} />
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 z-10 grid h-24 w-44 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl glass border-gradient p-2.5 sm:h-28 sm:w-52 sm:p-3.5">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{str(preview.payrollLabel)}</div>
          <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">{str(preview.payrollPeriod)}</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300"><Check className="h-3 w-3" /> {str(preview.payrollDetail)}</div>
        </div>
      </div>
      <div className="absolute right-0 top-[47%] z-10 flex w-44 flex-col items-end gap-2 sm:-right-4 sm:top-[36%] sm:w-52">
        <div className="float-1 relative flex h-16 w-[120px] -translate-y-[50px] items-center gap-1.5 rounded-2xl glass border-gradient p-2 sm:h-20 sm:w-36 sm:gap-2 sm:p-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[color:var(--ph-indigo)]/15 text-[color:var(--ph-cyan)] sm:h-8 sm:w-8">
            <UsersRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-mono text-[7px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[8px] sm:tracking-[0.12em]">{str(preview.coreHrmsDetail, 'People suite')}</span>
            <span className="block truncate text-[10px] font-semibold text-foreground sm:text-sm">{str(preview.coreHrmsTitle, 'Core HRMS')}</span>
          </span>
        </div>
        <div className="float-2 relative h-24 w-full rounded-2xl glass p-2.5 sm:h-28 sm:p-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageCircle className="h-4 w-4 text-emerald-300" /> {str(preview.approvalLabel)}</div>
          <div className="mt-2 text-sm text-foreground">{str(preview.approvalTitle)}</div>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] text-emerald-300">{str(preview.approvalStatus)}</span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">{str(preview.approvalDetail)}</span>
          </div>
        </div>
      </div>
      <HeroLottie url={lottieUrl} />
      <div className="float-1 absolute left-0 top-[14%] w-48 rounded-2xl glass p-3.5 sm:-left-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-[color:var(--ph-cyan)]" /> {str(preview.statutoryLabel)}</div>
        <div className="mt-2 text-sm font-medium text-foreground">{str(preview.statutoryTitle)}</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[color:var(--ph-cyan)] to-[color:var(--ph-indigo)]" /></div>
        <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">{str(preview.statutoryDetail)}</div>
      </div>
      <div className="float-3 absolute bottom-[4%] left-[10%] w-44 rounded-2xl glass p-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Fingerprint className="h-4 w-4 text-[color:var(--ph-pink)]" /> {str(preview.attendanceLabel)}</div>
        <div className="mt-1.5 font-display text-2xl font-bold text-foreground">{str(preview.attendanceValue)}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{str(preview.attendanceDetail)}</div>
      </div>
      <p className="absolute -bottom-6 inset-x-0 text-center font-mono text-[9px] text-muted-foreground">{str(preview.label)}</p>
    </div>
  );
}

export function Hero() {
  const hero = useSection('hero');
  const p = cta(hero.primaryCta, '/register?mode=trial');
  const s = cta(hero.secondaryCta, '/pricing');
  const badges = arr<string>(hero.badges);
  const color = (value: unknown) => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : undefined;
  const titleColor = color(hero.titleColor);
  const descriptionColor = color(hero.descriptionColor);
  const buttonColor = color(hero.buttonColor);
  const buttonTextColor = color(hero.buttonTextColor);
  const contrastColor = (background: string) => {
    const rgb = background.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.179 ? '#0b1020' : '#ffffff';
  };
  const ctaStyle = (): CSSProperties | undefined => buttonColor || buttonTextColor
    ? { ...(buttonColor ? { background: buttonColor } : {}), ...(buttonTextColor ? { color: buttonTextColor } : buttonColor ? { color: contrastColor(buttonColor) } : {}) }
    : undefined;
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
      <Aurora intense />
      <Container className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {hero.eyebrow ? <Eyebrow>{str(hero.eyebrow)}</Eyebrow> : null}
          <h1 className="font-display mt-6 text-balance text-[2.6rem] font-extrabold leading-[0.98] sm:text-6xl lg:text-[4.4rem]" data-testid="text-hero-title">
            <span className={titleColor ? '' : 'text-gradient'} style={titleColor ? { color: titleColor, WebkitTextFillColor: titleColor, background: 'none' } : undefined}>{str(hero.title)}</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground" style={descriptionColor ? { color: descriptionColor } : undefined}>{str(hero.description)}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {p.label ? <CtaLink href={p.href} style={ctaStyle()} testId="link-hero-primary">{p.label} <ArrowRight className="h-4 w-4" /></CtaLink> : null}
            {s.label ? <CtaLink href={s.href} variant="ghost" style={ctaStyle()} testId="link-hero-secondary">{s.label}</CtaLink> : null}
          </div>
          {badges.length ? (
            <ul className="mt-10 flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--ph-cyan)]" /> {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <HeroVisual lottieUrl={hero.lottieUrl ? str(hero.lottieUrl) : undefined} />
      </Container>
    </section>
  );
}

export function Stats() {
  const stats = useSection('stats');
  const items = arr<AnyObj>(stats.items);
  if (!items.length) return null;
  return (
    <section aria-label="Key numbers" className="relative">
      <Container>
        <div className="grid grid-cols-2 overflow-hidden rounded-3xl glass md:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 80} className={cn('p-6 sm:p-8', i % 2 === 1 && 'border-l border-white/[0.06]', i >= 2 && 'border-t border-white/[0.06] md:border-t-0', i === 2 && 'md:border-l')}>
              <div className="font-display text-4xl font-bold text-foreground sm:text-5xl" data-testid={`text-stat-${i}`}><Counter value={str(it.value)} /></div>
              <div className="mt-2 text-sm text-muted-foreground">{str(it.label)}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function priorityTone(p: string) {
  return /diff/i.test(p) ? 'text-[color:var(--ph-pink)] border-[color:var(--ph-pink)]/30 bg-[color:var(--ph-pink)]/10' : 'text-[color:var(--ph-cyan)] border-[color:var(--ph-cyan)]/30 bg-[color:var(--ph-cyan)]/10';
}

export function SuitesTabs() {
  const suites = useSection('suites');
  const items = arr<AnyObj>(suites.items);
  const [active, setActive] = useState(0);
  const cur = items[active] ?? items[0];
  if (!cur) return null;
  const Icon = iconFor(cur.icon);
  const tabId = (index: number) => `suite-tab-${str(items[index]?.key, String(index)).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const handleTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + items.length) % items.length;
    setActive(next);
    trackEvent('tab_changed', { tab_id: str(items[next]?.key, String(next)) });
    document.getElementById(tabId(next))?.focus();
  };
  return (
    <section id="suites" className="relative py-24 sm:py-32">
      <Container>
        <SectionHead eyebrow={str(suites.eyebrow)} title={str(suites.title)} description={str(suites.description)} />
        <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div role="tablist" aria-label="Product suites" className="scrollbar-thin -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {items.map((s, i) => {
              const I = iconFor(s.icon);
              const on = i === active;
              return (
                <button key={i} id={tabId(i)} role="tab" type="button" aria-selected={on} aria-controls="suite-tabpanel" tabIndex={on ? 0 : -1} onClick={() => setActive(i)} onKeyDown={(event) => handleTabKey(event, i)}
                  className={cn('relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  data-testid={`tab-suite-${str(s.key, String(i))}`} data-analytics-id={str(s.key, String(i))}>
                  {on ? <motion.span layoutId="suite-tab" className="absolute inset-0 -z-0 rounded-2xl border border-white/10 bg-white/[0.06]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} /> : null}
                  <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-white/5"><I className="h-4 w-4" /></span>
                  <span className="relative whitespace-nowrap lg:whitespace-normal">{str(s.title)}</span>
                </button>
              );
            })}
          </div>
          <div id="suite-tabpanel" role="tabpanel" aria-labelledby={tabId(active)} tabIndex={0} className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="glass border-gradient h-full rounded-3xl p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand"><Icon className="h-6 w-6 text-on-brand" /></span>
                {cur.priority ? <span className={cn('rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider', priorityTone(str(cur.priority)))}>{str(cur.priority)}</span> : null}
              </div>
              <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_minmax(0,260px)]">
                <div>
                  <h3 className="font-display text-3xl font-bold text-foreground">{str(cur.title)}</h3>
                  <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{str(cur.body, str(cur.description))}</p>
                </div>
                <SolutionImage item={cur} className="order-first rounded-xl md:order-none" />
              </div>
              <ul className="mt-8 flex flex-wrap gap-2">
                {arr<string>(cur.modules).map((m, i) => (
                  <li key={i} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm capitalize text-foreground/85">{m}</li>
                ))}
              </ul>
              <Link href={`/features/${str(cur.slug)}`} className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ph-cyan)] hover:gap-3 transition-all" data-testid="link-suite-detail">
                Explore {str(cur.title)} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ServiceGrid({ base = '/services', limit, head = true }: { base?: string; limit?: number; head?: boolean }) {
  const services = useSection('services');
  const items = arr<AnyObj>(services.items).slice(0, limit ?? 99);
  return (
    <section className="relative py-24">
      <Container>
        {head ? <SectionHead eyebrow={str(services.eyebrow)} title={str(services.title)} description={str(services.description)} /> : null}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {items.map((s, i) => {
            const I = iconFor(s.icon);
            const span = i % 5 === 0 ? 'lg:col-span-3' : i % 5 === 1 ? 'lg:col-span-3' : 'lg:col-span-2';
            return (
              <Reveal key={i} delay={(i % 3) * 70} className={span}>
                <Link href={`${base}/${str(s.slug)}`} className="block h-full" data-testid={`link-service-${str(s.slug)}`}>
                  <GlassCard className="h-full p-6">
                    <SolutionImage item={s} className="-mx-2 -mt-2 mb-5 aspect-[16/9] rounded-xl" />
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><I className="h-5 w-5 text-[color:var(--ph-cyan)]" /></span>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-semibold text-foreground">{str(s.title)}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{str(s.description)}</p>
                    {s.billing ? <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[color:var(--ph-pink)]"><IndianRupee className="h-3 w-3" />{str(s.billing)}</p> : null}
                  </GlassCard>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function AiSection() {
  const ai = useSection('ai');
  const items = arr<AnyObj>(ai.items);
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="ambient-glow pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--ph-pink)_22%,transparent),transparent_65%)] blur-2xl" />
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHead eyebrow="AI & automation" title={str(ai.title)} description={str(ai.description)} />
            <div className="mt-8 hidden items-center gap-3 rounded-2xl glass p-4 lg:flex">
              <Sparkles className="h-5 w-5 text-[color:var(--ph-pink)]" />
              <span className="font-mono text-xs text-muted-foreground">{items.length} capabilities, one data model</span>
            </div>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {items.map((it, i) => {
              const I = iconFor(it.icon);
              return (
                <Reveal as="li" key={i} delay={(i % 2) * 80} className={cn(i === 0 && 'sm:col-span-2')}>
                  <GlassCard tilt={false} className="h-full p-5">
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-xs text-muted-foreground/60">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <I className="h-4 w-4 text-[color:var(--ph-cyan)]" />
                          <h3 className="font-semibold text-foreground">{str(it.title)}</h3>
                        </div>
                        {it.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{str(it.description)}</p> : null}
                      </div>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}

export function WhyUs() {
  const why = useSection('whyUs');
  const items = arr<string>(why.items);
  return (
    <section className="relative py-24">
      <Container>
        <div className="glass border-gradient relative overflow-hidden rounded-[2rem] p-6 sm:p-12">
          <div aria-hidden className="ambient-glow absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--ph-indigo)] opacity-30 blur-3xl" />
          <h2 className="font-display relative max-w-2xl text-3xl font-bold sm:text-5xl"><span className="text-gradient">{str(why.title)}</span></h2>
          <ul className="relative mt-10 grid gap-x-10 gap-y-5 md:grid-cols-2">
            {items.map((t, i) => (
              <Reveal as="li" key={i} delay={i * 60} className="flex gap-4 border-t border-white/[0.07] pt-5">
                <span className="font-display text-2xl font-bold text-[color:var(--ph-cyan)]/70">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-lg leading-snug text-foreground/90">{t}</span>
              </Reveal>
            ))}
          </ul>
          {why.complianceNote ? (
            <div className="relative mt-10 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm leading-relaxed text-amber-100/80" data-testid="text-compliance-note">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p>{str(why.complianceNote)}</p>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export function Integrations() {
  const integ = useSection('integrations');
  return (
    <section className="relative py-20">
      <Container>
        <h2 className="text-center font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">{str(integ.title)}</h2>
      </Container>
      <div className="mt-8"><Marquee items={arr<string>(integ.items)} /></div>
    </section>
  );
}

export function PricingTable({ h1 }: { h1?: boolean }) {
  const pricing = useSection('pricing');
  const suites = useSection('suites');
  const suiteName = (k: string) => str(arr<AnyObj>(suites.items).find((s) => s.key === k)?.title, k.replace(/_/g, ' '));
  const plans = arr<AnyObj>(pricing.plans);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <Container>
        <div className="flex flex-col items-center text-center">
          <SectionHead center title={str(pricing.title)} description={str(pricing.description)} h1={h1} />
          <div className="mt-8 inline-flex rounded-full glass p-1" role="radiogroup" aria-label="Billing cycle">
            {(['monthly', 'annual'] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)} className="relative rounded-full px-5 py-2 text-sm font-medium capitalize" data-testid={`toggle-cycle-${c}`}>
                {cycle === c ? <motion.span layoutId="cycle-pill" className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 30 }} /> : null}
                <span className={cn('relative', cycle === c ? 'text-on-brand' : 'text-muted-foreground')}>{c}</span>
              </button>
            ))}
          </div>
          {pricing.trialDays ? <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">{str(pricing.trialDays)}-day free trial on every plan. No card required.</p> : null}
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => {
            const price = cycle === 'annual' ? p.annual : p.monthly;
            const numeric = /^\d/.test(str(price)) || typeof price === 'number';
            const key = str(p.key);
            const isSales = /sales|contact/i.test(str(p.button));
            const href = isSales ? '/contact' : `/register?plan=${key}&mode=trial`;
            return (
              <Reveal key={key || i} delay={i * 90}>
                <div className={cn('relative flex h-full flex-col rounded-3xl p-7', p.highlighted ? 'glass border-gradient shadow-[0_30px_80px_-30px_var(--ph-indigo)] lg:-translate-y-4' : 'glass')} data-testid={`card-plan-${key}`}>
                  {p.highlighted ? <div aria-hidden className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[color:var(--ph-pink)] to-transparent" /> : null}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold text-foreground">{str(p.name)}</h3>
                    {p.badge ? <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-on-brand">{str(p.badge)}</span> : null}
                  </div>
                  <div className="mt-6 flex items-end gap-2">
                    <motion.span key={`${cycle}-${key}`} initial={false} animate={{ opacity: 1 }} className="font-display text-5xl font-bold text-foreground" data-testid={`text-price-${key}`}>
                      {numeric ? formatINR(price) : str(price, 'Custom')}
                    </motion.span>
                    {numeric ? <span className="pb-2 text-sm text-muted-foreground">/ employee / month</span> : null}
                  </div>
                  {numeric && cycle === 'annual' ? <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[color:var(--ph-cyan)]">Billed annually</p> : <p className="mt-1 h-4" />}
                  <Link href={href} className={cn('mt-7', p.highlighted ? btnPrimary : 'inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold hover:bg-white/5')} data-testid={`link-plan-${key}`}>
                    {str(p.button, 'Start free trial')}
                  </Link>
                  <div className="mt-8 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Suites included</div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {arr<string>(p.modules).map((m) => <li key={m} className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-foreground/80">{suiteName(m)}</li>)}
                  </ul>
                  <ul className="mt-6 space-y-2.5 border-t border-white/[0.07] pt-6">
                    {arr<string>(p.features).map((f, j) => (
                      <li key={j} className="flex gap-2.5 text-sm text-foreground/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />{f}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function FaqSection({ h1, items, title }: { h1?: boolean; items?: AnyObj[]; title?: string }) {
  const faq = useSection('faq');
  const list = items ?? arr<AnyObj>(faq.items);
  const H = h1 ? 'h1' : 'h2';
  if (!list.length) return null;
  return (
    <section id="faq" className="relative py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr]">
        <Reveal>
          <H className="font-display text-3xl font-bold sm:text-5xl"><span className="text-gradient">{title ?? str(faq.title)}</span></H>
          <p className="mt-4 text-muted-foreground">Still unsure? <Link href="/contact" className="text-[color:var(--ph-cyan)] underline underline-offset-4">Talk to our team</Link>.</p>
        </Reveal>
        <FaqList items={list} />
      </Container>
    </section>
  );
}

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Enter a valid work email').max(254),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  organisation: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Tell us a little more (min 5 characters)').max(5000),
});
type LeadForm = z.infer<typeof leadSchema>;

export const inputCls = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[color:var(--ph-indigo)] focus:bg-white/[0.05] focus:ring-4 focus:ring-[color:var(--ph-indigo)]/15';

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  const id = useId();
  const helpId = `${id}-help`;
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id: (children.props as { id?: string }).id ?? id,
      'aria-invalid': error ? true : (children.props as { 'aria-invalid'?: boolean })['aria-invalid'],
      'aria-describedby': [((children.props as { 'aria-describedby'?: string })['aria-describedby']), error || hint ? helpId : undefined].filter(Boolean).join(' ') || undefined,
    })
    : children;
  return (
    <div className="block">
      <label htmlFor={isValidElement(child) ? (child.props as { id?: string }).id : undefined} className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</label>
      {child}
      {error ? <span id={helpId} role="alert" className="mt-1 block text-xs text-[hsl(var(--destructive))]">{error}</span> : hint ? <span id={helpId} className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function ContactSection({ h1 }: { h1?: boolean }) {
  const contact = useSection('contact');
  const lead = useCreateLead();
  const [done, setDone] = useState(false);
  const form = useForm<LeadForm>({ resolver: zodResolver(leadSchema), defaultValues: { name: '', email: '', phone: '', organisation: '', message: '' } });
  const H = h1 ? 'h1' : 'h2';
  const onSubmit = form.handleSubmit((v) => {
    lead.mutate(
      { data: { name: v.name, email: v.email, message: withLeadAttribution(v.message), ...(v.phone ? { phone: v.phone } : {}), ...(v.organisation ? { organisation: v.organisation } : {}) } },
      { onSuccess: () => { trackEvent('lead_submitted', { form_id: 'contact' }); setDone(true); form.reset(); } },
    );
  });
  return (
    <section id="contact" className="relative py-24">
      <Container className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <H className="font-display text-3xl font-bold sm:text-5xl"><span className="text-gradient">{str(contact.title)}</span></H>
          <p className="mt-4 max-w-md text-muted-foreground">{str(contact.description)}</p>
          <div className="mt-8 space-y-3">
            {contact.email ? <a href={`mailto:${contact.email}`} aria-label={`Email ${str(contact.email)}`} className="flex items-center gap-3 rounded-2xl glass p-4 hover:border-white/20" data-testid="link-contact-email"><Mail className="h-5 w-5 shrink-0 text-[color:var(--ph-cyan)]" /><span><span className="block text-xs text-muted-foreground">General enquiries</span><span>{str(contact.email)}</span></span></a> : null}
            {contact.supportEmail ? <a href={`mailto:${contact.supportEmail}`} aria-label={`Email support at ${str(contact.supportEmail)}`} className="flex items-center gap-3 rounded-2xl glass p-4 hover:border-white/20" data-testid="link-contact-support-email"><Mail className="h-5 w-5 shrink-0 text-[color:var(--ph-cyan)]" /><span><span className="block text-xs text-muted-foreground">Support</span><span>{str(contact.supportEmail)}</span></span></a> : null}
            {contact.phone ? <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} className="flex items-center gap-3 rounded-2xl glass p-4 hover:border-white/20" data-testid="link-contact-phone"><Phone className="h-5 w-5 text-[color:var(--ph-pink)]" />{str(contact.phone)}</a> : null}
            {contact.address ? <div className="flex items-start gap-3 rounded-2xl glass p-4" data-testid="text-contact-address"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--ph-cyan)]" /><address className="whitespace-pre-line break-words not-italic">{contact.mapUrl ? <a href={str(contact.mapUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">{str(contact.address)}</a> : str(contact.address)}</address></div> : null}
            {contact.officeHours ? <p className="text-sm text-muted-foreground" data-testid="text-contact-hours">{str(contact.officeHours)}</p> : null}
          </div>
        </Reveal>
        <div className="glass rounded-3xl p-6 sm:p-8">
          {done ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center text-center" data-testid="status-lead-sent">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15"><Check className="h-7 w-7 text-emerald-300" /></span>
              <h3 className="font-display mt-5 text-2xl font-bold">Message received</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">Our team typically replies within one business day.</p>
              <button type="button" onClick={() => setDone(false)} className="mt-6 text-sm text-[color:var(--ph-cyan)] underline underline-offset-4" data-testid="button-lead-again">Send another message</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
              <Field label="Your name" error={form.formState.errors.name?.message}><input className={inputCls} {...form.register('name')} autoComplete="name" data-testid="input-lead-name" /></Field>
              <Field label="Work email" error={form.formState.errors.email?.message}><input className={inputCls} type="email" {...form.register('email')} autoComplete="email" data-testid="input-lead-email" /></Field>
              <Field label="Phone (optional)" error={form.formState.errors.phone?.message}><input className={inputCls} {...form.register('phone')} autoComplete="tel" data-testid="input-lead-phone" /></Field>
              <Field label="Organisation (optional)" error={form.formState.errors.organisation?.message}><input className={inputCls} {...form.register('organisation')} autoComplete="organization" data-testid="input-lead-org" /></Field>
              <div className="sm:col-span-2"><Field label="How can we help?" error={form.formState.errors.message?.message}><textarea rows={5} className={inputCls} {...form.register('message')} data-testid="input-lead-message" /></Field></div>
              {lead.isError ? <p role="alert" className="sm:col-span-2 text-sm text-[hsl(var(--destructive))]">{errMsg(lead.error)}</p> : null}
              <div className="sm:col-span-2">
                <button type="submit" disabled={lead.isPending} className={cn(btnPrimary, 'w-full sm:w-auto')} data-testid="button-lead-submit">
                  {lead.isPending ? 'Sending...' : 'Send message'} <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

export function CtaBand() {
  const c = useSection('cta');
  const btn = cta(c.button, '/register?mode=trial');
  if (!c.title) return null;
  return (
    <section className="relative py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-16 text-center sm:px-16">
          <Aurora intense />
          <div className="relative">
            <h2 className="font-display mx-auto max-w-3xl text-balance text-4xl font-bold sm:text-6xl"><span className="text-gradient">{str(c.title)}</span></h2>
            {c.description ? <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{str(c.description)}</p> : null}
            <div className="mt-9 flex justify-center"><CtaLink href={btn.href} testId="link-cta-band">{btn.label || 'Start free trial'} <ArrowRight className="h-4 w-4" /></CtaLink></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
