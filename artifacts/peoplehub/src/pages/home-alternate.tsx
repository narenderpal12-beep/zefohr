import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Layers3,
  ShieldCheck, Sparkles, UsersRound, X,
} from 'lucide-react';
import { arr, formatINR, str, usePublicPosts, useSection, type AnyObj } from '@/lib/content';
import './home-alternate.css';
import { IntegrationLabel } from '@/components/site/integration-label';

function safeHref(value: unknown, fallback = '/contact') {
  const href = str(value).trim();
  return /^(?:\/(?!\/)|#|\?|https?:\/\/|mailto:|tel:)/i.test(href) ? href : fallback;
}

function SafeLink({ href, children, className, testId }: { href: unknown; children: ReactNode; className?: string; testId?: string }) {
  const target = safeHref(href);
  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    return <a href={target} className={className} data-testid={testId} {...(/^https?:/i.test(target) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  }
  if (target.startsWith('#')) return <a href={target} className={className} data-testid={testId}>{children}</a>;
  return <Link href={target} className={className} data-testid={testId}>{children}</Link>;
}

function HomeV2Heading({ eyebrow, title, description }: { eyebrow?: unknown; title?: unknown; description?: unknown }) {
  return (
    <div className="hv-section-heading">
      {eyebrow ? <p className="hv-eyebrow">{str(eyebrow)}</p> : null}
      {title ? <h2>{str(title)}</h2> : null}
      {description ? <p className="hv-section-copy">{str(description)}</p> : null}
    </div>
  );
}

function ProductSnapshot({ suite, brandName }: { suite: AnyObj; brandName: string }) {
  const modules = arr<string>(suite.modules);
  const nav = modules.slice(0, 4);
  return (
    <div className="hv-product-window" role="img" aria-label={`Illustrative ${str(suite.title)} product interface concept`}>
      <div className="hv-window-top">
        <span className="hv-window-brand"><span className="hv-window-mark"><UsersRound aria-hidden="true" /></span>{brandName}<span className="hv-window-caption">concept preview</span></span>
        <span className="hv-preview-badge">Illustrative</span>
      </div>
      <div className="hv-window-layout">
        <aside className="hv-window-sidebar" aria-hidden="true">
          <span className="hv-sidebar-label">WORKSPACE</span>
          {nav.map((item, index) => <span className={`hv-sidebar-item ${index === 0 ? 'is-active' : ''}`} key={`${item}-${index}`}><i />{item}</span>)}
          <span className="hv-sidebar-rule" />
          <span className="hv-sidebar-item"><i />Settings</span>
        </aside>
        <div className="hv-window-main">
          <div className="hv-breadcrumb">Workspace <span>/</span> {str(suite.title)}</div>
          <div className="hv-window-title-row">
            <div><h3>{str(suite.title)}</h3><p>A visual concept for a growing team</p></div>
            <span className="hv-window-action">Explore view</span>
          </div>
          <div className="hv-window-summary">
            <div><span>AREA</span><strong>{nav[0] ?? 'People workspace'}</strong><small>Illustrative module</small></div>
            <div><span>PRODUCT DIRECTION</span><strong>{str(suite.title)}</strong><small>Not operational software</small></div>
          </div>
          <div className="hv-table-heading"><span>EXAMPLE RECORD</span><span>WORK AREA</span><span>STATE</span></div>
          {[0, 1, 2].map((row) => (
            <div className="hv-table-row" key={row}>
              <span className="hv-record"><i>{String(row + 1).padStart(2, '0')}</i>Team member</span>
              <span>{nav[row % Math.max(nav.length, 1)] ?? 'Workspace'}</span>
              <span><b />Preview</span>
            </div>
          ))}
          <p className="hv-window-disclaimer"><ShieldCheck aria-hidden="true" />Illustrative UI snapshot · no employee data or transactions</p>
        </div>
      </div>
    </div>
  );
}

function suiteTabsKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, onSelect: (next: number) => void, idPrefix = 'hv-suite-tab-') {
  let next: number | null = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + count) % count;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = count - 1;
  if (next === null) return;
  event.preventDefault();
  onSelect(next);
  requestAnimationFrame(() => document.getElementById(`${idPrefix}${next}`)?.focus());
}

export function HomeAlternate() {
  const page = useSection('homepageV2') as AnyObj;
  const brand = useSection('brand') as AnyObj;
  const suitesSection = useSection('suites') as AnyObj;
  const servicesSection = useSection('services') as AnyObj;
  const clientsSection = useSection('clients') as AnyObj;
  const integrationsSection = useSection('integrations') as AnyObj;
  const pricing = useSection('pricing') as AnyObj;
  const faq = useSection('faq') as AnyObj;
  const suites = arr<AnyObj>(suitesSection.items);
  const heroSlides = suites.slice(0, 4);
  const services = arr<AnyObj>(servicesSection.items);
  const clients = clientsSection.enabled === false ? [] : arr<AnyObj>(clientsSection.items).filter((item) => item && item.visible !== false && str(item.name) && str(item.logoUrl));
  const [activeSuite, setActiveSuite] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroAutoplayPaused, setHeroAutoplayPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeRole, setActiveRole] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [activePrompt, setActivePrompt] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const { posts } = usePublicPosts();
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setPrefersReducedMotion(media.matches);
    syncMotionPreference();
    media.addEventListener('change', syncMotionPreference);
    return () => media.removeEventListener('change', syncMotionPreference);
  }, []);
  useEffect(() => {
    if (heroAutoplayPaused || prefersReducedMotion || heroSlides.length < 2) return;
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [activeHeroSlide, heroAutoplayPaused, prefersReducedMotion, heroSlides.length]);

  const announcement = (page.announcement ?? {}) as AnyObj;
  const hero = (page.hero ?? {}) as AnyObj;
  const approach = (page.approach ?? {}) as AnyObj;
  const path = (page.path ?? {}) as AnyObj;
  const product = (page.product ?? {}) as AnyObj;
  const roles = (page.roles ?? {}) as AnyObj;
  const lifecycle = (page.lifecycle ?? {}) as AnyObj;
  const ai = (page.ai ?? {}) as AnyObj;
  const comparison = (page.comparison ?? {}) as AnyObj;
  const industries = (page.industries ?? {}) as AnyObj;
  const serviceCopy = (page.services ?? {}) as AnyObj;
  const tools = (page.tools ?? {}) as AnyObj;
  const security = (page.security ?? {}) as AnyObj;
  const learning = (page.learning ?? {}) as AnyObj;
  const priceCopy = (page.pricing ?? {}) as AnyObj;
  const faqCopy = (page.faq ?? {}) as AnyObj;
  const finalCta = (page.finalCta ?? {}) as AnyObj;
  const statsCopy = (page.stats ?? {}) as AnyObj;
  const roleItems = arr<AnyObj>(roles.items);
  const phases = arr<AnyObj>(lifecycle.phases);
  const prompts = arr<AnyObj>(ai.prompts);
  const faqItems = arr<AnyObj>(faq.items);
  const plans = arr<AnyObj>(pricing.plans);
  const selectedSuite = suites[activeSuite] ?? suites[0];
  const currentHeroSlide = heroSlides[activeHeroSlide] ?? heroSlides[0];
  const selectedRole = roleItems[activeRole] ?? roleItems[0];
  const selectedPhase = phases[activePhase] ?? phases[0];
  const selectedPrompt = prompts[activePrompt] ?? prompts[0];
  const brandName = str(brand.name, 'ZefoHR');
  const publishedPosts = arr<AnyObj>(posts).filter((post) => !post.status || post.status === 'published').slice(0, 3);
  const validTrialDays = Number(pricing.trialDays);
  const trialDaysLabel = Number.isFinite(validTrialDays) && validTrialDays > 0 ? `${validTrialDays}-day free trial` : 'Free-trial signup';
  const statValues: Record<string, number> = {
    suites: suites.length,
    services: services.length,
    clients: clients.length,
    articles: publishedPosts.length,
  };
  const visibleStats = arr<AnyObj>(statsCopy.items).filter((item) => Number.isFinite(statValues[str(item.key)]) && statValues[str(item.key)] > 0);

  return (
    <main className="home-v2">
      {announcement.enabled !== false && !announcementDismissed ? (
        <div className="hv-announcement" data-testid="home-v2-announcement">
          <div className="hv-container hv-announcement-inner">
            <span className="hv-announcement-label">{str(announcement.label, brandName)}</span>
            <p>{str(announcement.text)}</p>
            <SafeLink href={announcement.href ?? '/request-demo'} className="hv-announcement-link">{str(announcement.linkLabel, 'Talk to our team')} <ArrowUpRight aria-hidden="true" /></SafeLink>
            <button type="button" className="hv-announcement-dismiss" aria-label={str(announcement.dismissLabel, 'Dismiss announcement')} onClick={() => setAnnouncementDismissed(true)}><X aria-hidden="true" /></button>
          </div>
        </div>
      ) : null}

      <section className="hv-hero" id="top">
        <div className="hv-container hv-hero-grid">
          <div className="hv-hero-copy">
            <p className="hv-eyebrow">{str(hero.eyebrow)}</p>
            <h1>{str(hero.title)}</h1>
            <p className="hv-lede">{str(hero.description)}</p>
            {currentHeroSlide ? (
              <div key={str(currentHeroSlide.key, str(currentHeroSlide.slug, String(activeHeroSlide)))} className="hv-hero-slide-copy" aria-live={heroAutoplayPaused || prefersReducedMotion ? 'polite' : 'off'} aria-atomic="true">
                <div><strong>{str(currentHeroSlide.title)}</strong><span>{str(product.plannedLabel, 'Planned suite')}</span></div>
                <p>{str(currentHeroSlide.body, str(currentHeroSlide.description, str(hero.description)))}</p>
              </div>
            ) : null}
            <div className="hv-actions">
              <SafeLink href={hero.primaryHref ?? '/register?mode=trial'} className="hv-button hv-button-primary" testId="link-home-v2-primary">{str(hero.primaryLabel, 'Start your free trial')} <ArrowRight aria-hidden="true" /></SafeLink>
              <SafeLink href={hero.secondaryHref ?? '#path'} className="hv-text-link">{str(hero.secondaryLabel, 'Find your starting point')} <ArrowRight aria-hidden="true" /></SafeLink>
            </div>
            {hero.currentNote ? <p className="hv-availability"><span aria-hidden="true" />{str(hero.currentNote)}</p> : null}
          </div>
          <div className="hv-hero-visual">
            <div className="hv-visual-caption"><span>{str(product.visualCaption, 'A considered view of what’s ahead')}</span><span>{str(product.visualTag, 'Illustrative product concept')}</span></div>
            {currentHeroSlide ? (
              <>
                <div id="hv-hero-dashboard-panel" role="tabpanel" aria-labelledby={`hv-hero-dashboard-tab-${activeHeroSlide}`}>
                  <ProductSnapshot key={str(currentHeroSlide.key, str(currentHeroSlide.slug, String(activeHeroSlide)))} suite={currentHeroSlide} brandName={brandName} />
                </div>
                {heroSlides.length > 1 ? (
                  <div className="hv-hero-carousel" data-testid="home-v2-hero-slider">
                    <div className="hv-carousel-toolbar">
                      <div className="hv-carousel-copy" aria-live={heroAutoplayPaused || prefersReducedMotion ? 'polite' : 'off'} aria-atomic="true">
                        <strong>{str(currentHeroSlide.title)}</strong>
                        <span>{str(currentHeroSlide.description)}</span>
                      </div>
                      <div className="hv-carousel-actions">
                        <span className="hv-carousel-count" aria-label={`${activeHeroSlide + 1} of ${heroSlides.length} dashboard previews`}>{String(activeHeroSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}</span>
                        <button type="button" className="hv-carousel-control" aria-label="Previous dashboard preview" onClick={() => setActiveHeroSlide((current) => (current + heroSlides.length - 1) % heroSlides.length)}><ChevronLeft aria-hidden="true" /></button>
                        <button type="button" className="hv-carousel-control" aria-label="Next dashboard preview" onClick={() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length)}><ChevronRight aria-hidden="true" /></button>
                        <button type="button" className="hv-carousel-control hv-carousel-toggle" aria-label={prefersReducedMotion ? 'Automatic rotation disabled by motion preference' : heroAutoplayPaused ? 'Resume dashboard rotation' : 'Pause dashboard rotation'} aria-pressed={heroAutoplayPaused} disabled={prefersReducedMotion} onClick={() => setHeroAutoplayPaused((paused) => !paused)}>{prefersReducedMotion ? 'Auto off' : heroAutoplayPaused ? 'Play' : 'Pause'}</button>
                      </div>
                    </div>
                    <div className="hv-carousel-thumbnails" role="tablist" aria-label="Choose a dashboard preview">
                      {heroSlides.map((suite, index) => (
                        <button
                          key={str(suite.key, str(suite.slug, String(index)))}
                          type="button"
                          id={`hv-hero-dashboard-tab-${index}`}
                          role="tab"
                          aria-selected={activeHeroSlide === index}
                          aria-controls="hv-hero-dashboard-panel"
                          tabIndex={activeHeroSlide === index ? 0 : -1}
                          className="hv-carousel-thumb"
                          data-testid={`button-home-v2-dashboard-${index}`}
                          onClick={() => setActiveHeroSlide(index)}
                          onKeyDown={(event) => suiteTabsKeyDown(event, index, heroSlides.length, setActiveHeroSlide, 'hv-hero-dashboard-tab-')}
                        >
                          <span className={`hv-thumbnail-art hv-thumbnail-art-${index % 4}`} aria-hidden="true">
                            <i className="hv-thumbnail-sidebar" />
                            <b className="hv-thumbnail-heading" />
                            <span className="hv-thumbnail-content"><i /><i /><i /><i /></span>
                          </span>
                          <span className="hv-thumbnail-label">{str(suite.title)}</span>
                        </button>
                      ))}
                    </div>
                    <p className="hv-carousel-disclosure">Illustrative dashboard concepts. HRMS suites shown here are planned product direction, not live software.</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="hv-empty-preview"><Layers3 aria-hidden="true" /><span>{str(product.emptyPreview)}</span></div>
            )}
          </div>
        </div>
      </section>

      {visibleStats.length ? (
        <section className="hv-stats" aria-label={str(statsCopy.ariaLabel, 'Current ZefoHR content')}>
          <div className="hv-container hv-stats-inner">
            {visibleStats.map((item) => <div className="hv-stat" key={str(item.key)}><strong>{statValues[str(item.key)].toLocaleString('en-IN')}</strong><span>{str(item.label)}</span></div>)}
            {statsCopy.note ? <p className="hv-stats-note">{str(statsCopy.note)}</p> : null}
          </div>
        </section>
      ) : null}

      {arr(approach.points).length ? (
        <section className="hv-approach" aria-label={str(approach.title, 'ZefoHR approach')}>
          <div className="hv-container hv-approach-inner">
            <h2>{str(approach.title)}</h2>
            {arr<string>(approach.points).map((point, index) => <p key={`${point}-${index}`}><Check aria-hidden="true" />{point}</p>)}
          </div>
        </section>
      ) : null}

      {arr(path.steps).length ? (
        <section className="hv-path" id="path">
          <div className="hv-container">
            <HomeV2Heading eyebrow={path.eyebrow} title={path.title} description={path.description} />
            <div className="hv-path-grid">
              {arr<AnyObj>(path.steps).map((step, index) => (
                <article className="hv-path-card" key={`${str(step.title)}-${index}`}>
                  <span className="hv-index">{String(index + 1).padStart(2, '0')} / {str(step.label, 'EXPLORE').toUpperCase()}</span>
                  <span className="hv-step-pill">{str(step.label, 'Explore')}</span>
                  <h3>{str(step.title)}</h3>
                  <p>{str(step.description)}</p>
                  <SafeLink href={step.href ?? '#explore'} className="hv-text-link">
                    {str(step.linkLabel, 'Explore the platform')} <ArrowRight aria-hidden="true" />
                  </SafeLink>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {selectedSuite ? (
        <section className="hv-explore" id="explore">
          <div className="hv-container hv-explore-grid">
            <div className="hv-explore-intro">
              <HomeV2Heading eyebrow={product.eyebrow} title={product.title} description={product.description} />
              {product.disclosure ? <div className="hv-disclosure"><strong>{str(product.disclosureTitle, 'Illustrative product direction')}</strong><p>{str(product.disclosure)}</p></div> : null}
            </div>
            <div className="hv-suite-tabs" role="tablist" aria-label={str(product.tabsLabel, 'Explore product suites')}>
              {suites.map((suite, index) => (
                <button
                  key={str(suite.key, str(suite.slug, String(index)))}
                  id={`hv-suite-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={activeSuite === index}
                  aria-controls="hv-suite-panel"
                  tabIndex={activeSuite === index ? 0 : -1}
                  onClick={() => setActiveSuite(index)}
                  onKeyDown={(event) => suiteTabsKeyDown(event, index, suites.length, setActiveSuite)}
                  className="hv-suite-tab"
                  data-testid={`tab-home-v2-suite-${str(suite.key, String(index))}`}
                >
                  <span className="hv-tab-index">{String(index + 1).padStart(2, '0')}</span>
                  <span><strong>{str(suite.title)}</strong><small>{str(suite.description)}</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="hv-suite-detail" id="hv-suite-panel" role="tabpanel" aria-labelledby={`hv-suite-tab-${activeSuite}`}>
              <ProductSnapshot suite={selectedSuite} brandName={brandName} />
              <div className="hv-suite-description">
                <div><span className="hv-status"><i /> {str(product.plannedLabel, 'Planned suite')}</span><h3>{str(selectedSuite.title)}</h3><p>{str(selectedSuite.body, str(selectedSuite.description))}</p></div>
                <SafeLink href={`/features/${str(selectedSuite.slug)}`} className="hv-text-link">{str(product.learnMoreLabel, 'Explore this suite')} <ArrowRight aria-hidden="true" /></SafeLink>
              </div>
              {arr<string>(selectedSuite.modules).length ? <ul className="hv-module-list" aria-label={`${str(selectedSuite.title)} areas`}>{arr<string>(selectedSuite.modules).slice(0, 8).map((module) => <li key={module}>{module}</li>)}</ul> : null}
            </div>
          </div>
        </section>
      ) : null}

      {roleItems.length ? (
        <section className="hv-roles">
          <div className="hv-container hv-roles-layout">
            <div><HomeV2Heading eyebrow={roles.eyebrow} title={roles.title} description={roles.description} />
              <div className="hv-role-switcher" role="group" aria-label={str(roles.selectorLabel, 'Choose a role')}>
                {roleItems.map((role, index) => <button type="button" key={`${str(role.name)}-${index}`} aria-pressed={activeRole === index} onClick={() => setActiveRole(index)}>{str(role.name)}</button>)}
              </div>
            </div>
            {selectedRole ? (
              <div className="hv-role-panel" aria-live="polite">
                <span className="hv-eyebrow">{str(selectedRole.name)}</span>
                <h3>{str(selectedRole.description)}</h3>
                <p>{str(roles.suiteLinksLabel)}</p>
                <div className="hv-role-links">
                  {arr<string>(selectedRole.suiteKeys).map((key) => {
                    const suite = suites.find((item) => str(item.key) === key);
                    return suite ? <SafeLink key={key} href={`/features/${str(suite.slug)}`} className="hv-role-link">{str(suite.title)} <ArrowUpRight aria-hidden="true" /></SafeLink> : null;
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {phases.length ? (
        <section className="hv-lifecycle">
          <div className="hv-container">
            <HomeV2Heading eyebrow={lifecycle.eyebrow} title={lifecycle.title} description={lifecycle.description} />
            <div className="hv-lifecycle-layout">
              <div className="hv-phase-list" role="tablist" aria-label={str(lifecycle.selectorLabel, 'Employee journey stages')}>
                {phases.map((phase, index) => (
                  <button type="button" id={`hv-phase-tab-${index}`} role="tab" aria-selected={activePhase === index} aria-controls="hv-phase-panel" tabIndex={activePhase === index ? 0 : -1} key={`${str(phase.title)}-${index}`} onClick={() => setActivePhase(index)} onKeyDown={(event) => suiteTabsKeyDown(event, index, phases.length, setActivePhase, 'hv-phase-tab-')} className="hv-phase-button">
                    <span>{String(index + 1).padStart(2, '0')}</span><strong>{str(phase.title)}</strong><ChevronRight aria-hidden="true" />
                  </button>
                ))}
              </div>
              {selectedPhase ? (
                <div className="hv-phase-panel" id="hv-phase-panel" role="tabpanel" aria-labelledby={`hv-phase-tab-${activePhase}`}>
                  <span className="hv-phase-orbit" aria-hidden="true"><Layers3 /></span>
                  <p className="hv-eyebrow">{str(lifecycle.plannedLabel, 'A planned capability')}</p>
                  <h3>{str(selectedPhase.title)}</h3>
                  <p>{str(selectedPhase.description)}</p>
                  {(() => {
                    const suite = suites.find((item) => str(item.key) === str(selectedPhase.suiteKey));
                    return suite ? <SafeLink href={`/features/${str(suite.slug)}`} className="hv-text-link">{str(lifecycle.linkPrefix, 'Explore')} {str(suite.title)} <ArrowRight aria-hidden="true" /></SafeLink> : null;
                  })()}
                  <p className="hv-small-note">{str(lifecycle.disclosure)}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {arr(ai.items).length || prompts.length ? (
        <section className="hv-ai">
          <div className="hv-container hv-ai-grid">
            <div><HomeV2Heading eyebrow={ai.eyebrow} title={ai.title} description={ai.description} />
              {arr<AnyObj>(ai.items).length ? <ul className="hv-ai-capabilities">{arr<AnyObj>(ai.items).slice(0, 4).map((item, index) => <li key={`${str(item.title)}-${index}`}><Sparkles aria-hidden="true" /><span>{str(item.title)}</span></li>)}</ul> : null}
            </div>
            <div className="hv-chat-preview">
              <div className="hv-chat-top"><span><Sparkles aria-hidden="true" />{str(ai.assistantLabel, 'Assistant concept')}</span><span>{str(ai.previewLabel, 'Preview only')}</span></div>
              <div className="hv-chat-thread" aria-live="polite">
                <div className="hv-chat-message hv-chat-user">{selectedPrompt ? str(selectedPrompt.prompt) : str(ai.emptyPromptLabel)}</div>
                <div className="hv-chat-message hv-chat-answer"><span className="hv-chat-mark"><Sparkles aria-hidden="true" /></span>{selectedPrompt ? str(selectedPrompt.answer) : str(ai.disclosure)}</div>
              </div>
              {prompts.length ? <div className="hv-prompt-list" aria-label={str(ai.promptListLabel, 'Example questions')}>{prompts.map((item, index) => <button key={`${str(item.prompt)}-${index}`} type="button" aria-pressed={activePrompt === index} onClick={() => setActivePrompt(index)}>{str(item.prompt)}</button>)}</div> : null}
              {ai.disclosure ? <p className="hv-small-note">{str(ai.disclosure)}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {arr(comparison.rows).length ? (
        <section className="hv-comparison">
          <div className="hv-container">
            <HomeV2Heading eyebrow={comparison.eyebrow} title={comparison.title} description={comparison.description} />
            <div className="hv-comparison-table">
              <div className="hv-comparison-head"><span>{str(comparison.leftTitle)}</span><span>{str(comparison.rightTitle)}</span></div>
              {arr<AnyObj>(comparison.rows).map((row, index) => <div className="hv-comparison-row" key={`${str(row.challenge)}-${index}`}><p>{str(row.challenge)}</p><p><CheckCircle2 aria-hidden="true" />{str(row.approach)}</p></div>)}
            </div>
          </div>
        </section>
      ) : null}

      {arr(industries.items).length ? (
        <section className="hv-industries">
          <div className="hv-container">
            <HomeV2Heading eyebrow={industries.eyebrow} title={industries.title} description={industries.description} />
            <div className="hv-industry-grid">{arr<AnyObj>(industries.items).map((item, index) => <article className="hv-industry-card" key={`${str(item.title)}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{str(item.title)}</h3><p>{str(item.description)}</p><SafeLink href={industries.linkHref ?? '/request-demo'} className="hv-text-link">{str(industries.linkLabel, 'Discuss your needs')} <ArrowRight aria-hidden="true" /></SafeLink></article>)}</div>
          </div>
        </section>
      ) : null}

      {services.length ? (
        <section className="hv-services">
          <div className="hv-container">
            <div className="hv-services-head"><HomeV2Heading eyebrow={str(servicesSection.eyebrow)} title={str(servicesSection.title)} description={str(servicesSection.description)} />{serviceCopy.contextNote ? <p className="hv-side-note">{str(serviceCopy.contextNote)}</p> : null}</div>
            <div className="hv-service-grid">{services.slice(0, 6).map((service, index) => <SafeLink key={str(service.slug, String(index))} href={`/services/${str(service.slug)}`} className="hv-service-card"><span>{String(index + 1).padStart(2, '0')} / {str(serviceCopy.itemLabel, 'SERVICE')}</span><h3>{str(service.title)}</h3><p>{str(service.description)}</p><ArrowUpRight aria-hidden="true" /></SafeLink>)}</div>
            <SafeLink href={serviceCopy.allHref ?? '/services'} className="hv-text-link">{str(serviceCopy.allLabel, 'Explore specialist services')} <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : null}

      {arr(tools.items).length ? (
        <section className="hv-tools">
          <div className="hv-container hv-tools-layout">
            <HomeV2Heading eyebrow={tools.eyebrow} title={tools.title} description={tools.description} />
            <div className="hv-tools-grid">{arr<AnyObj>(tools.items).map((item, index) => <SafeLink href={str(item.href, '/free-tools')} key={`${str(item.title)}-${index}`} className="block"><span className="hv-tool-icon"><CircleHelp aria-hidden="true" /></span><h3>{str(item.title)}</h3><p>{str(item.description)}</p></SafeLink>)}</div>
            <SafeLink href={tools.ctaHref ?? '/request-demo'} className="hv-button hv-button-secondary">{str(tools.ctaLabel, 'Talk through a question')} <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : null}

      {arr(security.points).length || arr(integrationsSection.items).length ? (
        <section className="hv-security">
          <div className="hv-container hv-security-grid">
            <div><HomeV2Heading eyebrow={security.eyebrow} title={security.title} description={security.description} /></div>
            <div className="hv-security-content">
              {arr<string>(security.points).length ? <ul className="hv-security-list">{arr<string>(security.points).map((point, index) => <li key={`${point}-${index}`}><ShieldCheck aria-hidden="true" />{point}</li>)}</ul> : null}
              {arr(integrationsSection.items).length ? <div className="hv-integrations"><h3>{str(integrationsSection.title)}</h3><ul>{arr(integrationsSection.items).map((item, index) => <li key={index}><IntegrationLabel item={item} /></li>)}</ul></div> : null}
            </div>
          </div>
        </section>
      ) : null}

      {clientsSection.enabled !== false && clients.length ? (
        <section className="hv-clients">
          <div className="hv-container">
            <HomeV2Heading eyebrow={str(clientsSection.eyebrow)} title={str(clientsSection.title)} description={str(clientsSection.description)} />
            <ul className="hv-client-list">{clients.map((client, index) => {
              const url = /^https?:\/\//i.test(str(client.website)) ? str(client.website) : '';
              const logo = <span className="hv-client-logo"><img src={str(client.logoUrl)} alt={str(client.alt, str(client.name))} loading="lazy" decoding="async" /></span>;
              return <li key={str(client.id, `${str(client.name)}-${index}`)}>{url ? <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${str(client.name)} website`}>{logo}</a> : logo}</li>;
            })}</ul>
          </div>
        </section>
      ) : null}

      {publishedPosts.length ? (
        <section className="hv-learning">
          <div className="hv-container">
            <HomeV2Heading eyebrow={learning.eyebrow} title={learning.title} description={learning.description} />
            <div className="hv-learning-grid">{publishedPosts.map((post, index) => <SafeLink href={`/blog/${str(post.slug)}`} className="hv-learning-card" key={str(post.id, `${str(post.slug)}-${index}`)}>{post.cover_image_url ? <img src={str(post.cover_image_url)} alt={str(post.cover_image_alt, str(post.title))} loading="lazy" /> : <span className="hv-learning-art" aria-hidden="true"><Layers3 /></span>}<span className="hv-learning-meta">{str(post.author)}{post.published_at ? ` · ${new Date(String(post.published_at)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}` : ''}</span><h3>{str(post.title)}</h3><p>{str(post.excerpt)}</p><span className="hv-text-link">{str(learning.readLabel, 'Read article')} <ArrowRight aria-hidden="true" /></span></SafeLink>)}</div>
            <SafeLink href="/blog" className="hv-text-link">{str(learning.visitLabel, 'Visit the resource hub')} <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : (
        <section className="hv-learning hv-learning-empty">
          <div className="hv-container hv-learning-empty-inner"><div><HomeV2Heading eyebrow={learning.eyebrow} title={str(learning.emptyTitle, str(learning.title))} description={str(learning.emptyDescription, str(learning.description))} /></div><SafeLink href="/blog" className="hv-text-link">{str(learning.emptyLinkLabel, 'Visit the blog')} <ArrowRight aria-hidden="true" /></SafeLink></div>
        </section>
      )}

      {plans.length ? (
        <section className="hv-pricing" id="plans">
          <div className="hv-container">
            <div className="hv-pricing-heading"><HomeV2Heading eyebrow={priceCopy.eyebrow} title={priceCopy.title} description={priceCopy.description} />
              <div className="hv-billing-toggle" role="group" aria-label={str(priceCopy.cycleLabel, 'Billing cycle')}>
                {(['monthly', 'annual'] as const).map((cycle) => <button type="button" aria-pressed={billingCycle === cycle} key={cycle} onClick={() => setBillingCycle(cycle)}>{cycle === 'monthly' ? str(pricing.monthlyLabel, 'Monthly') : str(pricing.annualLabel, 'Annually')}</button>)}
              </div>
            </div>
            <div className="hv-plan-grid">{plans.slice(0, 3).map((plan, index) => {
              const price = billingCycle === 'annual' ? plan.annual : plan.monthly;
              const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;
              const enterprise = /enterprise|custom|contact/i.test(str(plan.key) + str(plan.button));
              return <article className={`hv-plan-card ${plan.highlighted ? 'is-highlighted' : ''}`} key={str(plan.key, String(index))}>
                <span className="hv-plan-label">{str(plan.name)}</span><h3>{str(plan.description)}</h3>
                <div className="hv-plan-price">{hasPrice ? formatINR(price) : str(priceCopy.noPriceLabel, 'Talk to our team')}{hasPrice ? <small>{str(priceCopy.unitLabel, '/ employee / month')}</small> : null}</div>
                <ul>{arr<string>(plan.features).slice(0, 4).map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul>
                <SafeLink href={enterprise ? '/contact' : `/register?plan=${encodeURIComponent(str(plan.key))}&mode=trial`} className={plan.highlighted ? 'hv-button hv-button-primary' : 'hv-text-link'}>{str(plan.button, enterprise ? 'Talk to our team' : 'Start free trial')} <ArrowRight aria-hidden="true" /></SafeLink>
              </article>;
            })}</div>
            <p className="hv-price-note">{trialDaysLabel}. {str(priceCopy.priceNote)}</p>
          </div>
        </section>
      ) : null}

      {faqItems.length ? (
        <section className="hv-faq" id="faq">
          <div className="hv-container hv-faq-grid">
            <div><HomeV2Heading eyebrow={faqCopy.eyebrow} title={faqCopy.title} /><p className="hv-side-note">{str(faqCopy.supportPrompt)} <SafeLink href={faqCopy.supportHref ?? '/contact'} className="hv-inline-link">{str(faqCopy.supportLabel, 'Talk to our team')} <ArrowRight aria-hidden="true" /></SafeLink></p></div>
            <div className="hv-faq-list">{faqItems.map((item, index) => <div className="hv-faq-item" key={`${str(item.question)}-${index}`}><h3><button type="button" aria-expanded={openFaq === index} aria-controls={`hv-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{str(item.question)}<span aria-hidden="true">{openFaq === index ? '−' : '+'}</span></button></h3><p id={`hv-faq-answer-${index}`} hidden={openFaq !== index}>{str(item.answer)}</p></div>)}</div>
          </div>
        </section>
      ) : null}

      <section className="hv-final-cta">
        <div className="hv-container hv-final-card">
          <div><p className="hv-eyebrow">{brandName}</p><h2>{str(finalCta.title)}</h2><p>{str(finalCta.description)}</p></div>
          <div className="hv-final-actions">
            <SafeLink href={finalCta.primaryHref ?? '/request-demo'} className="hv-button hv-button-primary">{str(finalCta.primaryLabel, 'Talk to our team')} <ArrowRight aria-hidden="true" /></SafeLink>
            <SafeLink href={finalCta.secondaryHref ?? '/register?mode=trial'} className="hv-text-link">{str(finalCta.secondaryLabel, 'Start free trial')} <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </div>
      </section>
    </main>
  );
}
