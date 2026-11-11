import {
  ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, Check, ClipboardList, FileText,
  HeartHandshake, ShieldCheck, UserRoundCheck, Users,
} from 'lucide-react';
import './service-detail.css';

const serviceAreas = [
  {
    id: 'people-ops',
    eyebrow: 'PEOPLE OPERATIONS',
    title: 'Make the everyday easier to hold.',
    body: 'Bring the repeatable work—records, employee letters, joining coordination and team requests—into a service scope your people can understand.',
    icon: Briefcase,
    className: 'sd-area-card--large',
  },
  {
    id: 'payroll',
    eyebrow: 'PAYROLL ADMINISTRATION',
    title: 'Keep the inputs and hand-offs visible.',
    body: 'Coordinate payroll information, review points and documentation around the people already responsible for each step.',
    icon: FileText,
    className: '',
  },
  {
    id: 'compliance',
    eyebrow: 'COMPLIANCE COORDINATION',
    title: 'Make responsibilities easier to follow.',
    body: 'Organise documentation and due-date coordination with qualified advisors where statutory guidance is required.',
    icon: ShieldCheck,
    className: '',
  },
];

const stages = [
  { id: '01', label: 'Listen', title: 'Understand the current setup', body: 'Start with your team, locations, processes and the work that takes too much attention.' },
  { id: '02', label: 'Shape', title: 'Agree a practical scope', body: 'Clarify who owns each decision, which tasks can be supported and what sits outside the engagement.' },
  { id: '03', label: 'Work together', title: 'Keep communication open', body: 'Use clear points of contact, shared priorities and regular check-ins to keep the service useful.' },
];

export function ServiceDetail() {
  return (
    <main className="ph-service-detail" id="top">
      <header className="sd-header">
        <div className="sd-header-inner">
          <a className="sd-brand" href="#top" aria-label="PeopleHub home">
            <span className="sd-brand-mark"><Users size={18} aria-hidden="true" /></span>
            <span>People<span>Hub</span></span>
          </a>
          <nav className="sd-nav" aria-label="Main navigation">
            <a href="#related">Products</a>
            <a className="is-active" href="#service">Services</a>
            <a href="#questions">Resources</a>
            <a href="#contact">Company</a>
          </nav>
          <a className="sd-header-cta" href="#contact">Talk to our team <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </header>

      <div className="sd-shell">
        <nav className="sd-breadcrumbs" aria-label="Breadcrumb">
          <a href="#top">Home</a><span>/</span><a href="#related">Services</a><span>/</span><span aria-current="page">HR Outsourcing</span>
        </nav>

        <section className="sd-hero" id="service" aria-labelledby="sd-title">
          <div className="sd-visual-wrap">
            <div className="sd-photo">
              <img
                src="/__mockup/images/peoplehub-service-detail-consultation.jpg"
                alt="An HR consultant listening to a growing business team around a table"
              />
              <div className="sd-photo-shade" />
              <div className="sd-photo-badge"><HeartHandshake size={15} aria-hidden="true" /><span>PeopleHub, alongside your team</span></div>
              <div className="sd-photo-caption">
                <span className="sd-caption-mark"><UserRoundCheck size={17} aria-hidden="true" /></span>
                <span><small>A PRACTICAL PARTNERSHIP</small><strong>Support that fits your way of working.</strong></span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
            </div>
            <div className="sd-visual-caption"><span>HR OUTSOURCING</span><span>People-led support · scoped to your needs</span></div>
          </div>

          <div className="sd-hero-copy">
            <div className="sd-kicker"><span className="sd-kicker-line" /> PEOPLE SERVICES <span className="sd-kicker-dot">·</span> HR OUTSOURCING</div>
            <h1 id="sd-title">A people partner for the work <em>behind the work.</em></h1>
            <p className="sd-lede">Give your in-house team room to focus. We can help coordinate the recurring HR operations that keep a growing organisation moving.</p>
            <div className="sd-hero-buttons">
              <a className="sd-button-primary" href="#contact">Shape a service scope <ArrowRight size={17} aria-hidden="true" /></a>
              <a className="sd-button-text" href="#delivery">How we work <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="sd-hero-points">
              <span><Check size={13} aria-hidden="true" /> Clear service boundaries</span>
              <span><Check size={13} aria-hidden="true" /> A named point of contact</span>
              <span><Check size={13} aria-hidden="true" /> Your decisions stay yours</span>
            </div>
            <div className="sd-hero-note"><ShieldCheck size={16} aria-hidden="true" /><span>Scope, delivery and pricing are agreed with each organisation. Specialist legal and statutory advice remains with qualified professionals.</span></div>
          </div>
        </section>

        <section className="sd-principle" id="overview">
          <div className="sd-shell sd-principle-grid">
            <div><span className="sd-eyebrow">A PARTNERSHIP, NOT A HAND-OFF</span><h2>More support for your team.<br /><em>Not less ownership.</em></h2></div>
            <div className="sd-principle-copy">
              <p>Good HR support begins with listening. We work to understand what your internal team already does well, where coordination feels heavy and what kind of help would actually make a difference.</p>
              <p>From there, we define a service boundary together. Your leaders keep the decisions; our role is to provide the agreed operational support and a clearer rhythm for the work.</p>
            </div>
          </div>
        </section>

        <section className="sd-shell sd-areas" id="areas">
          <div className="sd-section-heading">
            <div><span className="sd-eyebrow">SUPPORT THAT MEETS THE MOMENT</span><h2>Pick up the work <em>that needs a hand.</em></h2></div>
            <p>Start with one area or combine a few. The right scope depends on your team, existing systems and the responsibilities you want to keep in-house.</p>
          </div>
          <div className="sd-area-grid">
            {serviceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <article className={`sd-area-card ${area.className}`} key={area.id}>
                  <div className="sd-area-topline"><span className="sd-area-icon"><Icon size={18} aria-hidden="true" /></span><span>{area.eyebrow}</span></div>
                  <h3>{area.title}</h3>
                  <p>{area.body}</p>
                  <a href="#contact" aria-label={`Discuss ${area.eyebrow.toLowerCase()}`}><span>Discuss this area</span><ArrowRight size={15} aria-hidden="true" /></a>
                </article>
              );
            })}
            <aside className="sd-scope-card">
              <span className="sd-scope-stamp"><ClipboardList size={18} aria-hidden="true" /></span>
              <span className="sd-eyebrow">BUILT AROUND YOUR CONTEXT</span>
              <h3>Every engagement begins with a conversation.</h3>
              <p>We’ll map your current process, key hand-offs, locations and internal owners before suggesting a scope.</p>
              <ul><li><Check size={13} aria-hidden="true" /> Current workflow</li><li><Check size={13} aria-hidden="true" /> Team responsibilities</li><li><Check size={13} aria-hidden="true" /> A workable next step</li></ul>
            </aside>
          </div>
        </section>

        <section className="sd-delivery-section" id="delivery">
          <div className="sd-shell">
            <div className="sd-section-heading sd-section-heading--delivery">
              <div><span className="sd-eyebrow">HOW WE GET STARTED</span><h2>Thoughtful from <em>the first conversation.</em></h2></div>
              <p>No one-size-fits-all playbook. We make the first steps clear, then adapt the working rhythm to the scope you agree.</p>
            </div>
            <ol className="sd-stages">
              {stages.map((stage) => (
                <li key={stage.id} className="sd-stage">
                  <div className="sd-stage-top"><span>{stage.id}</span><i /></div>
                  <small>{stage.label}</small>
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                </li>
              ))}
            </ol>
            <div className="sd-stage-footnote"><BadgeCheck size={16} aria-hidden="true" /><span>Service terms, ownership, timelines and fees are confirmed before work begins.</span></div>
          </div>
        </section>

        <section className="sd-shell sd-related" id="related">
          <div className="sd-related-heading"><span className="sd-eyebrow">MORE WAYS TO WORK TOGETHER</span><h2>Find the support that <em>fits.</em></h2><p>Explore adjacent services when your team needs a different kind of expertise.</p></div>
          <div className="sd-related-list">
            <a href="#areas"><span className="sd-related-icon sd-related-icon--blue"><ShieldCheck size={18} aria-hidden="true" /></span><span><small>POSH MANAGEMENT</small><strong>Clear process support for workplace conduct.</strong></span><ArrowUpRight size={16} aria-hidden="true" /></a>
            <a href="#areas"><span className="sd-related-icon sd-related-icon--pink"><Users size={18} aria-hidden="true" /></span><span><small>RECRUITMENT OUTSOURCING</small><strong>More coordination across the hiring journey.</strong></span><ArrowUpRight size={16} aria-hidden="true" /></a>
            <a href="#areas"><span className="sd-related-icon sd-related-icon--mint"><FileText size={18} aria-hidden="true" /></span><span><small>BACKGROUND VERIFICATION</small><strong>Support for the checks your process requires.</strong></span><ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="sd-question-section" id="questions">
          <div className="sd-shell sd-question-grid">
            <div><span className="sd-eyebrow">BEFORE WE BEGIN</span><h2>Start with <em>the right questions.</em></h2><p>Every organisation has a different mix of people, locations and existing processes. Here are a few useful places to begin.</p></div>
            <div className="sd-questions">
              <details><summary>Can we choose only one area of support?<span>+</span></summary><p>Yes. Scope can be discussed around a single recurring responsibility or a wider set of operational tasks. The agreement should make ownership and limits clear.</p></details>
              <details><summary>Will our internal HR team remain involved?<span>+</span></summary><p>Absolutely. Your team knows the organisation and remains responsible for its decisions. Support is designed to complement—not replace—the people already doing the work.</p></details>
              <details><summary>Does HR outsourcing replace legal or statutory advice?<span>+</span></summary><p>No. Operational support can help coordinate information and processes, but legal interpretations and statutory obligations require the appropriate qualified professionals.</p></details>
            </div>
          </div>
        </section>

        <section className="sd-shell sd-contact" id="contact">
          <div className="sd-contact-card">
            <div className="sd-contact-content"><span className="sd-eyebrow">LET’S MAKE THE SCOPE CLEAR</span><h2>Bring us the work you’d like to make lighter.</h2><p>Share what your people team is juggling. We’ll talk through the context, responsibilities and possible next steps—without a pre-set package.</p></div>
            <div className="sd-contact-actions">
              <a className="sd-button-primary" href="tel:+919311638356">Call +91 93116 38356 <ArrowRight size={16} aria-hidden="true" /></a>
              <span><BadgeCheck size={14} aria-hidden="true" /> A direct conversation with our team</span>
            </div>
            <div className="sd-contact-decoration" aria-hidden="true"><HeartHandshake size={118} strokeWidth={.7} /></div>
          </div>
        </section>

        <footer className="sd-footer">
          <div className="sd-shell sd-footer-inner">
            <a className="sd-brand" href="#top"><span className="sd-brand-mark"><Users size={18} aria-hidden="true" /></span><span>People<span>Hub</span></span></a>
            <p>People-first support for the work behind the work.</p>
            <nav aria-label="Footer navigation"><a href="#areas">Services</a><a href="#related">More services</a><a href="#questions">FAQs</a><a href="#contact">Talk to us</a></nav>
            <span className="sd-copyright">© PeopleHub · Service overview</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
