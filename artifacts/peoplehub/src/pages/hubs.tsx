import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowRight, BookOpen, Building2, Check, ExternalLink, FileText, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { arr, str, useContent, usePublicPosts, useSection, type AnyObj } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { Container, PageHero, Reveal } from '@/components/site/primitives';
import { CtaBand } from '@/components/site/sections';
import { NotFoundPage, PageSkeleton } from './public';

const published = (item: AnyObj) => item.status === 'published';
const reviewed = (item: AnyObj) => published(item) && item.verified === true;
const localSlug = (value: unknown) => str(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const safeExternal = (value: unknown) => /^https?:\/\//i.test(str(value)) ? str(value) : '';

function SearchField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="relative mt-2 block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]" />
      </span>
    </label>
  );
}

function HubCard({ title, description, href, eyebrow, index }: { title: string; description: string; href: string; eyebrow?: string; index: number }) {
  return (
    <Reveal delay={(index % 3) * 55} className="h-full">
      <Link href={href} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]" data-testid={`link-hub-${localSlug(title)}`}>
        <span className="flex items-center justify-between gap-3">
          {eyebrow ? <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ph-cyan)]">{eyebrow}</span> : <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-brand text-on-brand"><ArrowRight className="h-4 w-4" /></span>}
          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
        </span>
        <h2 className="font-display mt-5 text-xl font-bold leading-snug text-foreground">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">Explore <ArrowRight className="h-4 w-4" /></span>
      </Link>
    </Reveal>
  );
}

function NoResults({ children }: { children: string }) {
  return <div className="glass rounded-2xl p-8 text-center"><p className="text-muted-foreground">{children}</p></div>;
}

function DetailShell({ crumbs, eyebrow, title, description, children }: { crumbs: { label: string; href?: string }[]; eyebrow?: string; title: string; description?: string; children: ReactNode }) {
  return <><PageHero crumbs={[{ label: 'Home', href: '/' }, ...crumbs, { label: title }]} eyebrow={eyebrow} title={title} description={description} /><Container className="max-w-4xl">{children}</Container><CtaBand /></>;
}

function SuiteLinks({ titles }: { titles: unknown }) {
  const suites = arr<AnyObj>(useSection('suites').items);
  const matches = arr<string>(titles).map((title) => suites.find((item) => {
    const suiteTitle = str(item.title).toLowerCase();
    const focusTitle = title.toLowerCase();
    return suiteTitle === focusTitle || suiteTitle.includes(focusTitle) || focusTitle.includes(suiteTitle);
  })).filter(Boolean) as AnyObj[];
  if (!matches.length) return null;
  return <div className="mt-7 flex flex-wrap gap-2">{matches.map((suite) => <Link key={str(suite.key)} href={`/features/${str(suite.slug)}`} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-foreground/85 transition hover:border-white/25">{str(suite.title)}</Link>)}</div>;
}

export function IndustriesPage() {
  const section = useSection('industryHub');
  const content = useContent();
  const [query, setQuery] = useState('');
  const items = arr<AnyObj>(section.items).filter((item) => `${str(item.title)} ${str(item.description)} ${arr<string>(item.focus).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Industries' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Industries')} description={str(section.description)} />
    <Container>
      <div className="mb-7 max-w-xl"><SearchField label={str(section.searchLabel, 'Search industries')} placeholder={str(section.searchPlaceholder)} value={query} onChange={setQuery} /></div>
      {items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <HubCard key={str(item.slug)} title={str(item.title)} description={str(item.description)} eyebrow={arr<string>(item.focus).slice(0, 2).join(' · ')} href={`/industries/${str(item.slug)}`} index={index} />)}</div> : <NoResults>{str(section.emptyMessage, 'No industries match your search.')}</NoResults>}
    </Container>
    <CtaBand />
  </>;
}

export function IndustryDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const section = useSection('industryHub');
  const content = useContent();
  const item = arr<AnyObj>(section.items).find((entry) => str(entry.slug) === slug);
  if (!content) return <PageSkeleton />;
  if (!item) return <NotFoundPage />;
  return <DetailShell crumbs={[{ label: 'Industries', href: '/industries' }]} eyebrow="Industry solution" title={str(item.title)} description={str(item.description)}>
    <div className="glass rounded-3xl p-7 sm:p-9">
      <h2 className="font-display text-2xl font-bold">{str(section.detailTitle, 'People workflows to consider')}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{str(section.detailDescription)}</p>
      <ul className="mt-5 space-y-3">{arr<string>(section.detailGuidance).map((guidance, index) => <li key={index} className="flex gap-3 text-foreground/90"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />{guidance}</li>)}</ul>
      <SuiteLinks titles={item.focus} />
    </div>
    <Link href="/request-demo" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ph-cyan)]">Discuss this industry <ArrowRight className="h-4 w-4" /></Link>
  </DetailShell>;
}

export function SegmentsPage() {
  const section = useSection('segments');
  const content = useContent();
  const [group, setGroup] = useState<'size' | 'role'>('size');
  const [query, setQuery] = useState('');
  const items = arr<AnyObj>(section.items).filter((item) => item.group === group && `${str(item.title)} ${str(item.description)} ${arr<string>(item.needs).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Solutions' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Solutions by team')} description={str(section.description)} />
    <Container>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Choose a solution category">
        <button type="button" aria-pressed={group === 'size'} onClick={() => setGroup('size')} className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)] ${group === 'size' ? 'border-white/30 bg-white/[0.08] text-foreground' : 'border-white/10 text-muted-foreground'}`}>{str(section.sizeLabel, 'Company size')}</button>
        <button type="button" aria-pressed={group === 'role'} onClick={() => setGroup('role')} className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)] ${group === 'role' ? 'border-white/30 bg-white/[0.08] text-foreground' : 'border-white/10 text-muted-foreground'}`}>{str(section.roleLabel, 'Your role')}</button>
      </div>
      <div className="mb-7 max-w-xl"><SearchField label={str(section.searchLabel, 'Find a solution')} placeholder={str(section.searchPlaceholder)} value={query} onChange={setQuery} /></div>
      {items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <HubCard key={str(item.slug)} title={str(item.title)} description={str(item.description)} eyebrow={group === 'size' ? 'By company size' : 'By role'} href={`/solutions/${str(item.slug)}`} index={index} />)}</div> : <NoResults>{str(section.emptyMessage, 'No solutions match your search.')}</NoResults>}
    </Container>
    <CtaBand />
  </>;
}

export function SegmentDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const section = useSection('segments');
  const content = useContent();
  const item = arr<AnyObj>(section.items).find((entry) => str(entry.slug) === slug);
  if (!content) return <PageSkeleton />;
  if (!item) return <NotFoundPage />;
  return <DetailShell crumbs={[{ label: 'Solutions', href: '/solutions' }]} eyebrow={item.group === 'role' ? 'By role' : 'By company size'} title={str(item.title)} description={str(item.description)}>
    <div className="glass rounded-3xl p-7 sm:p-9">
      <h2 className="font-display text-2xl font-bold">Priorities to map with your team</h2>
      <ul className="mt-5 space-y-3">{arr<string>(item.needs).map((need, index) => <li key={index} className="flex gap-3 text-foreground/90"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />{need}</li>)}</ul>
      <h3 className="mt-8 font-semibold">Relevant suites</h3>
      <SuiteLinks titles={item.focus} />
    </div>
    <Link href="/request-demo" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ph-cyan)]">Talk through your needs <ArrowRight className="h-4 w-4" /></Link>
  </DetailShell>;
}

export function AiHubPage() {
  const section = useSection('aiHub');
  const content = useContent();
  const items = arr<AnyObj>(section.items);
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'AI' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'AI and people operations')} description={str(section.description)} />
    <Container>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-muted-foreground"><span className="mr-2 inline-flex align-middle text-[color:var(--ph-cyan)]"><Sparkles className="h-4 w-4" /></span>{str(section.disclosure)}</div>
      {items.length ? <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <Reveal key={index} delay={(index % 3) * 55} className="glass rounded-2xl p-6"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]"><Sparkles className="h-3.5 w-3.5" />{str(section.plannedLabel, 'Planned concept')}</span><h2 className="font-display mt-5 text-xl font-bold">{str(item.title)}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(item.description)}</p></Reveal>)}</div> : null}
    </Container>
    <CtaBand />
  </>;
}

export function ResourcesPage() {
  const section = useSection('resourcesHub');
  const { posts, loaded } = usePublicPosts();
  const content = useContent();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const custom:AnyObj[] = arr<AnyObj>(section.items).filter(published).map((item) => ({ ...item, href: `/resources/${str(item.slug)}`, kind: str(item.type, 'Resource') }));
  const articles:AnyObj[] = posts.filter(published).map((post) => ({ ...post, href: `/blog/${str(post.slug)}`, kind: 'Article', description: str(post.excerpt) }));
  const allItems:AnyObj[] = [...articles, ...custom];
  const categories = Array.from(new Set(allItems.map((item) => str(item.kind)))).sort();
  const items = allItems.filter((item) => `${str(item.title)} ${str(item.description)} ${str(item.kind)} ${arr<string>(item.tags).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => category === 'all' || str(item.kind) === category);
  if (!content || !loaded) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Resources' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Resources for people teams')} description={str(section.description)} />
    <Container>
      <div className="mb-7 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <SearchField label={str(section.searchLabel, 'Search resources')} placeholder={str(section.searchPlaceholder)} value={query} onChange={setQuery} />
        <label className="block text-sm font-medium">{str(section.categoryLabel, 'Resource type')}
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full min-w-44 rounded-xl border border-white/10 bg-background px-4 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]"><option value="all">{str(section.allLabel, 'All resources')}</option>{categories.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select>
        </label>
      </div>
      {items.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <HubCard key={`${item.href}-${index}`} title={str(item.title)} description={str(item.description)} eyebrow={str(item.kind)} href={str(item.href)} index={index} />)}</div> : <NoResults>{str(section.emptyMessage, 'Resources will appear here as they are published.')}</NoResults>}
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/blog" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:border-white/25"><BookOpen className="h-4 w-4" />Browse all articles</Link><Link href="/case-studies" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:border-white/25"><Building2 className="h-4 w-4" />Explore use cases</Link></div>
    </Container>
  </>;
}

export function ResourceDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const section = useSection('resourcesHub');
  const content = useContent();
  const item = arr<AnyObj>(section.items).find((entry) => str(entry.slug) === slug && published(entry));
  if (!content) return <PageSkeleton />;
  if (!item) return <NotFoundPage />;
  return <DetailShell crumbs={[{ label: 'Resources', href: '/resources' }]} eyebrow={str(item.type, 'Resource')} title={str(item.title)} description={str(item.description)}>
    {str(item.imageUrl) ? <img src={str(item.imageUrl)} alt={str(item.imageAlt, str(item.title))} width={1200} height={675} className="mb-8 w-full rounded-2xl border border-white/10 object-cover" /> : null}
    <div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={str(item.body)} /></div>
    {safeExternal(item.sourceUrl) ? <a href={safeExternal(item.sourceUrl)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]">Open source <ExternalLink className="h-4 w-4" /></a> : null}
    <Link href="/resources" className="mt-8 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]">All resources <ArrowRight className="h-4 w-4" /></Link>
  </DetailShell>;
}

export function IntegrationsPage() {
  const section = useSection('integrationMarketplace');
  const content = useContent();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const items = arr<AnyObj>(section.items).filter(reviewed).filter((item) => `${str(item.title)} ${str(item.description)} ${str(item.category)}`.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => category === 'all' || str(item.category) === category);
  const categories = Array.from(new Set([...arr<string>(section.categories), ...items.map((item) => str(item.category)).filter(Boolean)])).sort();
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Integrations' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Integrations')} description={str(section.description)} />
    <Container>
      <div className="mb-7 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <SearchField label={str(section.searchLabel, 'Search integrations')} placeholder={str(section.searchPlaceholder)} value={query} onChange={setQuery} />
        <label className="block text-sm font-medium">{str(section.categoryLabel, 'Category')}
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full min-w-44 rounded-xl border border-white/10 bg-background px-4 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]"><option value="all">{str(section.allCategoryLabel, 'All categories')}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </label>
      </div>
      {items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <Reveal key={str(item.slug, String(index))} delay={(index % 3) * 55} className="glass rounded-2xl p-6">{str(item.logoUrl) ? <img src={str(item.logoUrl)} alt={str(item.logoAlt, str(item.title))} className="mb-5 h-12 max-w-40 object-contain" /> : <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10"><FileText className="h-5 w-5 text-[color:var(--ph-cyan)]" /></span>}<p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]">{str(item.category)}</p><h2 className="font-display mt-2 text-xl font-bold">{str(item.title)}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(item.description)}</p>{safeExternal(item.url) ? <a className="mt-5 inline-flex items-center gap-2 text-sm text-foreground" href={safeExternal(item.url)} target="_blank" rel="noopener noreferrer">Learn more <ExternalLink className="h-4 w-4" /></a> : null}</Reveal>)}</div> : <NoResults>{str(section.emptyMessage, 'Integration details will appear here when they are ready to share.')}</NoResults>}
      <div className="mt-8 rounded-2xl border border-white/10 p-5"><p className="text-sm text-muted-foreground">Looking for a specific system?</p><Link href="/request-demo" className="mt-2 inline-flex items-center gap-2 font-semibold text-[color:var(--ph-cyan)]">{str(section.requestLabel, 'Ask about an integration')} <ArrowRight className="h-4 w-4" /></Link></div>
    </Container>
    <CtaBand />
  </>;
}

export function CompliancePage() {
  const section = useSection('complianceHub');
  const content = useContent();
  const [query, setQuery] = useState('');
  const references = arr<AnyObj>(section.references).filter(reviewed).filter((item) => `${str(item.location)} ${str(item.topic)} ${str(item.title)} ${str(item.summary)}`.toLowerCase().includes(query.toLowerCase()));
  const topics = arr<AnyObj>(section.topics);
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Compliance references' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Compliance references')} description={str(section.description)} />
    <Container>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-muted-foreground"><ShieldCheck className="mr-2 inline h-4 w-4 text-[color:var(--ph-cyan)]" />{str(section.notice)}</div>
      <h2 className="font-display mt-10 text-2xl font-bold">Topics to review</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic, index) => <Reveal key={index} delay={(index % 3) * 50} className="glass rounded-2xl p-6"><h3 className="font-semibold">{str(topic.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(topic.description)}</p></Reveal>)}</div>
      <div className="mt-12 max-w-xl"><h2 className="font-display mb-4 text-2xl font-bold">Published references</h2><SearchField label={str(section.searchLabel, 'Search references')} placeholder={str(section.searchPlaceholder)} value={query} onChange={setQuery} /></div>
      {references.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{references.map((ref, index) => <article key={index} className="glass rounded-2xl p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]">{str(ref.location)}{ref.topic ? ` · ${str(ref.topic)}` : ''}</p><h3 className="font-display mt-3 text-xl font-bold">{str(ref.title, str(ref.topic))}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(ref.summary)}</p>{ref.lastReviewed ? <p className="mt-4 text-xs text-muted-foreground">Reviewed {str(ref.lastReviewed)}</p> : null}{safeExternal(ref.sourceUrl) ? <a href={safeExternal(ref.sourceUrl)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]">{str(ref.sourceTitle, 'Open source')} <ExternalLink className="h-4 w-4" /></a> : null}</article>)}</div> : <div className="mt-5"><NoResults>{str(section.emptyMessage, 'Published references will appear here when available.')}</NoResults></div>}
    </Container>
    <CtaBand />
  </>;
}

export function CustomerStoriesPage() {
  const section = useSection('customerStories');
  const content = useContent();
  const items = arr<AnyObj>(section.items).filter(reviewed).filter((item) => str(item.title) && str(item.slug));
  if (!content) return <PageSkeleton />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Customer stories' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Customer stories')} description={str(section.description)} />
    <Container>
      {items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((item, index) => <HubCard key={str(item.slug)} title={str(item.title)} description={str(item.summary)} eyebrow={[str(item.industry), str(item.companySize)].filter(Boolean).join(' · ')} href={`/customer-stories/${str(item.slug)}`} index={index} />)}</div> : <NoResults>{str(section.emptyMessage, 'Customer stories will appear here when they are ready to publish.')}</NoResults>}
    </Container>
    <CtaBand />
  </>;
}

export function CustomerStoryDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const section = useSection('customerStories');
  const content = useContent();
  const item = arr<AnyObj>(section.items).find((entry) => str(entry.slug) === slug && reviewed(entry));
  if (!content) return <PageSkeleton />;
  if (!item) return <NotFoundPage />;
  return <DetailShell crumbs={[{ label: 'Customer stories', href: '/customer-stories' }]} eyebrow={[str(item.industry), str(item.companySize)].filter(Boolean).join(' · ')} title={str(item.title)} description={str(item.summary)}>
    {str(item.imageUrl) ? <img src={str(item.imageUrl)} alt={str(item.imageAlt, str(item.title))} width={1200} height={675} className="mb-8 w-full rounded-2xl border border-white/10 object-cover" /> : null}
    <div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={str(item.body)} /></div>
    <Link href="/customer-stories" className="mt-8 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]">All customer stories <ArrowRight className="h-4 w-4" /></Link>
  </DetailShell>;
}
