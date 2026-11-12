import { useMemo, type ComponentType, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ContentOverrideProvider, arr, iconFor, str, type AnyObj } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { Container, CtaLink, Eyebrow, Reveal, SectionHead } from './primitives';
import { AiSection, ContactSection, CtaBand, FaqSection, Hero, Integrations, PricingTable, ServiceGrid, Stats, SuitesTabs, WhyUs } from './sections';
import { ClientsSection } from './clients';
import { cn } from '@/lib/utils';
import { HeroSlider } from './hero-slider';
import { CreativeHomeSection } from '@/pages/home-creative';

const NATIVE: Record<string, { key: string; C: ComponentType }> = {
  hero: { key: 'hero', C: Hero }, faq: { key: 'faq', C: () => <FaqSection /> }, cta: { key: 'cta', C: CtaBand }, stats: { key: 'stats', C: Stats },
  clients: { key: 'clients', C: ClientsSection }, suites: { key: 'suites', C: SuitesTabs }, services: { key: 'services', C: () => <ServiceGrid /> },
  pricing: { key: 'pricing', C: () => <PricingTable /> }, contact: { key: 'contact', C: () => <ContactSection /> }, ai: { key: 'ai', C: AiSection },
  whyUs: { key: 'whyUs', C: WhyUs }, integrations: { key: 'integrations', C: Integrations },
};

function BlockCta({ c }: { c: AnyObj }) {
  if (!str(c.ctaLabel) || !str(c.ctaHref)) return null;
  return <div className="mt-8"><CtaLink href={str(c.ctaHref)} testId="link-block-cta">{str(c.ctaLabel)} <ArrowRight className="h-4 w-4" /></CtaLink></div>;
}

function TextBlock({ c }: { c: AnyObj }) {
  return (
    <section className="relative py-16 sm:py-20">
      <Container className="max-w-3xl">
        <Reveal>
          {c.eyebrow ? <Eyebrow>{str(c.eyebrow)}</Eyebrow> : null}
          {c.title ? <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl"><span className="text-gradient">{str(c.title)}</span></h2> : null}
          {c.body ? <div className="mt-6"><Markdown source={str(c.body)} /></div> : null}
          <BlockCta c={c} />
        </Reveal>
      </Container>
    </section>
  );
}

function ImageTextBlock({ c }: { c: AnyObj }) {
  const right = c.imageRight !== false;
  return (
    <section className="relative py-16 sm:py-20">
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <div className={cn('solution-frame aspect-[4/3] overflow-hidden rounded-3xl', right && 'md:order-2')}>
          {c.imageUrl ? <img src={str(c.imageUrl)} alt={str(c.imageAlt)} loading="lazy" className="solution-photo h-full w-full object-cover" /> : null}
        </div>
        <Reveal>
          {c.eyebrow ? <Eyebrow>{str(c.eyebrow)}</Eyebrow> : null}
          {c.title ? <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl"><span className="text-gradient">{str(c.title)}</span></h2> : null}
          {c.body ? <div className="mt-5"><Markdown source={str(c.body)} /></div> : null}
          <BlockCta c={c} />
        </Reveal>
      </Container>
    </section>
  );
}

function CardsBlock({ c }: { c: AnyObj }) {
  const items = arr<AnyObj>(c.items);
  return (
    <section className="relative py-16 sm:py-20">
      <Container>
        {c.title || c.eyebrow ? <SectionHead eyebrow={str(c.eyebrow)} title={str(c.title)} description={str(c.description)} /> : null}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const I = iconFor(it.icon);
            const href = str(it.href);
            const inner = (
              <div className="glass group h-full rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><I className="h-5 w-5 text-[color:var(--ph-cyan)]" /></span>
                  {href ? <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> : null}
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold text-foreground">{str(it.title)}</h3>
                {it.description ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(it.description)}</p> : null}
              </div>
            );
            return (
              <Reveal key={i} delay={(i % 3) * 70} className={cn(items.length % 3 === 1 && i === 0 && 'lg:col-span-2')}>
                {href ? (/^(https?:|mailto:|tel:)/.test(href) ? <a href={href} className="block h-full" data-testid={`link-card-${i}`}>{inner}</a> : <Link href={href} className="block h-full" data-testid={`link-card-${i}`}>{inner}</Link>) : inner}
              </Reveal>
            );
          })}
        </div>
        <BlockCta c={c} />
      </Container>
    </section>
  );
}

/** Custom (page-owned) block renderer; also used for safe inline admin previews. */
export function CustomBlock({ type, content, preview }: { type: string; content: AnyObj; preview?: boolean }) {
  if (type === 'creativeSection') return <CreativeHomeSection section={str(content.section, 'hero')} content={content.overrides as AnyObj | undefined} />;
  if (type === 'heroSlider') return <HeroSlider content={content} preview={preview} />;
  if (type === 'text') return <TextBlock c={content} />;
  if (type === 'imageText') return <ImageTextBlock c={content} />;
  if (type === 'cards') return <CardsBlock c={content} />;
  return null;
}

function NativeBlock({ type, content }: { type: string; content: AnyObj }) {
  const n = NATIVE[type];
  const overrides = useMemo(() => (n ? { [n.key]: content } : {}), [n, content]);
  if (!n) return null;
  const el = <n.C />;
  return Object.keys(content).length ? <ContentOverrideProvider overrides={overrides}>{el}</ContentOverrideProvider> : el;
}

/** Renders a saved section list. `original` is rendered for the original block (native routes only). */
export function PageBlocks({ sections, original }: { sections: unknown; original?: ReactNode }) {
  const list = arr<AnyObj>(sections).filter((s) => s && typeof s === 'object' && s.enabled !== false);
  return (
    <>
      {list.map((s, i) => {
        const type = str(s.type);
        const content = (s.content && typeof s.content === 'object' ? s.content : {}) as AnyObj;
        const key = str(s.id, String(i));
        if (type === 'original') return <div key={key} data-block="original">{original ?? null}</div>;
        if (type === 'text' || type === 'imageText' || type === 'cards' || type === 'heroSlider' || type === 'creativeSection') return <div key={key} data-block={type}><CustomBlock type={type} content={content} /></div>;
        return <div key={key} data-block={type}><NativeBlock type={type} content={content} /></div>;
      })}
    </>
  );
}
