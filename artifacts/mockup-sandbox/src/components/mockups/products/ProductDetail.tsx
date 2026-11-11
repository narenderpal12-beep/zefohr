import {
  ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarDays, Check, ChevronRight, ClipboardCheck,
  FileText, Search, ShieldCheck, Users,
} from 'lucide-react';
import './product-detail.css';

const modules = [
  {
    number: '01',
    icon: FileText,
    title: 'Employee records that stay useful',
    body: 'Bring essential profile information, documents and employment history into one considered record—ready to support the next people decision.',
    tags: ['Profiles', 'Documents', 'History'],
  },
  {
    number: '02',
    icon: Building2,
    title: 'A clearer view of your organisation',
    body: 'Map teams, locations and reporting relationships so people can understand how work is organised as your business changes.',
    tags: ['Teams', 'Locations', 'Reporting'],
  },
  {
    number: '03',
    icon: CalendarDays,
    title: 'People milestones in context',
    body: 'Keep onboarding, confirmation, transfers and role changes connected to the employee journey instead of scattered across follow-up lists.',
    tags: ['Onboarding', 'Milestones', 'Transitions'],
  },
];

const journey = [
  { step: '01', title: 'Welcome', body: 'Collect the essentials and give new joiners a clear first step.' },
  { step: '02', title: 'Organise', body: 'Keep team structure, documents and role details in context.' },
  { step: '03', title: 'Support', body: 'Make everyday requests easier to understand and follow.' },
  { step: '04', title: 'Move forward', body: 'Keep role changes and employee milestones connected.' },
];

export function ProductDetail() {
  return (
    <main className="ph-product-detail" id="top">
      <header className="pd-header">
        <div className="pd-header-inner">
          <a className="pd-brand" href="#top" aria-label="PeopleHub home">
            <span className="pd-brand-mark"><Users size={18} aria-hidden="true" /></span>
            <span>People<span>Hub</span></span>
          </a>
          <nav className="pd-nav" aria-label="Main navigation">
            <a className="is-active" href="#suite">Products</a>
            <a href="#related">Services</a>
            <a href="#questions">Resources</a>
            <a href="#contact">Company</a>
          </nav>
          <div className="pd-header-actions">
            <a className="pd-login" href="#contact">Log in</a>
            <a className="pd-header-cta" href="#contact">Request a demo <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <div className="pd-shell">
        <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
          <a href="#top">Home</a><span>/</span><a href="#related">Products</a><span>/</span><span aria-current="page">Core HRMS</span>
        </nav>

        <section className="pd-hero" id="suite" aria-labelledby="pd-title">
          <div className="pd-visual-wrap">
            <div className="pd-photo">
              <img
                src="/__mockup/images/peoplehub-product-detail-hr-team.jpg"
                alt="Two colleagues reviewing a people-operations workspace together"
              />
              <div className="pd-photo-shade" />
              <div className="pd-concept-tag"><span /> Product direction preview</div>
              <div className="pd-dashboard" aria-label="Illustrative employee workspace preview">
                <div className="pd-dashboard-top">
                  <span className="pd-mini-brand"><span className="pd-mini-mark"><Users size={11} aria-hidden="true" /></span>PeopleHub</span>
                  <span className="pd-preview-badge">Illustrative</span>
                </div>
                <div className="pd-dashboard-title">
                  <span>PEOPLE WORKSPACE</span>
                  <strong>Employee directory</strong>
                  <small>One considered view for your team</small>
                </div>
                <div className="pd-search"><Search size={12} aria-hidden="true" /> Search people or roles</div>
                <div className="pd-person-row">
                  <span className="pd-initials">AS</span>
                  <span><strong>People record</strong><small>Operations · Noida</small></span>
                  <span className="pd-status"><i /> Organised</span>
                </div>
                <div className="pd-person-row">
                  <span className="pd-initials pd-initials--mint">HR</span>
                  <span><strong>Team structure</strong><small>People &amp; culture</small></span>
                  <span className="pd-status"><i /> In view</span>
                </div>
                <div className="pd-dashboard-note"><ShieldCheck size={12} aria-hidden="true" /> Concept only · no live employee data</div>
              </div>
            </div>
            <div className="pd-visual-caption"><span>CORE HRMS</span><span>Connected people records</span></div>
          </div>

          <div className="pd-hero-copy">
            <div className="pd-kicker"><span className="pd-kicker-line" /> PLANNED PRODUCT SUITE <span className="pd-kicker-dot">·</span> CORE HRMS</div>
            <h1 id="pd-title">Keep every employee record in a <em>clearer place.</em></h1>
            <p className="pd-lede">A considered foundation for employee information, team structure and the moments that shape a person’s time at work.</p>
            <div className="pd-hero-buttons">
              <a className="pd-button-primary" href="#contact">Discuss your product fit <ArrowRight size={17} aria-hidden="true" /></a>
              <a className="pd-button-text" href="#modules">Explore the suite <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="pd-hero-footnote">
              <BadgeCheck size={16} aria-hidden="true" />
              <span>Product screens are illustrative previews of planned functionality—not a live HRMS.</span>
            </div>
            <div className="pd-hero-points">
              <span><Check size={13} aria-hidden="true" /> Employee lifecycle</span>
              <span><Check size={13} aria-hidden="true" /> Organisation structure</span>
              <span><Check size={13} aria-hidden="true" /> Document context</span>
            </div>
          </div>
        </section>
      </div>

      <section className="pd-story-section" id="overview">
        <div className="pd-shell pd-story-grid">
          <div className="pd-story-heading">
            <span className="pd-eyebrow">THE WORK BEHIND THE RECORD</span>
            <h2>Less time rebuilding context.<br /><em>More room for people.</em></h2>
          </div>
          <div className="pd-story-copy">
            <p>Employee details often travel between forms, folders and inboxes. Core HRMS is designed to bring those pieces into a more coherent people workspace—so a team can find the right context without starting from scratch.</p>
            <p>Start with the information your organisation needs today. Build a clearer structure around it. Keep each milestone connected as the team grows.</p>
            <a href="#modules" className="pd-inline-link">See what the suite is designed to cover <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section className="pd-shell pd-module-section" id="modules">
        <div className="pd-section-heading">
          <div>
            <span className="pd-eyebrow">A CONNECTED FOUNDATION</span>
            <h2>Built around the <em>real rhythm of HR.</em></h2>
          </div>
          <p>Bring the everyday building blocks of people operations into a flow that feels easier to follow—not another layer of busywork.</p>
        </div>

        <div className="pd-modules">
          <article className="pd-module-feature">
            <div className="pd-feature-topline"><span className="pd-feature-icon"><Users size={19} aria-hidden="true" /></span><span>THE EMPLOYEE RECORD</span></div>
            <h3>One place to understand the whole person at work.</h3>
            <p>Keep profile details, employment documents, role context and key milestones connected. Give the people team a calmer starting point for the work that follows.</p>
            <div className="pd-record-preview">
              <div className="pd-record-heading"><span className="pd-record-avatar">PH</span><span><strong>Employee profile</strong><small>Illustrative workspace · no real records</small></span><ArrowUpRight size={16} aria-hidden="true" /></div>
              <div className="pd-record-fields">
                <span><small>WORK AREA</small><strong>People operations</strong></span>
                <span><small>TEAM CONTEXT</small><strong>Team structure</strong></span>
                <span><small>NEXT MILESTONE</small><strong>Role review</strong></span>
              </div>
              <div className="pd-record-progress"><span /><span /><span /><span /></div>
            </div>
            <div className="pd-module-tags"><span>Employee profile</span><span>Documents</span><span>Milestones</span></div>
          </article>
          <div className="pd-module-list">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article className="pd-module-row" key={module.number}>
                  <span className="pd-module-number">{module.number}</span>
                  <span className="pd-module-icon"><Icon size={18} aria-hidden="true" /></span>
                  <div className="pd-module-text">
                    <h3>{module.title}</h3>
                    <p>{module.body}</p>
                    <div className="pd-module-tags">{module.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </div>
                  <ChevronRight className="pd-module-arrow" size={16} aria-hidden="true" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pd-journey-section">
        <div className="pd-shell">
          <div className="pd-section-heading pd-section-heading--journey">
            <div><span className="pd-eyebrow">FROM FIRST DAY TO WHAT’S NEXT</span><h2>Keep the journey <em>in view.</em></h2></div>
            <p>Employee data matters most when it supports a real moment. Map the work from first welcome to the next change in role or team.</p>
          </div>
          <ol className="pd-journey">
            {journey.map((item, index) => (
              <li className={index === 0 ? 'pd-journey-item pd-journey-item--active' : 'pd-journey-item'} key={item.step}>
                <div className="pd-journey-marker"><span>{item.step}</span><i /></div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="pd-journey-note"><ClipboardCheck size={17} aria-hidden="true" /><span>Keep ownership and decision-making with your people team; the software supports the process.</span></div>
        </div>
      </section>

      <section className="pd-shell pd-related" id="related">
        <div className="pd-related-copy">
          <span className="pd-eyebrow">DESIGNED TO CONNECT</span>
          <h2>People work rarely sits in <em>one suite.</em></h2>
          <p>Core HRMS is part of a broader product direction. Explore the areas that may matter next to your team’s day-to-day work.</p>
          <a className="pd-button-text" href="#contact">Talk through your priorities <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
        <div className="pd-related-stack">
          <a href="#modules" className="pd-related-card"><span className="pd-related-symbol pd-related-symbol--cyan"><CalendarDays size={19} aria-hidden="true" /></span><span><small>TIME &amp; WORKFORCE</small><strong>Plan the shape of every working day.</strong></span><ArrowUpRight size={17} aria-hidden="true" /></a>
          <a href="#modules" className="pd-related-card"><span className="pd-related-symbol pd-related-symbol--pink"><FileText size={19} aria-hidden="true" /></span><span><small>PAYROLL &amp; COMPLIANCE</small><strong>Bring reviews and records into view.</strong></span><ArrowUpRight size={17} aria-hidden="true" /></a>
          <div className="pd-related-disclaimer"><ShieldCheck size={15} aria-hidden="true" /><span>These suite previews describe planned product direction and do not represent live software capability.</span></div>
        </div>
      </section>

      <section className="pd-question-section" id="questions">
        <div className="pd-shell pd-question-grid">
          <div><span className="pd-eyebrow">A FEW USEFUL DETAILS</span><h2>Good questions, <em>clear answers.</em></h2><p>Before choosing a people platform, it helps to know what is available now and what is still being planned.</p></div>
          <div className="pd-questions">
            <details><summary>Is Core HRMS available today?<span>+</span></summary><p>Core HRMS is a planned suite. The interface shown on this page is illustrative and does not process employee data or transactions.</p></details>
            <details><summary>Can we choose only the areas we need?<span>+</span></summary><p>PeopleHub is designed around a modular product direction. Our team can discuss your priorities and the current service options.</p></details>
            <details><summary>Does software replace HR or statutory expertise?<span>+</span></summary><p>No. Software can help organise information and workflows, while people decisions and statutory responsibilities remain with the organisation and its qualified advisors.</p></details>
          </div>
        </div>
      </section>

      <section className="pd-shell pd-contact" id="contact">
        <div className="pd-contact-card">
          <div className="pd-contact-orbit" aria-hidden="true" />
          <div className="pd-contact-copy"><span className="pd-eyebrow">A CLEAR NEXT STEP</span><h2>Start with the work in front of you.</h2><p>Tell us what your people team is trying to make easier. We’ll help you explore the right next conversation.</p></div>
          <a className="pd-button-primary" href="/request-demo">Talk to our team <ArrowRight size={17} aria-hidden="true" /></a>
          <span className="pd-contact-note"><BadgeCheck size={15} aria-hidden="true" /> No commitment. Just a useful first conversation.</span>
        </div>
      </section>

      <footer className="pd-footer">
        <div className="pd-shell pd-footer-inner">
          <a className="pd-brand" href="#top"><span className="pd-brand-mark"><Users size={18} aria-hidden="true" /></span><span>People<span>Hub</span></span></a>
          <p>People-first work, with a clearer place to begin.</p>
          <nav aria-label="Footer navigation"><a href="#suite">Products</a><a href="#related">Services</a><a href="#questions">FAQs</a><a href="#contact">Request a demo</a></nav>
          <span className="pd-copyright">© PeopleHub · Product direction preview</span>
        </div>
      </footer>
    </main>
  );
}
