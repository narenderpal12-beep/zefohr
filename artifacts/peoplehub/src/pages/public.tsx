import { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Compass, Tag, UserRound } from 'lucide-react';
import { arr, iconFor, str, useContent, usePublicPages, usePublicPosts, useSection, type AnyObj } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { Aurora, Container, CtaLink, FaqList, GlassCard, PageHero, Reveal, SectionHead, SkeletonBlock } from '@/components/site/primitives';
import {
  AiSection, ContactSection, CtaBand, FaqSection, Hero, Integrations, PricingTable, ServiceGrid, Stats, SuitesTabs, WhyUs, priorityTone,
} from '@/components/site/sections';
import { ClientsSection } from '@/components/site/clients';
import { PageBlocks } from '@/components/site/page-blocks';
import { SolutionImage } from '@/components/site/solution-image';
import { FreeToolsTeaser } from './free-tools';
import { HomeAlternate } from './home-alternate';
import { cn } from '@/lib/utils';

export function HomePage() {
  const homepage = useSection('homepage');
  if (str(homepage.activeVariant) === 'alternate') return <HomeAlternate />;
  return (
    <>
      <Hero />
      <Stats />
      <ClientsSection />
      <SuitesTabs />
      <FreeToolsTeaser />
      <ServiceGrid />
      <AiSection />
      <WhyUs />
      <Integrations />
      <PricingTable />
      <FaqSection />
      <ContactSection />
      <CtaBand />
    </>
  );
}

export function FeaturesPage() {
  const suites = useSection('suites');
  const items = arr<AnyObj>(suites.items);
  return (
    <>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Features' }]} eyebrow={str(suites.eyebrow)} title={str(suites.title, 'Features')} description={str(suites.description)} />
      <Container>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((s, i) => {
            const I = iconFor(s.icon);
            return (
              <Reveal key={i} delay={(i % 2) * 80}>
                <Link href={`/features/${str(s.slug)}`} className="block h-full" data-testid={`link-feature-${str(s.slug)}`}>
                  <GlassCard className="h-full p-7">
                    <SolutionImage item={s} className="-mx-3 -mt-3 mb-6 aspect-[2/1] rounded-xl" />
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] border border-white/10"><I className="h-5 w-5 text-[color:var(--ph-cyan)]" /></span>
                      <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
                    </div>
                    <h2 className="font-display mt-6 text-2xl font-bold text-foreground">{str(s.title)}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(s.description)}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {arr<string>(s.modules).slice(0, 6).map((m) => <span key={m} className="rounded-md bg-white/[0.05] px-2 py-1 text-xs capitalize text-foreground/75">{m}</span>)}
                      {arr(s.modules).length > 6 ? <span className="px-2 py-1 text-xs text-muted-foreground">+{arr(s.modules).length - 6} more</span> : null}
                    </div>
                    {s.priority ? <span className={cn('mt-6 inline-block rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider', priorityTone(str(s.priority)))}>{str(s.priority)}</span> : null}
                  </GlassCard>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
      <CtaBand />
    </>
  );
}

function DetailPage({ kind }: { kind: 'suites' | 'services' }) {
  const params = useParams<{ slug: string }>();
  const section = useSection(kind);
  const content = useContent();
  const items = arr<AnyObj>(section.items);
  const item = items.find((s) => str(s.slug) === params.slug);
  if (!content) return <PageSkeleton />;
  if (!item) return <NotFoundPage />;
  const base = kind === 'suites' ? '/features' : '/services';
  const label = kind === 'suites' ? 'Features' : 'Services';
  const I = iconFor(item.icon);
  const others = items.filter((s) => s !== item).slice(0, 4);
  const moduleDetails = arr<AnyObj>(item.moduleDetails);
  const processSteps = arr<AnyObj>(kind === 'suites' ? item.workflowSteps : item.engagementSteps);
  const focusAreas = arr<string>(item.modules);
  const hasImage = Boolean(str(item.imageUrl));
  const primaryHref = kind === 'suites' ? '/register?mode=trial' : '/request-demo';
  const primaryLabel = kind === 'suites' ? 'Start free trial' : 'Discuss this service';
  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-28 sm:pb-16 sm:pt-36">
        <Aurora />
        <Container>
          <nav aria-label="Breadcrumb" className="relative mb-7 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
              <li aria-hidden="true" className="text-white/25">/</li>
              <li><Link href={base} className="hover:text-foreground">{label}</Link></li>
              <li aria-hidden="true" className="text-white/25">/</li>
              <li aria-current="page" className="text-foreground/80">{str(item.title)}</li>
            </ol>
          </nav>
          <div className={cn('grid items-center gap-8 lg:gap-12', hasImage && 'lg:grid-cols-2')}>
            {hasImage ? (
              <Reveal className="order-1">
                <div className="relative">
                  <SolutionImage item={item} eager className="aspect-[4/3] w-full rounded-3xl border border-white/10" />
                  <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-background/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground/85 backdrop-blur">
                    {kind === 'suites' ? 'Product direction' : 'Service overview'}
                  </span>
                </div>
              </Reveal>
            ) : null}
            <Reveal delay={80} className="order-2">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ph-cyan)]">
                {kind === 'suites' ? 'Product suite' : 'People services'}
              </p>
              <h1 id="offer-detail-title" className="font-display mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{str(item.title)}</h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{str(item.description)}</p>
              {item.body ? <div className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"><Markdown source={str(item.body)} /></div> : null}
              {kind === 'suites' ? (
                <p role="note" className="mt-5 max-w-xl rounded-xl border border-[color:var(--ph-cyan)]/20 bg-[color:var(--ph-cyan)]/[0.06] px-4 py-3 text-xs leading-relaxed text-foreground/75">
                  Planned HRMS suite: product screens and workflows describe product direction; operational HRMS functionality is planned for Phase 2.
                </p>
              ) : null}
              {focusAreas.length ? (
                <div className="mt-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{kind === 'suites' ? 'Workflows to explore' : 'Areas to scope'}</p>
                  <ul className="flex flex-wrap gap-2" aria-label={kind === 'suites' ? 'Key workflows' : 'Service scope areas'}>
                    {focusAreas.slice(0, 4).map((area) => <li key={area} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs capitalize text-foreground/80">{area}</li>)}
                    {focusAreas.length > 4 ? <li className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground">+{focusAreas.length - 4} more</li> : null}
                  </ul>
                </div>
              ) : null}
              <div className="mt-7 flex flex-wrap gap-3">
                <CtaLink href={primaryHref} testId="link-detail-trial">{primaryLabel} <ArrowRight className="h-4 w-4" /></CtaLink>
                <CtaLink href="/contact" variant="ghost" testId="link-detail-contact">{kind === 'suites' ? 'Talk to an expert' : 'Contact the team'}</CtaLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
      <Container className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="glass border-gradient rounded-3xl p-7 sm:p-9">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand"><I className="h-5 w-5 text-on-brand" /></span>
            <h2 className="font-display text-2xl font-bold">{kind === 'suites' ? 'Modules and workflows' : 'Service scope'}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {kind === 'suites'
              ? 'Explore the records and handoffs a team can plan before adopting a connected HR workflow.'
              : 'Review the responsibilities and handoffs for each area, then agree the scope before an engagement begins.'}
          </p>
          {moduleDetails.length ? (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {moduleDetails.map((m, i) => (
                <li key={`${str(m.title)}-${i}`} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <h3 className="font-semibold capitalize text-foreground">{str(m.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{str(m.description)}</p>
                </li>
              ))}
            </ul>
          ) : kind === 'services' && focusAreas.length ? (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {focusAreas.map((area) => (
                <li key={area} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <h3 className="font-semibold capitalize text-foreground">{area}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Confirm the responsibilities, records and handoffs for {area.toLowerCase()} before work begins.</p>
                </li>
              ))}
            </ul>
          ) : <ul className="mt-7 grid gap-2 sm:grid-cols-2">{arr<string>(item.modules).map((m) => <li key={m} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm capitalize text-foreground/90"><span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ph-cyan)]" />{m}</li>)}</ul>}
          {item.billing ? <p className="mt-6 font-mono text-xs uppercase tracking-wider text-[color:var(--ph-pink)]">Billed as: {str(item.billing)}</p> : null}
        </Reveal>
        <Reveal delay={100} className="glass rounded-3xl p-7 sm:p-9">
          <h2 className="font-display text-2xl font-bold">Why teams choose it</h2>
          <ul className="mt-6 space-y-4">
            {arr<string>(item.benefits).map((b, i) => (
              <li key={i} className="flex gap-3 text-foreground/90"><Check className="mt-1 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />{b}</li>
            ))}
          </ul>
        </Reveal>
      </Container>
      {kind === 'suites' && arr<AnyObj>(item.audiences).length ? (
        <Container className="mt-10">
          <div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ph-cyan)]">Built around shared ownership</p><h2 className="font-display mt-3 text-3xl font-bold">Who is part of the workflow?</h2></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{arr<AnyObj>(item.audiences).map((aud, i) => <Reveal key={i} delay={i * 60} className="glass rounded-2xl p-6"><h3 className="font-semibold">{str(aud.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(aud.description)}</p></Reveal>)}</div>
        </Container>
      ) : null}
      {processSteps.length ? (
        <Container className="mt-12">
          <div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ph-cyan)]">{kind === 'suites' ? 'A practical starting point' : 'How an engagement begins'}</p><h2 className="font-display mt-3 text-3xl font-bold">{kind === 'suites' ? 'Plan a workflow your team can own.' : 'Agree the scope before work begins.'}</h2></div>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">{processSteps.map((step, i) => <li key={i} className="glass rounded-2xl p-6"><span className="font-mono text-xs text-[color:var(--ph-cyan)]">{String(i + 1).padStart(2, '0')}</span><h3 className="mt-3 font-semibold">{str(step.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(step.description)}</p></li>)}</ol>
        </Container>
      ) : null}
      {arr(item.faq).length ? <FaqSection items={arr<AnyObj>(item.faq)} title={`${str(item.title)}: questions`} /> : null}
      <Container className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{kind === 'suites' ? 'Related products' : 'Related services'}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <Link key={str(o.slug)} href={`${base}/${str(o.slug)}`} className="group glass rounded-2xl p-4 text-sm text-foreground/90 hover:border-white/20" data-testid={`link-related-${str(o.slug)}`}>
              <SolutionImage item={o} className="mb-3 aspect-[16/9] rounded-lg" />
              {str(o.title)} <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Container>
      <CtaBand />
    </>
  );
}
export const FeatureDetailPage = () => <DetailPage kind="suites" />;
export const ServiceDetailPage = () => <DetailPage kind="services" />;

export function ServicesPage() {
  const services = useSection('services');
  return (
    <>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]} eyebrow={str(services.eyebrow)} title={str(services.title, 'Services')} description={str(services.description)} />
      <div className="-mt-24"><ServiceGrid head={false} /></div>
      <CtaBand />
    </>
  );
}

export function PricingPage() {
  const pricing = useSection('pricing');
  const suites = arr<AnyObj>(useSection('suites').items);
  const plans = arr<AnyObj>(pricing.plans);
  return (
    <>
      <div className="relative pt-16"><Aurora /><PricingTable h1 /></div>
      {plans.length && suites.length ? (
        <section className="py-16">
          <Container>
            <div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ph-cyan)]">Plan details</p><h2 className="font-display mt-3 text-3xl font-bold">{str(pricing.comparisonTitle, 'Compare the available suites')}</h2><p className="mt-3 text-muted-foreground">{str(pricing.comparisonDescription)}</p></div>
            <div className="mt-7 overflow-x-auto rounded-2xl border border-white/10" role="region" aria-label="Plan suite comparison" tabIndex={0}>
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <caption className="sr-only">{str(pricing.comparisonTitle, 'Compare the available suites')}</caption>
                <thead><tr className="bg-white/[0.04]"><th scope="col" className="p-4 font-semibold">Suite</th>{plans.map((plan, i) => <th scope="col" key={str(plan.key, String(i))} className="p-4 font-semibold">{str(plan.name)}</th>)}</tr></thead>
                <tbody>{suites.map((suite, i) => <tr key={str(suite.key, String(i))} className="border-t border-white/[0.08]"><th scope="row" className="p-4 font-medium">{str(suite.title)}</th>{plans.map((plan, j) => { const included = arr<string>(plan.modules).includes(str(suite.key)); return <td key={str(plan.key, String(j))} className="p-4 text-center">{included ? <span className="text-[color:var(--ph-cyan)]" aria-label={`Included in ${str(plan.name)}`}>Included</span> : <span className="text-muted-foreground" aria-label={`Not listed in ${str(plan.name)}`}>—</span>}</td>; })}</tr>)}</tbody>
              </table>
            </div>
          </Container>
        </section>
      ) : null}
      <FaqSection />
      <CtaBand />
    </>
  );
}

export function FaqPage() {
  return <div className="pt-20"><FaqSection h1 /><CtaBand /></div>;
}

export function ContactPage() {
  return <div className="relative pt-20"><Aurora /><ContactSection h1 /></div>;
}

export function AboutPage() {
  const about = useSection('about');
  const why = useSection('whyUs');
  const roadmap = useSection('roadmap');
  return (
    <>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]} eyebrow="About" title={str(about.title, 'About')} description={str(about.description)} />
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arr<string>(about.values).map((v, i) => (
            <Reveal key={i} delay={i * 70} className="glass rounded-3xl p-6">
              <span className="font-display text-4xl font-bold text-[color:var(--ph-indigo)]/70">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-4 text-lg text-foreground/90">{v}</p>
            </Reveal>
          ))}
        </div>
      </Container>
      {arr<string>(about.focusAreas).length ? (
        <Container className="mt-14">
          <SectionHead eyebrow={str(about.focusTitle, 'Our focus')} title={str(about.focusDescription, 'Practical systems for people operations.')} />
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">{arr<string>(about.focusAreas).map((area, i) => <li key={i} className="glass rounded-2xl p-6"><span className="font-mono text-xs text-[color:var(--ph-cyan)]">{String(i + 1).padStart(2, '0')}</span><p className="mt-3 font-semibold">{area}</p></li>)}</ul>
        </Container>
      ) : null}
      {arr(roadmap.items).length ? (
        <section className="py-24">
          <Container>
            <SectionHead eyebrow="Roadmap" title={str(roadmap.title)} />
            <RoadmapList items={arr<AnyObj>(roadmap.items)} />
          </Container>
        </section>
      ) : null}
      {why.title ? <WhyUs /> : null}
      <CtaBand />
    </>
  );
}

export function RoadmapList({ items }: { items: AnyObj[] }) {
  return (
    <ol className="relative mt-10 space-y-4 border-l border-white/10 pl-6">
      {items.map((r, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-[color:var(--ph-bg)] bg-[color:var(--ph-cyan)] shadow-[0_0_14px_var(--ph-cyan)]" />
          <div className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">{str(r.title)}</h3>
              {r.status ? <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{str(r.status)}</span> : null}
            </div>
            {r.description ? <p className="mt-1.5 text-sm text-muted-foreground">{str(r.description)}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BlogPage() {
  const { posts, loaded, error, refetch } = usePublicPosts();
  const published = posts.filter((p) => !p.status || p.status === 'published');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const topics = Array.from(new Set(published.flatMap((p) => arr<string>(p.tags)))).sort((a, b) => a.localeCompare(b));
  const filtered = published.filter((p) => {
    const haystack = `${str(p.title)} ${str(p.excerpt)} ${arr<string>(p.tags).join(' ')}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (topic === 'all' || arr<string>(p.tags).includes(topic));
  });
  return (
    <>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} eyebrow="Field notes" title="HR, payroll and compliance, explained" description="Practical guides for Indian MSMEs on statutory compliance, payroll and people operations." />
      <Container>
        {!loaded ? (
          <div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-72" />)}</div>
        ) : error ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-muted-foreground">We could not load articles right now.</p>
            <button type="button" onClick={refetch} className="mt-4 text-sm text-[color:var(--ph-cyan)] underline" data-testid="button-blog-retry">Try again</button>
          </div>
        ) : !published.length ? (
          <div className="glass flex flex-col items-center rounded-3xl p-14 text-center">
            <Compass className="h-10 w-10 text-[color:var(--ph-cyan)]" />
            <h2 className="font-display mt-4 text-2xl font-bold">First articles are on the way</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Our team is writing guides on PF, ESI, PT and labour codes. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="mb-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block text-sm font-medium">Search articles
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics and titles" className="mt-2 w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]" type="search" />
              </label>
              <label className="block text-sm font-medium">Topic
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full min-w-48 rounded-xl border border-white/10 bg-background px-4 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]">
                  <option value="all">All topics</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            {!filtered.length ? <div className="glass rounded-3xl p-10 text-center"><h2 className="font-display text-xl font-bold">No articles match those filters</h2><p className="mt-2 text-sm text-muted-foreground">Try another topic or search phrase.</p></div> : <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((p, i) => (
              <Reveal as="article" key={str(p.id ?? p.slug)} delay={(i % 2) * 80}>
                <Link href={`/blog/${str(p.slug)}`} className="block h-full" data-testid={`link-post-${str(p.slug)}`}>
                  <GlassCard tilt={false} className="h-full">
                    <div className="relative aspect-[16/9] overflow-hidden bg-[radial-gradient(circle_at_30%_30%,var(--ph-indigo),transparent_60%),radial-gradient(circle_at_80%_70%,var(--ph-pink),transparent_55%)]">
                      {p.cover_image_url ? <img src={str(p.cover_image_url)} alt={str(p.cover_image_alt, str(p.title))} loading="lazy" width={1200} height={675} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">{arr<string>(p.tags).slice(0, 3).map((t) => <span key={t} className="rounded-full bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]">{t}</span>)}</div>
                      <h2 className="font-display mt-3 text-2xl font-bold leading-tight text-foreground">{str(p.title)}</h2>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{str(p.excerpt)}</p>
                      <div className="mt-5 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
                        {p.author ? <span>{str(p.author)}</span> : null}
                        {p.published_at ? <span>{fmtDate(p.published_at)}</span> : null}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </Reveal>
            ))}
            </div>}
          </>
        )}
      </Container>
      <CtaBand />
    </>
  );
}

export function fmtDate(v: unknown) {
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { posts, loaded } = usePublicPosts();
  const published = posts.filter((p) => !p.status || p.status === 'published');
  const post = published.find((p) => str(p.slug) === params.slug);
  const related = published.filter((p) => p !== post && arr<string>(p.tags).some((tag) => arr<string>(post?.tags).includes(tag))).slice(0, 3);
  if (!loaded) return <PageSkeleton />;
  if (!post) return <NotFoundPage />;
  return (
    <article>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: str(post.title) }]} title={str(post.title)} description={str(post.excerpt)}>
        <div className="mt-6 flex flex-wrap items-center gap-5 font-mono text-xs text-muted-foreground">
          {post.author ? <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{str(post.author)}</span> : null}
          {post.published_at ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(post.published_at)}</span> : null}
          {arr<string>(post.tags).map((t) => <span key={t} className="inline-flex items-center gap-1"><Tag className="h-3 w-3" />{t}</span>)}
        </div>
      </PageHero>
      <Container className="max-w-3xl">
        {post.cover_image_url ? <img src={str(post.cover_image_url)} alt={str(post.cover_image_alt, str(post.title))} width={1200} height={675} loading="lazy" className="mb-10 w-full rounded-3xl border border-white/10" /> : null}
        <Markdown source={str(post.body_md)} />
        <Link href="/blog" className="mt-12 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]" data-testid="link-back-blog"><ArrowLeft className="h-4 w-4" />All articles</Link>
      </Container>
      {related.length ? <Container className="mt-14"><h2 className="font-display text-2xl font-bold">Related reading</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{related.map((item) => <Link key={str(item.slug)} href={`/blog/${str(item.slug)}`} className="glass rounded-2xl p-5 transition hover:border-white/20"><span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]">{arr<string>(item.tags).slice(0, 2).join(' · ')}</span><h3 className="mt-3 font-semibold">{str(item.title)}</h3><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{str(item.excerpt)}</p></Link>)}</div></Container> : null}
      <CtaBand />
    </article>
  );
}

function CmsPageView({ page, crumbs }: { page: AnyObj; crumbs: { label: string; href?: string }[] }) {
  const c = (page.content ?? {}) as AnyObj;
  if (Array.isArray(c.sections)) {
    return (
      <>
        <PageHero crumbs={[...crumbs, { label: str(page.title) }]} title={str(page.title)} description={str(c.intro)} />
        <PageBlocks sections={c.sections} />
        {!c.sections.some((section: AnyObj) => section.type === 'cta') ? <CtaBand /> : null}
      </>
    );
  }
  return (
    <>
      <PageHero crumbs={[...crumbs, { label: str(page.title) }]} title={str(page.title)} description={str(c.intro)}>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink href="/register?mode=trial" testId="link-cms-trial">Start free trial <ArrowRight className="h-4 w-4" /></CtaLink>
          <CtaLink href="/pricing" variant="ghost" testId="link-cms-pricing">View pricing</CtaLink>
        </div>
      </PageHero>
      <Container className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={str(c.body)} /></div>
        {arr(c.benefits).length ? (
          <aside className="glass border-gradient h-fit rounded-3xl p-7">
            <h2 className="font-display text-xl font-bold">Key benefits</h2>
            <ul className="mt-5 space-y-3">
              {arr<unknown>(c.benefits).map((b, i) => <li key={i} className="flex gap-3 text-sm text-foreground/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />{typeof b === 'object' ? str((b as AnyObj).title ?? (b as AnyObj).text) : str(b)}</li>)}
            </ul>
          </aside>
        ) : null}
      </Container>
      {arr(c.faq).length ? <section className="py-20"><Container><h2 className="font-display mb-8 text-3xl font-bold">Questions</h2><FaqList items={arr<AnyObj>(c.faq)} idPrefix="cms-faq" /></Container></section> : null}
      <CtaBand />
    </>
  );
}

function matchPage(pages: AnyObj[], path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return pages.find((p) => {
    const s = str(p.slug).replace(/^\/+|\/+$/g, '');
    return (s === clean || `solutions/${s}` === clean) && (!p.status || p.status === 'published');
  });
}

export function SolutionPage() {
  const params = useParams<{ slug: string }>();
  const { pages, loaded } = usePublicPages();
  const page = matchPage(pages, `solutions/${params.slug}`);
  if (!loaded) return <PageSkeleton />;
  if (!page) return <NotFoundPage />;
  return <CmsPageView page={page} crumbs={[{ label: 'Home', href: '/' }, { label: 'Solutions' }]} />;
}

/** Catch-all: legal pages from content.legal, then CMS pages, otherwise 404. */
export function DynamicPage() {
  const [location] = useLocation();
  const slug=location.replace(/^\/+|\/+$/g,'');
  const legal = useSection('legal') as AnyObj;
  const content = useContent();
  const { pages, loaded } = usePublicPages();
  const l = legal[slug] as AnyObj | undefined;
  if (l) {
    return (
      <>
        <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: str(l.title) }]} eyebrow="Legal" title={str(l.title)} />
        <Container className="max-w-3xl">
          {slug === 'privacy-policy' || slug === 'terms' ? (
            <aside className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-5 text-sm leading-relaxed text-amber-100" role="note" data-testid={`notice-legal-draft-${slug}`}>
              <strong className="block font-mono text-xs uppercase tracking-wider">Draft for review · not legal advice</strong>
              <p className="mt-2">{str(l.reviewNotice, 'Complete all bracketed placeholders with verified details and have qualified counsel review this draft for the applicable jurisdiction before publication.')}</p>
            </aside>
          ) : null}
          <div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={str(l.body)} /></div>
        </Container>
      </>
    );
  }
  const page = matchPage(pages, slug);
  if (page) return <CmsPageView page={page} crumbs={[{ label: 'Home', href: '/' }]} />;
  if (!content || !loaded) return <PageSkeleton />;
  return <NotFoundPage />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full px-5 pt-40 sm:px-8" style={{ maxWidth: 'var(--ph-container-max, 72rem)' }} aria-busy>
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-6 h-16 w-3/4" />
      <SkeletonBlock className="mt-4 h-5 w-1/2" />
      <div className="mt-12 grid gap-4 md:grid-cols-2"><SkeletonBlock className="h-56" /><SkeletonBlock className="h-56" /></div>
    </div>
  );
}

export function NotFoundPage() {
  const suites = useSection('suites');
  return (
    <section className="relative flex min-h-[90dvh] items-center overflow-hidden pt-28">
      <Aurora />
      <Container className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--ph-pink)]">Error 404</p>
        <h1 className="font-display mt-4 text-[7rem] font-extrabold leading-none sm:text-[11rem]"><span className="text-gradient">404</span></h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">This page has left the organisation. No F&amp;F pending, we checked.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaLink href="/" testId="link-404-home">Back to home</CtaLink>
          <CtaLink href="/contact" variant="ghost" testId="link-404-contact">Report a broken link</CtaLink>
        </div>
        <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-2">
          {arr<AnyObj>(suites.items).slice(0, 6).map((s) => (
            <Link key={str(s.slug)} href={`/features/${str(s.slug)}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{str(s.title)}</Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
