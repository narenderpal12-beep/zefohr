import { useEffect, useId, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  ChartNoAxesCombined, CircleHelp, Clock3, GraduationCap, HeartHandshake, IndianRupee, Layers3,
  Pause, Play, ShieldCheck, Sparkles, UsersRound,
} from 'lucide-react';
import { arr, str, type AnyObj } from '@/lib/content';

export type CreativeHomeData = {
  page: AnyObj;
  brand: AnyObj;
  suites: AnyObj[];
  services: AnyObj[];
  faq: AnyObj[];
  clientsSection: AnyObj;
  posts: AnyObj[];
  complianceNote: string;
};

function safeHref(value: unknown, fallback = '/contact') {
  const href = str(value).trim();
  return /^(?:\/(?!\/)|#|\?|https?:\/\/|mailto:|tel:)/i.test(href) ? href : fallback;
}

function SiteLink({ href, children, className, ariaLabel }: { href: unknown; children: ReactNode; className?: string; ariaLabel?: string }) {
  const target = safeHref(href);
  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    return <a href={target} className={className} aria-label={ariaLabel} {...(/^https?:/i.test(target) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  }
  if (target.startsWith('#')) return <a href={target} className={className} aria-label={ariaLabel}>{children}</a>;
  return <Link href={target} className={className} aria-label={ariaLabel}>{children}</Link>;
}

function Heading({ eyebrow, title, description, split = false }: { eyebrow?: unknown; title?: unknown; description?: unknown; split?: boolean }) {
  return (
    <header className={`phv3-section-head${split ? ' phv3-section-head--split' : ''}`}>
      {eyebrow ? <p className="phv3-kicker">{str(eyebrow)}</p> : null}
      {title ? <h2 className="phv3-heading">{str(title)}</h2> : null}
      {description ? <p className="phv3-copy">{str(description)}</p> : null}
    </header>
  );
}

function arrowLink(label: unknown, href: unknown, className = 'phv3-arrow-link') {
  return <SiteLink href={href} className={className}>{str(label)} <ArrowRight aria-hidden="true" /></SiteLink>;
}

function selectKey(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, onSelect: (n: number) => void, prefix: string) {
  let next: number | null = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + count) % count;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = count - 1;
  if (next === null) return;
  event.preventDefault();
  onSelect(next);
  requestAnimationFrame(() => document.getElementById(`${prefix}${next}`)?.focus());
}

const icons = [UsersRound, BriefcaseBusiness, CalendarDays, GraduationCap];

const conceptSlides = [
  {
    key: 'payroll', title: 'Salary & Payroll', shortTitle: 'Salary', section: 'Payroll overview', period: 'Illustrative · Monthly pay cycle',
    metrics: [{ label: 'Illustrative payroll', value: '₹18.6L', note: 'monthly concept' }, { label: 'Team members', value: '48', note: 'illustrative roster' }, { label: 'Pay cycle', value: 'Monthly', note: 'concept cadence' }],
    rows: [{ name: 'Base salary', value: '₹14,20,000' }, { name: 'Allowances', value: '₹3,18,400' }, { name: 'Estimated deductions', value: '₹1,24,600' }],
    chartLabel: 'A sample pay summary, for illustration only', step: 'Review structure', stepNote: 'Concept screen · no payroll is processed',
  },
  {
    key: 'attendance', title: 'Attendance & Time', shortTitle: 'Attendance', section: 'Time overview', period: 'Illustrative · Weekly team view',
    metrics: [{ label: 'Illustrative present', value: '42 / 48', note: 'concept day view' }, { label: 'Planned shifts', value: '36', note: 'illustrative roster' }, { label: 'Leave requests', value: '04', note: 'concept queue' }],
    rows: [{ name: 'Studio · morning', value: '08:30 — 17:30' }, { name: 'Support · day', value: '09:00 — 18:00' }, { name: 'Operations · evening', value: '13:00 — 22:00' }],
    chartLabel: 'Illustrative team coverage across the week', step: 'Weekly rhythm', stepNote: 'Concept screen · no attendance is recorded',
  },
  {
    key: 'performance', title: 'Employee Performance', shortTitle: 'Performance', section: 'Growth & performance', period: 'Illustrative · Quarterly growth cycle',
    metrics: [{ label: 'Illustrative check-ins', value: '31 / 48', note: 'concept progress' }, { label: 'Growth goals', value: '76%', note: 'illustrative alignment' }, { label: 'Review cycle', value: 'Quarterly', note: 'concept cadence' }],
    rows: [{ name: 'Customer focus', value: 'On track' }, { name: 'Team craft', value: 'In progress' }, { name: 'Learning goals', value: 'On track' }],
    chartLabel: 'An illustrative view of team growth goals', step: 'Growth conversations', stepNote: 'Concept screen · no reviews are stored',
  },
];

function ConceptSnapshot({ slide, brandName, labels }: { slide: AnyObj; brandName: string; labels: AnyObj }) {
  const isPayroll = slide.key === 'payroll';
  const isAttendance = slide.key === 'attendance';
  const Icon = isPayroll ? IndianRupee : isAttendance ? Clock3 : ChartNoAxesCombined;
  const bars = isPayroll ? [40, 53, 46, 67, 60, 82, 73] : isAttendance ? [62, 77, 68, 88, 72, 57, 80] : [45, 59, 52, 74, 65, 86, 78];
  return (
    <div className={`phv3-product-window phv3-product-window--${str(slide.key)}`} role="group" aria-label={`${str(slide.title)} illustrative interface preview`}>
      <div className="phv3-window-top">
        <span className="phv3-window-brand"><span className="phv3-window-mark"><UsersRound aria-hidden="true" /></span>{brandName}</span>
        <span className="phv3-window-tag">{str(labels.conceptLabel, 'Illustrative concept')}</span>
      </div>
      <div className="phv3-window-content">
        <aside className="phv3-window-rail" aria-hidden="true">
          <p className="phv3-window-rail-label">{str(labels.moduleLabel, 'Planned areas')}</p>
          {[['People', UsersRound], ['Pay & time', IndianRupee], ['Growth', ChartNoAxesCombined]].map(([item, RailIcon], index) => {
            const Glyph = RailIcon as typeof UsersRound;
            return <span className={`phv3-rail-item${index === (isPayroll ? 1 : isAttendance ? 1 : 2) ? ' is-active' : ''}`} key={String(item)}><Glyph />{String(item)}</span>;
          })}
          <span className="phv3-rail-item"><CircleHelp />{str(labels.supportLabel, 'Overview')}</span>
        </aside>
        <div className="phv3-window-main">
          <div className="phv3-snapshot-heading">
            <span className="phv3-window-overline">{str(slide.period)}</span>
            <span className="phv3-snapshot-icon"><Icon aria-hidden="true" /></span>
          </div>
          <h3 className="phv3-window-title">{str(slide.section, str(slide.title, str(labels.snapshotTitle)))}</h3>
          <p className="phv3-window-sub">{str(labels.suitePreviewDescription, 'A visual concept for a growing team')}</p>
          <div className="phv3-preview-grid">
            {arr<AnyObj>(slide.metrics).slice(0, 3).map((metric, index) => (
              <div className="phv3-preview-stat" key={`${str(metric.label)}-${index}`}><span>{str(metric.label)}</span><strong>{str(metric.value)}</strong><small>{str(metric.note)}</small></div>
            ))}
          </div>
          <div className="phv3-snapshot-lower">
            <div className="phv3-chart-card">
              <div className="phv3-chart-caption"><span>{str(slide.chartLabel)}</span><span>Sample view</span></div>
              <div className="phv3-chart" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
              <div className="phv3-chart-days" aria-hidden="true">{(isAttendance ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']).map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
            </div>
            <div className="phv3-snapshot-list">
              <div className="phv3-list-heading"><strong>{str(slide.step)}</strong><span>Concept</span></div>
              {arr<AnyObj>(slide.rows).slice(0, 3).map((row, index) => <div className="phv3-list-row" key={`${str(row.name)}-${index}`}><span className="phv3-list-marker" /> <span>{str(row.name)}</span><strong>{str(row.value)}</strong></div>)}
              <p>{str(slide.stepNote)}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="phv3-disclosure"><ShieldCheck aria-hidden="true" />{str(labels.disclosure, 'Illustrative product concept only. No real people data or transactions.')}</p>
    </div>
  );
}

function ProductConcept({ brandName, labels }: { suite?: AnyObj; brandName: string; labels: AnyObj }) {
  const slides = arr<AnyObj>(labels.carouselSlides).length ? arr<AnyObj>(labels.carouselSlides) : conceptSlides;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const id = useId();
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => {
    if (paused || userPaused || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6200);
    return () => window.clearInterval(timer);
  }, [active, paused, userPaused, reducedMotion, slides.length]);
  const slide = slides[active] ?? slides[0] ?? conceptSlides[0];
  return (
    <div className="phv3-carousel" role="region" aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
    }} aria-label={str(labels.carouselLabel, 'Illustrative HRMS concept screens')}>
      <div className="phv3-carousel-stage" aria-live="off" aria-atomic="true">
        <div className="phv3-carousel-slide" key={`${id}-${active}`}>
          <ConceptSnapshot slide={slide} brandName={brandName} labels={labels} />
        </div>
      </div>
      <div className="phv3-carousel-controls">
        <p>{str(labels.carouselHint, 'A visual direction for planned HRMS suites')}</p>
        <div className="phv3-carousel-tabs" role="group" aria-label={str(labels.carouselLabel, 'Choose an illustrative screen')}>
            {slides.map((item, index) => <button key={`${str(item.key)}-${index}`} type="button" aria-pressed={active === index} aria-label={`${str(labels.showSlideLabel, 'Show concept')}: ${str(item.title)}`} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span>{str(item.shortTitle, str(item.title))}</button>)}
          {!reducedMotion ? (
            <button
              className="phv3-carousel-pause"
              type="button"
              aria-pressed={userPaused}
              aria-label={str(userPaused ? labels.playSlidesLabel : labels.pauseSlidesLabel, userPaused ? 'Resume automatic slides' : 'Pause automatic slides')}
              title={str(userPaused ? labels.playSlidesLabel : labels.pauseSlidesLabel, userPaused ? 'Resume automatic slides' : 'Pause automatic slides')}
              onClick={() => { setPaused(false); setUserPaused((current) => !current); }}
            >
              {userPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ data }: { data: CreativeHomeData }) {
  const copy = data.page.hero ?? {};
  const brandName = str(data.brand.name, str(data.page.ui?.brandFallback));
  const headline = str(copy.title);
  const highlight = str(copy.highlight);
  const headlineParts = highlight && headline.includes(highlight) ? headline.split(highlight) : null;
  return (
    <section className="home-creative phv3 phv3-hero" id="top">
      <div className="phv3-shell phv3-hero-grid">
        <div className="phv3-hero-copy phv3-load">
          <span className="phv3-orbit" aria-hidden="true" />
          <p className="phv3-kicker">{str(copy.eyebrow)}</p>
          <h1>{headlineParts ? <>{headlineParts[0]}<span>{highlight}</span>{headlineParts.slice(1).join(highlight)}</> : <>{headline} {highlight ? <span>{highlight}</span> : null}</>}</h1>
          <p>{str(copy.description)}</p>
          <div className="phv3-hero-actions">
            <SiteLink href={copy.primaryHref} className="phv3-cta">{str(copy.primaryLabel)} <ArrowRight aria-hidden="true" /></SiteLink>
            <SiteLink href={copy.secondaryHref} className="phv3-cta phv3-cta--quiet">{str(copy.secondaryLabel)}</SiteLink>
          </div>
          <p className="phv3-hero-note"><Check aria-hidden="true" />{str(copy.currentNote)}</p>
        </div>
        <div className="phv3-visual-wrap phv3-load">
          <ProductConcept brandName={brandName} labels={{ ...data.page.ui, ...copy }} />
          {copy.sideNote ? <div className="phv3-float-note"><Sparkles aria-hidden="true" />{str(copy.sideNote)}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ClientStripSection({ data }: { data: CreativeHomeData }) {
  const section = data.clientsSection;
  const clients = arr<AnyObj>(section.items).filter((item) => item && item.visible !== false && str(item.name) && str(item.logoUrl));
  if (section.enabled === false || !clients.length) return null;
  return (
    <section className="home-creative phv3 phv3-clients" aria-label={str(section.title, str(section.ariaLabel))}>
      <div className="phv3-shell">
        {section.title ? <h2>{str(section.title)}</h2> : null}
        <div className="phv3-client-logos">
          {clients.slice(0, 8).map((client, index) => {
            const image = <img src={str(client.logoUrl)} alt={str(client.logoAlt, str(client.name))} loading="lazy" />;
            const website = /^https?:\/\//i.test(str(client.website)) ? str(client.website) : '';
            return website
              ? <a href={website} key={`${str(client.name)}-${index}`} target="_blank" rel="noopener noreferrer" aria-label={str(client.name)}>{image}</a>
              : <span key={`${str(client.name)}-${index}`}>{image}</span>;
          })}
        </div>
      </div>
    </section>
  );
}

export function RoleSection({ data }: { data: CreativeHomeData }) {
  const headingId = useId();
  const copy = data.page.roles ?? {};
  const items = arr<AnyObj>(copy.items);
  const [active, setActive] = useState(0);
  const role = items[active] ?? items[0];
  if (!items.length) return null;
  return (
    <section className="home-creative phv3 phv3-section phv3-roles" aria-labelledby={headingId}>
      <div className="phv3-shell phv3-role-layout">
        <div>
          <p className="phv3-kicker">{str(copy.eyebrow)}</p>
          <h2 className="phv3-heading" id={headingId}>{str(copy.title)}</h2>
          <p className="phv3-copy">{str(copy.description)}</p>
          <div className="phv3-role-options" role="group" aria-label={str(copy.selectorLabel)}>
            {items.map((item, index) => <button key={`${str(item.name)}-${index}`} type="button" className="phv3-role-option" aria-pressed={active === index} onClick={() => setActive(index)}>{str(item.name)}</button>)}
          </div>
        </div>
        {role ? <div className="phv3-role-panel" aria-live="polite">
          <p className="phv3-kicker">{str(role.name)}</p>
          <h3>{str(role.description)}</h3>
          <p>{str(copy.linkLabel)}</p>
          <div className="phv3-role-links">
            {arr<string>(role.suiteKeys).map((key) => {
              const suite = data.suites.find((item) => str(item.key) === key);
              return suite?.slug ? <SiteLink key={key} href={`/features/${str(suite.slug)}`} className="phv3-chip-link">{str(suite.title)} <ArrowUpRight aria-hidden="true" /></SiteLink> : null;
            })}
          </div>
        </div> : null}
      </div>
    </section>
  );
}

export function SuitesSection({ data }: { data: CreativeHomeData }) {
  const instanceId = useId();
  const copy = data.page.suites ?? {};
  const [active, setActive] = useState(0);
  const suite = data.suites[active] ?? data.suites[0];
  const idPrefix = `${instanceId}-suite-tab-`;
  const panelId = `${instanceId}-suite-panel`;
  return (
    <section className="home-creative phv3 phv3-section" id="suites">
      <div className="phv3-shell">
        <Heading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
        <div className="phv3-suite-grid">
          {data.suites.length ? <>
            <div className="phv3-suite-list" role="tablist" aria-label={str(copy.tabsLabel)}>
              {data.suites.map((item, index) => (
                <button type="button" className="phv3-suite-tab" id={`${idPrefix}${index}`} key={str(item.key, String(index))} role="tab" aria-selected={active === index} aria-controls={panelId} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => selectKey(event, index, data.suites.length, setActive, idPrefix)}>
                  <span className="phv3-suite-index">{String(index + 1).padStart(2, '0')}</span>
                  <span><strong>{str(item.title)}</strong><small>{str(item.description)}</small></span><ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
            {suite ? <div className="phv3-suite-detail" id={panelId} role="tabpanel" aria-labelledby={`${idPrefix}${active}`}>
              <div>
                <div className="phv3-suite-detail-top"><span className="phv3-planned-tag">{str(copy.plannedLabel)}</span><Layers3 aria-hidden="true" /></div>
                <h3>{str(suite.title)}</h3>
                <p>{str(suite.body, str(suite.description))}</p>
                <ul className="phv3-module-pills" aria-label={str(copy.moduleListLabel, str(suite.title))}>{arr<string>(suite.modules).slice(0, 8).map((module) => <li key={module}>{module}</li>)}</ul>
              </div>
              {suite.slug ? arrowLink(copy.exploreLabel, `/features/${str(suite.slug)}`) : null}
              <p className="phv3-disclosure"><ShieldCheck aria-hidden="true" />{str(copy.disclaimer)}</p>
            </div> : null}
          </> : <p className="phv3-empty">{str(copy.emptyMessage)}</p>}
        </div>
      </div>
    </section>
  );
}

export function JourneySection({ data }: { data: CreativeHomeData }) {
  const instanceId = useId();
  const copy = data.page.journey ?? {};
  const items = arr<AnyObj>(copy.items);
  const [active, setActive] = useState(0);
  const item = items[active] ?? items[0];
  const prefix = `${instanceId}-phase-tab-`;
  const panelId = `${instanceId}-phase-panel`;
  if (!items.length) return null;
  return (
    <section className="home-creative phv3 phv3-section phv3-lifecycle" id="journey">
      <div className="phv3-shell">
        <Heading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
        <div className="phv3-lifecycle-grid">
          <div className="phv3-phase-list" role="tablist" aria-label={str(copy.selectorLabel)}>
            {items.map((phase, index) => <button type="button" className="phv3-phase-button" id={`${prefix}${index}`} key={`${str(phase.title)}-${index}`} role="tab" aria-selected={active === index} aria-controls={panelId} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => selectKey(event, index, items.length, setActive, prefix)}>
              <span className="phv3-phase-number">{String(index + 1).padStart(2, '0')}</span><strong>{str(phase.title)}</strong><ChevronRight aria-hidden="true" />
            </button>)}
          </div>
          {item ? <div className="phv3-phase-panel" id={panelId} role="tabpanel" aria-labelledby={`${prefix}${active}`}>
            <span className="phv3-phase-glyph"><HeartHandshake aria-hidden="true" /></span>
            <p className="phv3-kicker">{str(copy.plannedLabel)}</p>
            <h3>{str(item.title)}</h3><p>{str(item.description)}</p>
            {(() => {
              const suite = data.suites.find((candidate) => str(candidate.key) === str(item.suiteKey));
              return suite?.slug ? arrowLink(`${str(copy.linkPrefix, str(copy.exploreLabel, ''))} ${str(suite.title)}`, `/features/${str(suite.slug)}`) : null;
            })()}
            <p className="phv3-disclosure"><ShieldCheck aria-hidden="true" />{str(copy.disclosure)}</p>
          </div> : null}
        </div>
      </div>
    </section>
  );
}

export function ServicesSection({ data }: { data: CreativeHomeData }) {
  const copy = data.page.services ?? {};
  const services = data.services.filter((item) => item && item.visible !== false && str(item.title));
  return (
    <section className="home-creative phv3 phv3-section" id="services">
      <div className="phv3-shell">
        <Heading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} split />
        <div className="phv3-service-grid">
          {services.length ? services.slice(0, 6).map((service, index) => {
            const Icon = icons[index % icons.length];
            return <SiteLink key={str(service.slug, String(index))} href={`/services/${str(service.slug)}`} className="phv3-service-card">
              <span><Icon aria-hidden="true" /></span><h3>{str(service.title)}</h3><p>{str(service.description)}</p><ArrowUpRight aria-hidden="true" />
            </SiteLink>;
          }) : <p className="phv3-empty">{str(copy.emptyMessage)}</p>}
        </div>
        <div className="phv3-service-foot">
          {copy.contextNote ? <p className="phv3-service-note"><HeartHandshake aria-hidden="true" /> {str(copy.contextNote)}</p> : null}
          {arrowLink(copy.allLabel, copy.allHref ?? '/services')}
        </div>
      </div>
    </section>
  );
}

export function LearningSection({ data }: { data: CreativeHomeData }) {
  const copy = data.page.learning ?? {};
  const posts = data.posts.filter((post) => !post.status || post.status === 'published').slice(0, 3);
  return (
    <section className="home-creative phv3 phv3-section phv3-learning" id="learning">
      <div className="phv3-shell">
        <Heading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
        <div className="phv3-learning-grid">
          {posts.length ? posts.map((post, index) => {
            const slug = str(post.slug);
            const href = slug ? `/blog/${slug}` : '/blog';
            const title = str(post.title, str(copy.articleFallbackLabel));
            const excerpt = str(post.excerpt, str(post.description));
            return <article className="phv3-article" key={str(post.id, slug || String(index))}>
              <span className="phv3-article-meta">{str(post.category, str(copy.articleLabel))}</span><h3>{title}</h3>{excerpt ? <p>{excerpt}</p> : null}
              {arrowLink(copy.readLabel, href)}
            </article>;
          }) : <p className="phv3-empty">{str(copy.emptyMessage)}</p>}
        </div>
        <div className="phv3-resource-tools" aria-label={str(copy.resourcesLabel)}>
          {arr<AnyObj>(copy.tools).map((tool, index) => <SiteLink key={`${str(tool.title)}-${index}`} href={tool.href}><BookOpen aria-hidden="true" />{str(tool.title)}</SiteLink>)}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ data }: { data: CreativeHomeData }) {
  const instanceId = useId();
  const copy = data.page.faq ?? {};
  const items = data.faq;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="home-creative phv3 phv3-section" id="faq">
      <div className="phv3-shell phv3-faq-layout">
        <div><p className="phv3-kicker">{str(copy.eyebrow)}</p><h2 className="phv3-heading">{str(copy.title)}</h2><p className="phv3-copy">{str(copy.description)}</p></div>
        <div className="phv3-faq-list">
          {items.length ? items.slice(0, 8).map((item, index) => {
            const expanded = open === index;
            const questionId = `${instanceId}-faq-question-${index}`;
            const answerId = `${instanceId}-faq-answer-${index}`;
            return <div className="phv3-faq-item" key={`${str(item.question)}-${index}`}>
              <h3><button type="button" className="phv3-faq-question" id={questionId} aria-expanded={expanded} aria-controls={answerId} onClick={() => setOpen(expanded ? null : index)}><span>{str(item.question)}</span><span><Sparkles aria-hidden="true" /></span></button></h3>
              {expanded ? <div className="phv3-faq-answer" id={answerId} role="region" aria-labelledby={questionId}>{str(item.answer)}</div> : null}
            </div>;
          }) : <p className="phv3-empty">{str(copy.emptyMessage)}</p>}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection({ data }: { data: CreativeHomeData }) {
  const copy = data.page.finalCta ?? {};
  const note = data.complianceNote || str(data.page.complianceNote);
  return (
    <section className="home-creative phv3 phv3-section--compact">
      <div className="phv3-shell">
        <div className="phv3-close">
          <p className="phv3-kicker">{str(copy.eyebrow)}</p><h2>{str(copy.title)}</h2><p>{str(copy.description)}</p>
          <div className="phv3-close-actions">
            <SiteLink href={copy.primaryHref} className="phv3-cta">{str(copy.primaryLabel)} <ArrowRight aria-hidden="true" /></SiteLink>
            <SiteLink href={copy.secondaryHref} className="phv3-cta phv3-cta--quiet">{str(copy.secondaryLabel)} <ArrowUpRight aria-hidden="true" /></SiteLink>
          </div>
          {note ? <p className="phv3-compliance"><ShieldCheck aria-hidden="true" />{note}</p> : null}
        </div>
      </div>
    </section>
  );
}

export const creativeSectionComponents: Record<string, ComponentType<{ data: CreativeHomeData }>> = {
  hero: HeroSection,
  clients: ClientStripSection,
  roles: RoleSection,
  suites: SuitesSection,
  journey: JourneySection,
  services: ServicesSection,
  learning: LearningSection,
  faq: FaqSection,
  finalCta: FinalCtaSection,
};
