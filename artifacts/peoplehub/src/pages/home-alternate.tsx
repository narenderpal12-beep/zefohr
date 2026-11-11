import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleHelp, Layers3,
  ShieldCheck, Sparkles, UsersRound, X,
} from 'lucide-react';
import { arr, formatINR, str, usePublicPosts, useSection, type AnyObj } from '@/lib/content';
import './home-alternate.css';

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
  const services = arr<AnyObj>(servicesSection.items);
  const clients = clientsSection.enabled === false ? [] : arr<AnyObj>(clientsSection.items).filter((item) => item && item.visible !== false && str(item.name) && str(item.logoUrl));
  const [activeSuite, setActiveSuite] = useState(0);
  const [activeRole, setActiveRole] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [activePrompt, setActivePrompt] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const { posts } = usePublicPosts();

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
  const selectedRole = roleItems[activeRole] ?? roleItems[0];
  const selectedPhase = phases[activePhase] ?? phases[0];
  const selectedPrompt = prompts[activePrompt] ?? prompts[0];
  const brandName = str(brand.name, 'PeopleHub');
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
            <SafeLink href="/request-demo" className="hv-announcement-link">{str(announcement.linkLabel, 'Talk to our team')} <ArrowUpRight aria-hidden="true" /></SafeLink>
            <button type="button" className="hv-announcement-dismiss" aria-label="Dismiss announcement" onClick={() => setAnnouncementDismissed(true)}><X aria-hidden="true" /></button>
          </div>
        </div>
      ) : null}

      <section className="hv-hero" id="top">
        <div className="hv-container hv-hero-grid">
          <div className="hv-hero-copy">
            <p className="hv-eyebrow">{str(hero.eyebrow)}</p>
            <h1>{str(hero.title)}</h1>
            <p className="hv-lede">{str(hero.description)}</p>
            <div className="hv-actions">
              <SafeLink href={hero.primaryHref ?? '/register?mode=trial'} className="hv-button hv-button-primary" testId="link-home-v2-primary">{str(hero.primaryLabel, 'Start your free trial')} <ArrowRight aria-hidden="true" /></SafeLink>
              <SafeLink href={hero.secondaryHref ?? '#path'} className="hv-text-link">{str(hero.secondaryLabel, 'Find your starting point')} <ArrowRight aria-hidden="true" /></SafeLink>
            </div>
            {hero.currentNote ? <p className="hv-availability"><span aria-hidden="true" />{str(hero.currentNote)}</p> : null}
          </div>
          <div className="hv-hero-visual">
            <div className="hv-visual-caption"><span>A considered view of what’s ahead</span><span>Illustrative product concept</span></div>
            {selectedSuite ? <ProductSnapshot suite={selectedSuite} brandName={brandName} /> : (
              <div className="hv-empty-preview"><Layers3 aria-hidden="true" /><span>Add product suites in Admin to show a product preview.</span></div>
            )}
          </div>
        </div>
      </section>

      {visibleStats.length ? (
        <section className="hv-stats" aria-label="Current PeopleHub content">
          <div className="hv-container hv-stats-inner">
            {visibleStats.map((item) => <div className="hv-stat" key={str(item.key)}><strong>{statValues[str(item.key)].toLocaleString('en-IN')}</strong><span>{str(item.label)}</span></div>)}
            {statsCopy.note ? <p className="hv-stats-note">{str(statsCopy.note)}</p> : null}
          </div>
        </section>
      ) : null}

      {arr(approach.points).length ? (
        <section className="hv-approach" aria-label="PeopleHub approach">
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
                  <SafeLink href={index === 1 ? '/register?mode=trial' : index === 2 ? '/request-demo' : '#explore'} className="hv-text-link">
                    {index === 1 ? 'Start free trial' : index === 2 ? 'Talk to our team' : 'Explore the platform'} <ArrowRight aria-hidden="true" />
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
              <div className="hv-suite-tabs" role="tablist" aria-label="Explore product suites">
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
            </div>
            <div className="hv-suite-detail" id="hv-suite-panel" role="tabpanel" aria-labelledby={`hv-suite-tab-${activeSuite}`}>
              <ProductSnapshot suite={selectedSuite} brandName={brandName} />
              <div className="hv-suite-description">
                <div><span className="hv-status"><i /> Planned suite</span><h3>{str(selectedSuite.title)}</h3><p>{str(selectedSuite.body, str(selectedSuite.description))}</p></div>
                <SafeLink href={`/features/${str(selectedSuite.slug)}`} className="hv-text-link">Explore this suite <ArrowRight aria-hidden="true" /></SafeLink>
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
              <div className="hv-role-switcher" role="group" aria-label="Choose a role">
                {roleItems.map((role, index) => <button type="button" key={`${str(role.name)}-${index}`} aria-pressed={activeRole === index} onClick={() => setActiveRole(index)}>{str(role.name)}</button>)}
              </div>
            </div>
            {selectedRole ? (
              <div className="hv-role-panel" aria-live="polite">
                <span className="hv-eyebrow">{str(selectedRole.name)}</span>
                <h3>{str(selectedRole.description)}</h3>
                <p>Explore the planned suites that connect to this kind of work:</p>
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
              <div className="hv-phase-list" role="tablist" aria-label="Employee journey stages">
                {phases.map((phase, index) => (
                  <button type="button" id={`hv-phase-tab-${index}`} role="tab" aria-selected={activePhase === index} aria-controls="hv-phase-panel" tabIndex={activePhase === index ? 0 : -1} key={`${str(phase.title)}-${index}`} onClick={() => setActivePhase(index)} onKeyDown={(event) => suiteTabsKeyDown(event, index, phases.length, setActivePhase, 'hv-phase-tab-')} className="hv-phase-button">
                    <span>{String(index + 1).padStart(2, '0')}</span><strong>{str(phase.title)}</strong><ChevronRight aria-hidden="true" />
                  </button>
                ))}
              </div>
              {selectedPhase ? (
                <div className="hv-phase-panel" id="hv-phase-panel" role="tabpanel" aria-labelledby={`hv-phase-tab-${activePhase}`}>
                  <span className="hv-phase-orbit" aria-hidden="true"><Layers3 /></span>
                  <p className="hv-eyebrow">A planned capability</p>
                  <h3>{str(selectedPhase.title)}</h3>
                  <p>{str(selectedPhase.description)}</p>
                  {(() => {
                    const suite = suites.find((item) => str(item.key) === str(selectedPhase.suiteKey));
                    return suite ? <SafeLink href={`/features/${str(suite.slug)}`} className="hv-text-link">Explore {str(suite.title)} <ArrowRight aria-hidden="true" /></SafeLink> : null;
                  })()}
                  <p className="hv-small-note">Illustrative product direction, not an operational employee workflow.</p>
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
              <div className="hv-chat-top"><span><Sparkles aria-hidden="true" />Assistant concept</span><span>Preview only</span></div>
              <div className="hv-chat-thread" aria-live="polite">
                <div className="hv-chat-message hv-chat-user">{selectedPrompt ? str(selectedPrompt.prompt) : 'Choose a question to explore'}</div>
                <div className="hv-chat-message hv-chat-answer"><span className="hv-chat-mark"><Sparkles aria-hidden="true" /></span>{selectedPrompt ? str(selectedPrompt.answer) : str(ai.disclosure)}</div>
              </div>
              {prompts.length ? <div className="hv-prompt-list" aria-label="Example questions">{prompts.map((item, index) => <button key={`${str(item.prompt)}-${index}`} type="button" aria-pressed={activePrompt === index} onClick={() => setActivePrompt(index)}>{str(item.prompt)}</button>)}</div> : null}
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
            <div className="hv-industry-grid">{arr<AnyObj>(industries.items).map((item, index) => <article className="hv-industry-card" key={`${str(item.title)}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{str(item.title)}</h3><p>{str(item.description)}</p><SafeLink href="/request-demo" className="hv-text-link">Discuss your needs <ArrowRight aria-hidden="true" /></SafeLink></article>)}</div>
          </div>
        </section>
      ) : null}

      {services.length ? (
        <section className="hv-services">
          <div className="hv-container">
            <div className="hv-services-head"><HomeV2Heading eyebrow={str(servicesSection.eyebrow)} title={str(servicesSection.title)} description={str(servicesSection.description)} /><p className="hv-side-note">Sometimes the right answer is a person, not another platform. Service scope is discussed with your team.</p></div>
            <div className="hv-service-grid">{services.slice(0, 6).map((service, index) => <SafeLink key={str(service.slug, String(index))} href={`/services/${str(service.slug)}`} className="hv-service-card"><span>{String(index + 1).padStart(2, '0')} / SERVICE</span><h3>{str(service.title)}</h3><p>{str(service.description)}</p><ArrowUpRight aria-hidden="true" /></SafeLink>)}</div>
            <SafeLink href="/services" className="hv-text-link">Explore specialist services <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : null}

      {arr(tools.items).length ? (
        <section className="hv-tools">
          <div className="hv-container hv-tools-layout">
            <HomeV2Heading eyebrow={tools.eyebrow} title={tools.title} description={tools.description} />
            <div className="hv-tools-grid">{arr<AnyObj>(tools.items).map((item, index) => <article key={`${str(item.title)}-${index}`}><span className="hv-tool-icon"><CircleHelp aria-hidden="true" /></span><h3>{str(item.title)}</h3><p>{str(item.description)}</p></article>)}</div>
            <SafeLink href="/request-demo" className="hv-button hv-button-secondary">Talk through a question <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : null}

      {arr(security.points).length || arr(integrationsSection.items).length ? (
        <section className="hv-security">
          <div className="hv-container hv-security-grid">
            <div><HomeV2Heading eyebrow={security.eyebrow} title={security.title} description={security.description} /></div>
            <div className="hv-security-content">
              {arr<string>(security.points).length ? <ul className="hv-security-list">{arr<string>(security.points).map((point, index) => <li key={`${point}-${index}`}><ShieldCheck aria-hidden="true" />{point}</li>)}</ul> : null}
              {arr(integrationsSection.items).length ? <div className="hv-integrations"><h3>{str(integrationsSection.title, 'Tools and systems to discuss')}</h3><ul>{arr<string>(integrationsSection.items).map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            </div>
          </div>
        </section>
      ) : null}

      {clientsSection.enabled !== false && clients.length ? (
        <section className="hv-clients">
          <div className="hv-container">
            <HomeV2Heading eyebrow={str(clientsSection.eyebrow, 'CLIENTS')} title={str(clientsSection.title)} description={str(clientsSection.description)} />
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
            <div className="hv-learning-grid">{publishedPosts.map((post, index) => <SafeLink href={`/blog/${str(post.slug)}`} className="hv-learning-card" key={str(post.id, `${str(post.slug)}-${index}`)}>{post.cover_image_url ? <img src={str(post.cover_image_url)} alt={str(post.cover_image_alt, str(post.title))} loading="lazy" /> : <span className="hv-learning-art" aria-hidden="true"><Layers3 /></span>}<span className="hv-learning-meta">{str(post.author)}{post.published_at ? ` · ${new Date(String(post.published_at)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}` : ''}</span><h3>{str(post.title)}</h3><p>{str(post.excerpt)}</p><span className="hv-text-link">Read article <ArrowRight aria-hidden="true" /></span></SafeLink>)}</div>
            <SafeLink href="/blog" className="hv-text-link">Visit the resource hub <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </section>
      ) : (
        <section className="hv-learning hv-learning-empty">
          <div className="hv-container hv-learning-empty-inner"><div><HomeV2Heading eyebrow={learning.eyebrow} title={str(learning.emptyTitle, str(learning.title))} description={str(learning.emptyDescription, str(learning.description))} /></div><SafeLink href="/blog" className="hv-text-link">Visit the blog <ArrowRight aria-hidden="true" /></SafeLink></div>
        </section>
      )}

      {plans.length ? (
        <section className="hv-pricing" id="plans">
          <div className="hv-container">
            <div className="hv-pricing-heading"><HomeV2Heading eyebrow={priceCopy.eyebrow} title={priceCopy.title} description={priceCopy.description} />
              <div className="hv-billing-toggle" role="radiogroup" aria-label="Billing cycle">
                {(['monthly', 'annual'] as const).map((cycle) => <button type="button" aria-pressed={billingCycle === cycle} key={cycle} onClick={() => setBillingCycle(cycle)}>{cycle}</button>)}
              </div>
            </div>
            <div className="hv-plan-grid">{plans.slice(0, 3).map((plan, index) => {
              const price = billingCycle === 'annual' ? plan.annual : plan.monthly;
              const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;
              const enterprise = /enterprise|custom|contact/i.test(str(plan.key) + str(plan.button));
              return <article className={`hv-plan-card ${plan.highlighted ? 'is-highlighted' : ''}`} key={str(plan.key, String(index))}>
                <span className="hv-plan-label">{str(plan.name)}</span><h3>{str(plan.description)}</h3>
                <div className="hv-plan-price">{hasPrice ? formatINR(price) : 'Talk to our team'}{hasPrice ? <small>/ employee / month</small> : null}</div>
                <ul>{arr<string>(plan.features).slice(0, 4).map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul>
                <SafeLink href={enterprise ? '/contact' : `/register?plan=${encodeURIComponent(str(plan.key))}&mode=trial`} className={plan.highlighted ? 'hv-button hv-button-primary' : 'hv-text-link'}>{enterprise ? 'Discuss your needs' : 'Start free trial'} <ArrowRight aria-hidden="true" /></SafeLink>
              </article>;
            })}</div>
            <p className="hv-price-note">{trialDaysLabel}. Plan details are managed by PeopleHub and can be confirmed with the team.</p>
          </div>
        </section>
      ) : null}

      {faqItems.length ? (
        <section className="hv-faq" id="faq">
          <div className="hv-container hv-faq-grid">
            <div><HomeV2Heading eyebrow={faqCopy.eyebrow} title={faqCopy.title} /><p className="hv-side-note">Still deciding what fits? <SafeLink href="/contact" className="hv-inline-link">Talk to our team <ArrowRight aria-hidden="true" /></SafeLink></p></div>
            <div className="hv-faq-list">{faqItems.map((item, index) => <div className="hv-faq-item" key={`${str(item.question)}-${index}`}><h3><button type="button" aria-expanded={openFaq === index} aria-controls={`hv-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{str(item.question)}<span aria-hidden="true">{openFaq === index ? '−' : '+'}</span></button></h3><p id={`hv-faq-answer-${index}`} hidden={openFaq !== index}>{str(item.answer)}</p></div>)}</div>
          </div>
        </section>
      ) : null}

      <section className="hv-final-cta">
        <div className="hv-container hv-final-card">
          <div><p className="hv-eyebrow">{brandName}</p><h2>{str(finalCta.title)}</h2><p>{str(finalCta.description)}</p></div>
          <div className="hv-final-actions">
            <SafeLink href="/request-demo" className="hv-button hv-button-primary">{str(finalCta.primaryLabel, 'Talk to our team')} <ArrowRight aria-hidden="true" /></SafeLink>
            <SafeLink href="/register?mode=trial" className="hv-text-link">{str(finalCta.secondaryLabel, 'Start free trial')} <ArrowRight aria-hidden="true" /></SafeLink>
          </div>
        </div>
      </section>
    </main>
  );
}
