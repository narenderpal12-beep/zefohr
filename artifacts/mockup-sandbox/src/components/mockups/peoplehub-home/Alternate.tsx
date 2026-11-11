import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lottie } from "lottie-react";

const orbitTransform = (p: number[]) => ({
  o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: p },
  a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
});
const peopleOrbitAnimation = {
  v: "5.7.4", fr: 30, ip: 0, op: 180, w: 240, h: 240, nm: "People orbit", ddd: 0, assets: [],
  layers: [0, 1, 2].map((n) => ({
    ddd: 0, ind: n + 1, ty: 4, nm: `People orbit ${n + 1}`, sr: 1,
    ks: { ...orbitTransform([120, 120, 0]), r: { a: 1, k: [{ t: 0, s: [n * 120], e: [n * 120 + 360], i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } }, { t: 180, s: [n * 120 + 360] }] } },
    ao: 0, ip: 0, op: 180, st: 0, bm: 0,
    shapes: [{ ty: "gr", it: [
      { ty: "el", p: { a: 0, k: [76, 0] }, s: { a: 0, k: [30, 30] }, nm: "People dot" },
      { ty: "fl", c: { a: 0, k: n === 0 ? [0.55, 0.36, 0.96, 1] : n === 1 ? [0.13, 0.83, 0.93, 1] : [0.93, 0.28, 0.6, 1] }, o: { a: 0, k: 100 }, r: 1 },
      { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ] }],
  })),
};

const products = [
  {
    key: "core-hrms",
    number: "01",
    name: "Core HRMS",
    short: "People records, lifecycle and onboarding.",
    description: "Bring core HRMS together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Directory", "Onboarding", "Documents"],
  },
  {
    key: "time",
    number: "02",
    name: "Time & Workforce Management",
    short: "Attendance, shifts and leave.",
    description: "Bring time & workforce management together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Attendance", "Leave", "Shifts"],
  },
  {
    key: "payroll",
    number: "03",
    name: "Payroll & Compliance",
    short: "Pay runs, reviews and records.",
    description: "Bring payroll & compliance together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Pay runs", "Statutory", "Reports"],
  },
  {
    key: "recruitment",
    number: "04",
    name: "Recruitment & ATS",
    short: "Roles, candidates and hiring.",
    description: "Bring recruitment & ATS together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Open roles", "Candidates", "Growth"],
  },
  {
    key: "performance",
    number: "05",
    name: "Performance & Talent Management",
    short: "Goals, feedback and growth.",
    description: "Bring performance & talent management together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Goals", "Reviews", "Talent"],
  },
  {
    key: "engagement",
    number: "06",
    name: "Employee Engagement",
    short: "Listening, recognition and support.",
    description: "Bring employee engagement together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Pulse", "Recognition", "Helpdesk"],
  },
  {
    key: "learning",
    number: "07",
    name: "Learning & Development",
    short: "Courses and development paths.",
    description: "Bring learning & development together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Learning paths", "Courses", "Skills"],
  },
  {
    key: "operations",
    number: "08",
    name: "HR Administration & Operations",
    short: "Workplace services and requests.",
    description: "Bring HR administration & operations together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Assets", "Requests", "Workplace"],
  },
  {
    key: "governance",
    number: "09",
    name: "Governance & Specialised Compliance",
    short: "Policies, records and reviews.",
    description: "Bring governance & specialised compliance together in one connected workspace, built for the way Indian businesses work.",
    nav: ["Policies", "Reviews", "Records"],
  },
  {
    key: "extended-services",
    number: "10",
    name: "Extended HR Services",
    short: "Specialist support for people teams.",
    description: "Explore specialist HR services alongside planned software, with scope shaped around your organisation’s needs.",
    nav: ["HR support", "Recruitment", "Compliance"],
  },
];
const heroProducts = products.slice(0, 4);
const extendedPreviews: { stats: [string, string, string][]; progressLabel: string; progress: number; rows: [string, string][] }[] = [
  { stats: [["GOALS IN CYCLE", "184 active", "Across 6 teams"], ["CHECK-INS", "72%", "Review cycle completion"]], progressLabel: "Review cycle progress", progress: 72, rows: [["Goal check-ins", "In progress"], ["Feedback requests", "86% received"], ["Talent review", "3 teams scheduled"]] },
  { stats: [["PULSE RESPONSE", "81.4%", "Current listening cycle"], ["FEEDBACK ITEMS", "36", "For team review"]], progressLabel: "Pulse response", progress: 81, rows: [["Team sentiment", "Illustrative trend"], ["Recognition notes", "14 this week"], ["Helpdesk queue", "8 to review"]] },
  { stats: [["LEARNING PATHS", "24", "Across 5 groups"], ["COURSE PROGRESS", "68%", "Current quarter"]], progressLabel: "Learning progress", progress: 68, rows: [["Safety essentials", "68% complete"], ["Manager toolkit", "In progress"], ["Certifications", "12 due soon"]] },
  { stats: [["ASSET REGISTER", "246", "Illustrative assigned items"], ["WORKPLACE REQUESTS", "18", "4 need review"]], progressLabel: "Request review", progress: 78, rows: [["Device allocation", "Ready to review"], ["Visitor access", "6 upcoming"], ["Transport requests", "12 scheduled"]] },
  { stats: [["POLICY ACKNOWLEDGEMENTS", "92.1%", "Current review cycle"], ["REVIEWS", "7", "In progress"]], progressLabel: "Policy review", progress: 92, rows: [["Policy notices", "2 pending"], ["Audit records", "Ready to review"], ["Governance tasks", "5 open"]] },
  { stats: [["SUPPORT WORKSTREAMS", "6", "Illustrative services"], ["REQUESTS", "12", "For team discussion"]], progressLabel: "Workstream overview", progress: 60, rows: [["Recruitment support", "Scope discussion"], ["Compliance support", "Specialist review"], ["HR operations", "In conversation"]] },
];

const services = [
  ["HR outsourcing", "Extra hands for the people work that keeps a business moving."],
  ["Recruitment support", "Specialist support to help you find and bring in the right people."],
  ["Compliance support", "Practical guidance for your organisation’s compliance needs."],
  ["Employer of Record", "Explore employment support for teams working across boundaries."],
  ["Background verification", "Checks and coordination to support more informed hiring."],
  ["Learning & development", "Build skills and capability with specialist support."],
];

const faqs = [
  ["Can I use the HRMS suites today?", "Not yet. The product snapshots on this page are illustrative previews of planned HRMS suites, not operational features. You can create an organisation and start a free trial; our team can share the current availability and next steps."],
  ["What can I do when I start a trial?", "Create an organisation and explore the current signup journey. The broader HRMS suites are planned; a preview here should not be treated as a live employee, payroll or attendance system."],
  ["Can I get help with compliance or HR operations now?", "PeopleHub offers specialist services including HR outsourcing, recruitment, EOR, background verification and compliance support. Tell us what you need and the team can discuss scope."],
  ["Do I need to buy every module?", "PeopleHub is designed to be modular. The planned suites can be explored individually, and the right scope can be discussed with our team."],
  ["Does PeopleHub guarantee statutory compliance?", "No software or general information can determine every organisation’s obligations. Requirements depend on your circumstances and applicable law; speak with a qualified specialist about your situation."],
];

function Mark() {
  return <span className="ph-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><circle cx="13" cy="12" r="5" /><circle cx="25" cy="14" r="4" opacity=".7" /><path d="M5 30c1-6 4-9 8-9s7 3 8 9M20 24c1.3-1.8 3.1-2.7 5-2.7 3.1 0 5.1 2.5 6 7.7" /></svg></span>;
}

function Arrow() {
  return <svg className="ph-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10h12m-5-5 5 5-5 5" /></svg>;
}

function ProductSnapshot({ active }: { active: number }) {
  const product = products[active] ?? products[0];
  const dashboardTitles = ["People overview", "Attendance overview", "Payroll overview", "Hiring pipeline", "Talent review", "Engagement pulse", "Learning dashboard", "Workplace operations", "Governance overview", "Service workstreams"];
  const dashboardActions = ["Add person", "Review attendance", "Review run", "Add role", "Open review", "View pulse", "Explore courses", "View requests", "Review policies", "View services"];
  const extendedPreview = extendedPreviews[active - 4] ?? extendedPreviews[0];
  const rows = [
    ["Aarav Mehta", "People & Culture", "Active"],
    ["Nisha Kapoor", "Operations", "Onboarding"],
    ["Kabir Rao", "Finance", "Active"],
  ];
  return (
    <div key={product.key} className={`ph-window ph-dashboard-screen ph-dashboard-${product.key}`} role="group" aria-label={`Illustrative ${product.name} dashboard`}>
      <div className="ph-window-top">
        <div className="ph-window-brand"><Mark /><span>PeopleHub <i>preview</i></span></div>
        <span className="ph-avatar">AM</span>
      </div>
      <div className="ph-window-body">
        <aside className="ph-window-side">
          <span className="ph-side-label">WORKSPACE</span>
          {product.nav.map((item, i) => <div className={`ph-side-item ${i === 0 ? "selected" : ""}`} key={item}><b>{["▦", "◷", "⌁"][i]}</b>{item}</div>)}
          <div className="ph-side-rule" />
          <div className="ph-side-item muted"><b>⚙</b>Settings</div>
        </aside>
        <div className="ph-window-content">
          <div className="ph-mock-breadcrumb">Workspace <span>/</span> {product.name}</div>
          <div className="ph-mock-heading"><div><h3>{dashboardTitles[active] ?? dashboardTitles[0]}</h3><p>Illustrative workspace concept</p></div><span className="ph-mock-button">＋ {dashboardActions[active] ?? "View details"}</span></div>
          {active === 0 ? (
            <>
              <div className="ph-mock-stats">
                <div><small>PEOPLE DIRECTORY</small><strong>1,248 team members</strong><span>Across 8 departments</span></div>
                <div><small>ONBOARDING</small><strong>28 in progress</strong><span>Next start date · 18 Nov</span></div>
              </div>
              <div className="ph-table-head"><span>TEAM MEMBER</span><span>TEAM</span><span>STATUS</span></div>
              {rows.map((row, i) => <div className="ph-table-row" key={row[0]}><span className="ph-person"><b className={`ph-initial i${i}`}>{["AM", "NK", "KR"][i]}</b>{row[0]}</span><span>{row[1]}</span><span><i className={i === 1 ? "pending" : ""} />{i === 1 ? "Onboarding" : row[2]}</span></div>)}
            </>
          ) : active === 1 ? (
            <>
              <div className="ph-mock-stats">
                <div><small>ATTENDANCE TODAY</small><strong>93.8%</strong><span>Across all locations</span></div>
                <div><small>SHIFT COVERAGE</small><strong>12 open shifts</strong><span>3 need attention</span></div>
              </div>
              <div className="ph-attendance-chart" aria-label="Illustrative weekly attendance trend">
                {[["M", 48], ["T", 67], ["W", 58], ["T", 82], ["F", 72], ["S", 36], ["S", 23]].map(([day, height], i) => <div className="ph-attendance-day" key={`${day}-${i}`}><span className="ph-attendance-track"><i style={{ height: `${height}%` }} /></span><small>{day}</small></div>)}
                <div className="ph-chart-summary"><b>Weekly attendance</b><span>+4.2% this week</span></div>
              </div>
              <div className="ph-dashboard-row"><span><b>Morning shift</b><small>Operations · 08:00–16:00</small></span><strong>84 / 90</strong></div>
            </>
          ) : active === 2 ? (
            <>
              <div className="ph-mock-stats">
                <div><small>PAY RUN OVERVIEW</small><strong>₹42,80,500</strong><span>Illustrative monthly total</span></div>
                <div><small>REVIEW STATUS</small><strong>3 of 4 steps</strong><span>One check remains</span></div>
              </div>
              <div className="ph-payroll-progress"><div><span>Payroll preparation</span><b>75%</b></div><i><span /></i></div>
              <div className="ph-check-row"><span><b>✓</b> Salary inputs reviewed</span><small>Ready</small></div>
              <div className="ph-check-row"><span><b>✓</b> Attendance inputs matched</span><small>Ready</small></div>
              <div className="ph-check-row pending"><span><b>•</b> Statutory details review</span><small>In progress</small></div>
            </>
          ) : active === 3 ? (
            <>
              <div className="ph-mock-stats">
                <div><small>OPEN ROLES</small><strong>16 positions</strong><span>Across 6 teams</span></div>
                <div><small>ACTIVE CANDIDATES</small><strong>248 profiles</strong><span>Illustrative pipeline</span></div>
              </div>
              <div className="ph-hiring-pipeline">{[["Applied", 126], ["Review", 58], ["Interview", 24], ["Offer", 8]].map(([stage, count]) => <div className="ph-hiring-stage" key={stage}><span>{stage}</span><b>{count}</b><i style={{ width: `${Number(count) / 1.26}%` }} /></div>)}</div>
              <div className="ph-dashboard-row"><span><b>Product Designer</b><small>4 candidates · 2 interviews this week</small></span><strong>View role →</strong></div>
            </>
          ) : (
            <>
              <div className="ph-mock-stats">
                {extendedPreview.stats.map(([label, value, note]) => <div key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></div>)}
              </div>
              <div className="ph-payroll-progress">
                <div><span>{extendedPreview.progressLabel}</span><b>{extendedPreview.progress}%</b></div>
                <i><span style={{ width: `${extendedPreview.progress}%` }} /></i>
              </div>
              {extendedPreview.rows.map(([label, status], index) => (
                <div className={`ph-check-row ${index === 2 ? "pending" : ""}`} key={label}>
                  <span><b>{index === 2 ? "•" : "✓"}</b>{label}</span><small>{status}</small>
                </div>
              ))}
            </>
          )}
          <div className="ph-preview-note"><span>PREVIEW CONCEPT</span> Illustrative only · Not an operational HRMS screen</div>
        </div>
      </div>
    </div>
  );
}

export function Alternate() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [activeDashboard, setActiveDashboard] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);
  useEffect(() => {
    if (rotationPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => setActiveDashboard((current) => (current + 1) % heroProducts.length), 6500);
    return () => window.clearInterval(timer);
  }, [rotationPaused, prefersReducedMotion]);
  const currentDashboard = heroProducts[activeDashboard] ?? heroProducts[0];
  return (
    <main className="peoplehub-alt">
      <style>{`
        .peoplehub-alt{--ink:#19283e;--muted:#657286;--line:#e5eaf0;--blue:#354fd0;--blue-dark:#273da9;--lime:#d9ef74;--paper:#fff;--wash:#f6f8fb;--serif:Georgia,'Times New Roman',serif;color:var(--ink);background:#fff;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;overflow:hidden}
        .peoplehub-alt *{box-sizing:border-box}.peoplehub-alt a{color:inherit;text-decoration:none}.peoplehub-alt button{font:inherit;color:inherit}.ph-container{width:min(1180px,calc(100% - 48px));margin:0 auto}
        .ph-topline{height:5px;background:linear-gradient(90deg,#364fd1 0 22%,#cedf63 22% 34%,#fff 34% 100%)}
        .ph-header{height:82px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;background:#fff;position:relative;z-index:5}.ph-nav{display:flex;align-items:center;justify-content:space-between}.ph-brand{display:flex;align-items:center;gap:10px;font-size:21px;font-weight:760;letter-spacing:-1.1px}.ph-mark{height:36px;width:36px;border-radius:11px;background:linear-gradient(145deg,#3d57dc,#735fe1);display:grid;place-items:center;flex:none}.ph-mark svg{width:24px;height:24px;fill:#fff;stroke:#fff;stroke-width:2;stroke-linecap:round}.ph-navlinks{display:flex;align-items:center;gap:32px;font-size:13px;color:#4f5c70}.ph-navlinks a:hover,.ph-login:hover{color:var(--blue)}.ph-nav-actions{display:flex;align-items:center;gap:22px;font-size:13px;font-weight:650}.ph-button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:46px;padding:0 20px;background:var(--blue);color:white!important;border:1px solid var(--blue);border-radius:6px;font-size:13px;font-weight:700;transition:transform .2s,background .2s,box-shadow .2s}.ph-button:hover{background:var(--blue-dark);transform:translateY(-2px);box-shadow:0 8px 18px #334bd32b}.ph-button .ph-arrow{stroke:white}.ph-arrow{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.ph-menu-toggle{display:none;background:none;border:0;padding:8px}
        .ph-hero{padding:78px 0 64px;position:relative}.ph-hero-grid{display:grid;grid-template-columns:.91fr 1.09fr;gap:56px;align-items:center}.ph-kicker{font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:var(--blue);display:flex;align-items:center;gap:10px}.ph-kicker:before{content:"";width:24px;height:1px;background:var(--blue)}.ph-hero h1{font-family:var(--serif);font-weight:400;letter-spacing:-2.6px;font-size:clamp(46px,5.4vw,72px);line-height:1.02;margin:23px 0 22px;max-width:570px}.ph-hero h1 em{font-style:italic;color:var(--blue)}.ph-hero-copy{max-width:470px;color:#5c6b80;font-size:16px;line-height:1.8}.ph-hero-actions{display:flex;align-items:center;gap:24px;margin-top:30px}.ph-text-link{font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px}.ph-text-link:hover{color:var(--blue)}.ph-text-link:hover .ph-arrow{transform:translateX(3px)}.ph-arrow{transition:transform .2s}.ph-current-note{margin-top:26px;padding:13px 0 0;border-top:1px solid var(--line);display:flex;gap:10px;align-items:flex-start;color:#596679;font-size:11px;max-width:440px}.ph-status-dot{width:7px;height:7px;margin-top:5px;border-radius:50%;background:#7b9d50;flex:none}.ph-current-note strong{color:var(--ink)}
        .ph-hero-visual{position:relative;min-width:0}.ph-visual-caption{display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:.9px;text-transform:uppercase;color:#788397;margin-bottom:11px}.ph-visual-caption span:last-child{font-size:9px;color:#8792a1;letter-spacing:.5px}
        .ph-window{border:1px solid #e3e8ee;border-radius:9px;background:#fff;box-shadow:0 22px 50px -34px #2637514d;overflow:hidden}.ph-window-top{height:52px;border-bottom:1px solid #edf0f3;display:flex;justify-content:space-between;align-items:center;padding:0 17px}.ph-window-brand{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700}.ph-window-brand .ph-mark{height:25px;width:25px;border-radius:7px}.ph-window-brand .ph-mark svg{width:17px;height:17px}.ph-window-brand i{font-style:normal;font-size:8px;letter-spacing:.4px;text-transform:uppercase;color:#778397;margin-left:4px;font-weight:600}.ph-avatar{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#eff0ff;color:#5148a8;font-size:9px;font-weight:700}.ph-window-body{display:grid;grid-template-columns:145px 1fr;min-height:300px}.ph-window-side{border-right:1px solid #edf0f3;padding:19px 10px;background:#fcfcfd}.ph-side-label{font-size:8px;color:#9aa3af;letter-spacing:1px;padding:0 8px}.ph-side-item{display:flex;align-items:center;gap:8px;padding:9px 8px;margin-top:6px;border-radius:5px;color:#667286;font-size:9px}.ph-side-item b{font-size:12px;color:#8b95a5;width:13px;text-align:center}.ph-side-item.selected{background:#edf0ff;color:#3548bb;font-weight:700}.ph-side-item.selected b{color:#4557c6}.ph-side-rule{border-top:1px solid #e7ebef;margin:20px 8px 10px}.ph-side-item.muted{font-size:9px}.ph-window-content{padding:20px 19px 12px;min-width:0}.ph-mock-breadcrumb{font-size:8px;color:#8b95a4}.ph-mock-breadcrumb span{padding:0 5px;color:#c2c8d0}.ph-mock-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:11px 0 17px}.ph-mock-heading h3{font-size:17px;letter-spacing:-.5px;margin:0;font-weight:700}.ph-mock-heading p{font-size:8px;color:#8b95a4;margin:3px 0 0}.ph-mock-button{background:#394fd0;color:#fff;border-radius:4px;font-size:8px;padding:7px 9px;white-space:nowrap}.ph-mock-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:15px}.ph-mock-stats div{border:1px solid #e9edf2;border-radius:5px;padding:10px}.ph-mock-stats small{display:block;font-size:7px;letter-spacing:.8px;color:#8994a3}.ph-mock-stats strong{display:block;margin-top:4px;font-size:10px}.ph-mock-stats span{font-size:8px;color:#8a95a4}.ph-table-head,.ph-table-row{display:grid;grid-template-columns:1.12fr 1fr .7fr;align-items:center;gap:7px}.ph-table-head{font-size:7px;letter-spacing:.7px;color:#98a1ae;border-bottom:1px solid #e8ecf0;padding:8px 4px}.ph-table-row{font-size:8px;color:#687588;padding:9px 4px;border-bottom:1px solid #f0f2f5}.ph-person{display:flex;align-items:center;gap:7px;color:#394558;font-weight:650;white-space:nowrap}.ph-initial{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:7px;color:#4650a6;background:#ebecff}.ph-initial.i1{background:#fcefe6;color:#9a6145}.ph-initial.i2{background:#e6f4ed;color:#477a5c}.ph-table-row>span:last-child{display:flex;align-items:center;gap:5px}.ph-table-row>span:last-child i{width:5px;height:5px;border-radius:50%;background:#78a969}.ph-table-row>span:last-child i.pending{background:#e3ad58}.ph-preview-note{display:flex;gap:7px;align-items:center;margin-top:11px;font-size:7px;color:#8893a1}.ph-preview-note span{color:#a37025;font-size:7px;font-weight:800;letter-spacing:.6px}
        .ph-dashboard-screen{animation:ph-dashboard-enter .36s ease both}.ph-dashboard-controls{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:14px}.ph-dashboard-copy{min-width:0}.ph-dashboard-copy strong{display:block;font-family:var(--serif);font-size:16px;font-weight:400}.ph-dashboard-copy p{margin:3px 0 0;color:#738095;font-size:10px}.ph-dashboard-tools{display:flex;align-items:center;gap:6px;flex:none}.ph-dashboard-control{height:30px;min-width:31px;border:1px solid #e1e6ec;border-radius:5px;background:#fff;color:#4e5b70;font-size:13px;cursor:pointer}.ph-dashboard-control:hover:not(:disabled){border-color:#aeb8d0;color:var(--blue)}.ph-dashboard-control:disabled{opacity:.45;cursor:not-allowed}.ph-dashboard-control.ph-play{min-width:46px;padding:0 7px;font-size:9px;font-weight:700}.ph-dashboard-dots{display:flex;align-items:center;gap:5px;margin-top:11px}.ph-dashboard-dot{height:6px;width:18px;padding:0;border:0;border-radius:9px;background:#dce1e8;cursor:pointer;transition:width .2s,background .2s}.ph-dashboard-dot[aria-selected=true]{width:29px;background:var(--blue)}.ph-dashboard-count{margin-left:auto;font-size:9px;color:#8390a1;font-variant-numeric:tabular-nums}.ph-dashboard-thumbnails{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:12px}.ph-dashboard-thumb{display:flex;min-width:0;flex-direction:column;gap:6px;padding:6px;border:1px solid #e1e6ec;border-radius:6px;background:#fff;text-align:left;cursor:pointer;transition:border-color .2s,box-shadow .2s}.ph-dashboard-thumb:hover{border-color:#aeb8d0}.ph-dashboard-thumb[aria-selected=true]{border-color:#435bd0;box-shadow:0 0 0 1px #435bd022}.ph-thumb-screen{height:36px;display:grid;grid-template-columns:15px 1fr;overflow:hidden;border:1px solid #edf0f3;border-radius:3px;background:#fff}.ph-thumb-sidebar{background:#f1f3fa;border-right:1px solid #edf0f3}.ph-thumb-main{display:grid;grid-template-columns:repeat(2,1fr);gap:3px;padding:4px}.ph-thumb-main i{border-radius:2px;background:#edf0f5}.ph-thumb-heading{grid-column:span 2;width:58%;height:3px;background:#465bd0!important}.ph-thumb-stat{height:8px}.ph-thumb-chart{grid-column:span 2;height:8px;background:linear-gradient(90deg,#e7eafb,#aab6ef)!important}.ph-thumb-time .ph-thumb-chart{background:repeating-linear-gradient(90deg,#7180dc 0 5px,#edf0fb 5px 9px)!important}.ph-thumb-payroll .ph-thumb-stat:first-of-type{background:#d9ef74!important}.ph-thumb-hiring .ph-thumb-chart{background:linear-gradient(90deg,#ced6fb,#566bda)!important}.ph-thumb-label{overflow:hidden;color:#748196;font-size:8px;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}.ph-dashboard-thumb[aria-selected=true] .ph-thumb-label{color:#354fd0;font-weight:700}.ph-dashboard-thumbnails .ph-dashboard-count{align-self:center}.ph-dashboard-tools .ph-dashboard-count{margin:0 5px 0 0;white-space:nowrap}.ph-dashboard-disclosure{margin:9px 0 0;color:#8a95a4;font-size:8px;line-height:1.5}.ph-attendance-chart{height:112px;display:grid;grid-template-columns:repeat(7,1fr);gap:7px;position:relative;padding:6px 4px 20px;border-bottom:1px solid #e9edf2}.ph-attendance-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;color:#8792a1;font-size:7px}.ph-attendance-track{height:68px;width:100%;display:flex;align-items:flex-end;overflow:hidden;border-radius:4px;background:#f2f4f9}.ph-attendance-track i{display:block;width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#7a83e8,#3e56d0)}.ph-attendance-day small{font-size:7px}.ph-chart-summary{position:absolute;top:2px;left:4px;right:4px;display:flex;justify-content:space-between;font-size:7px;color:#778397}.ph-chart-summary b{color:#4b5870}.ph-dashboard-row{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:10px 2px;border-bottom:1px solid #edf0f3;font-size:8px}.ph-dashboard-row span{display:flex;flex-direction:column;gap:2px;min-width:0}.ph-dashboard-row b{font-size:8px;color:#3d4a60}.ph-dashboard-row small{font-size:7px;color:#8792a1}.ph-dashboard-row strong{font-size:7px;color:#4d5f9c;white-space:nowrap}.ph-payroll-progress{padding:10px 2px 8px}.ph-payroll-progress>div{display:flex;justify-content:space-between;font-size:8px;color:#57647a}.ph-payroll-progress b{color:var(--blue)}.ph-payroll-progress>i{display:block;height:6px;margin-top:7px;border-radius:6px;background:#edf0f5;overflow:hidden}.ph-payroll-progress>i span{display:block;width:75%;height:100%;border-radius:6px;background:linear-gradient(90deg,#3d56d4,#93a0ef)}.ph-check-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid #edf0f3;font-size:8px;color:#536075}.ph-check-row span{display:flex;align-items:center;gap:7px}.ph-check-row b{display:grid;place-items:center;width:14px;height:14px;border-radius:50%;background:#e8f3eb;color:#4a8a5b;font-size:8px}.ph-check-row small{font-size:7px;color:#6c9876}.ph-check-row.pending b{background:#fbf1df;color:#b67e27}.ph-check-row.pending small{color:#a67c3e}.ph-hiring-pipeline{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:4px 0 7px}.ph-hiring-stage{position:relative;display:flex;flex-direction:column;gap:5px;padding:8px 7px 11px;border:1px solid #e9edf2;border-radius:5px;overflow:hidden}.ph-hiring-stage span{font-size:7px;color:#7e8a9b}.ph-hiring-stage b{font-size:11px;color:#3d4c65}.ph-hiring-stage i{position:absolute;bottom:0;left:0;height:3px;background:#5469d9;border-radius:0 3px 3px 0}.ph-dashboard-enter{animation:ph-dashboard-enter .36s ease both}@keyframes ph-dashboard-enter{from{opacity:.55;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .ph-reassure{border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.ph-reassure-inner{min-height:84px;display:grid;grid-template-columns:1.15fr 1fr 1fr 1fr;align-items:center;gap:24px}.ph-reassure-intro{font-family:var(--serif);font-size:19px;line-height:1.2}.ph-reassure-item{display:flex;gap:10px;align-items:center;color:#5d6a7e;font-size:11px}.ph-check{width:22px;height:22px;border-radius:50%;background:#f1f4de;color:#597135;display:grid;place-items:center;font-size:12px;flex:none}
        .ph-path{padding:105px 0 98px}.ph-section-head{display:flex;justify-content:space-between;gap:40px;align-items:flex-end}.ph-section-head h2{font-family:var(--serif);font-size:clamp(38px,4.5vw,57px);line-height:1.06;letter-spacing:-1.7px;font-weight:400;max-width:560px;margin:17px 0 0}.ph-section-intro{max-width:350px;color:#69768a;font-size:13px;line-height:1.8;margin-bottom:3px}.ph-path-steps{display:grid;grid-template-columns:repeat(3,1fr);margin-top:54px;border-top:1px solid var(--line)}.ph-step{padding:26px 30px 0 0;position:relative}.ph-step:not(:first-child){padding-left:28px;border-left:1px solid var(--line)}.ph-step-num{font-size:10px;letter-spacing:1px;color:var(--blue);font-weight:800}.ph-step h3{font-family:var(--serif);font-weight:400;font-size:25px;letter-spacing:-.4px;margin:15px 0 8px}.ph-step p{font-size:12px;line-height:1.8;color:#68758a;max-width:280px;margin:0 0 18px}.ph-step-link{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:var(--blue)}.ph-step-tag{position:absolute;right:26px;top:26px;border:1px solid #e3e8ed;border-radius:20px;padding:4px 8px;font-size:8px;color:#778396}
        .ph-explore{background:#f6f8fb;padding:95px 0 104px}.ph-explore-layout{display:grid;grid-template-columns:.78fr 1.22fr;gap:58px;align-items:start}.ph-explore-copy{position:sticky;top:30px}.ph-explore-copy h2{font-family:var(--serif);font-weight:400;letter-spacing:-1.4px;font-size:49px;line-height:1.07;margin:18px 0 16px}.ph-explore-copy>p{color:#67758a;font-size:13px;line-height:1.8;max-width:350px}.ph-plan-alert{border-left:2px solid #d5df65;padding:11px 14px;margin-top:26px;background:#fbfced;font-size:10px;line-height:1.7;color:#596247}.ph-plan-alert strong{display:block;color:#424c30;font-size:9px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px}.ph-tabs{display:flex;flex-direction:column;gap:5px;margin-top:36px}.ph-tab{border:1px solid transparent;background:transparent;border-radius:7px;padding:12px 13px;text-align:left;display:grid;grid-template-columns:29px 1fr 17px;align-items:center;gap:9px;cursor:pointer;transition:background .18s,border-color .18s}.ph-tab:hover{background:#fff}.ph-tab[aria-selected=true]{background:#fff;border-color:#e3e8ef;box-shadow:0 4px 14px #25334a0a}.ph-tab-no{font-size:9px;color:#8995a5}.ph-tab strong{display:block;font-size:12px}.ph-tab small{display:block;color:#828d9b;font-size:9px;margin-top:2px}.ph-tab-chevron{font-size:17px;color:#8894a4}.ph-product-panel{min-width:0}.ph-product-panel .ph-window{box-shadow:0 20px 45px -33px #25344e66}.ph-product-panel .ph-window-body{min-height:360px}.ph-product-detail{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-top:22px}.ph-product-detail h3{font-family:var(--serif);font-size:25px;font-weight:400;margin:0 0 7px}.ph-product-detail p{font-size:12px;color:#68768a;line-height:1.8;margin:0;max-width:420px}.ph-planned-pill{border:1px solid #e4e9ef;border-radius:30px;padding:7px 10px;font-size:9px;color:#737f90;white-space:nowrap;display:flex;align-items:center;gap:7px}.ph-planned-pill:before{content:"";width:6px;height:6px;border-radius:50%;background:#d2a33d}
        .ph-services{padding:99px 0}.ph-services-head{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:end}.ph-services-head h2{font-family:var(--serif);font-size:clamp(38px,4vw,52px);font-weight:400;letter-spacing:-1.5px;line-height:1.08;margin:17px 0 0}.ph-services-head p{font-size:13px;color:#68758a;line-height:1.8;max-width:400px;margin:0 0 4px}.ph-services-grid{margin-top:43px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.ph-service{padding:24px 22px 26px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-height:160px;transition:background .2s}.ph-service:hover{background:#fafbf4}.ph-service-no{color:#a4adba;font-size:9px;letter-spacing:1px}.ph-service h3{font-family:var(--serif);font-size:21px;font-weight:400;margin:13px 0 7px}.ph-service p{font-size:11px;color:#6f7b8e;line-height:1.7;margin:0;max-width:300px}.ph-services-foot{margin-top:24px;display:flex;justify-content:space-between;align-items:center;gap:20px;color:#6b788a;font-size:11px}
        .ph-guidance{background:#f7f8fa;padding:83px 0}.ph-guide-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}.ph-guide-title h2{font-family:var(--serif);font-size:45px;line-height:1.08;letter-spacing:-1.3px;font-weight:400;margin:18px 0 14px}.ph-guide-title p{color:#69768a;font-size:12px;line-height:1.8;max-width:330px}.ph-guide-list{border-top:1px solid #dfe4ea}.ph-guide-row{display:grid;grid-template-columns:34px 1fr;gap:13px;padding:17px 0;border-bottom:1px solid #dfe4ea}.ph-guide-icon{height:26px;width:26px;border:1px solid #dfe4ea;border-radius:50%;display:grid;place-items:center;color:var(--blue);font-size:11px}.ph-guide-row h3{font-size:12px;margin:0 0 4px}.ph-guide-row p{font-size:11px;color:#738094;margin:0;line-height:1.65}
        .ph-plans{padding:100px 0}.ph-plans-top{display:flex;justify-content:space-between;align-items:flex-end;gap:36px}.ph-plans-top h2{font-family:var(--serif);font-size:49px;font-weight:400;line-height:1.06;letter-spacing:-1.5px;margin:18px 0 0}.ph-plans-top p{max-width:390px;color:#69768a;font-size:12px;line-height:1.8;margin:0 0 4px}.ph-plans-box{margin-top:37px;border:1px solid var(--line);border-radius:8px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden}.ph-plan-col{padding:28px 30px}.ph-plan-col+ .ph-plan-col{border-left:1px solid var(--line);background:#fafbf5}.ph-plan-label{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#778396;font-weight:800}.ph-plan-col h3{font-family:var(--serif);font-size:27px;font-weight:400;margin:11px 0 6px}.ph-plan-col p{font-size:11px;line-height:1.7;color:#6a778a;max-width:430px;margin:0}.ph-plan-col .ph-button{margin-top:20px;min-height:40px;font-size:11px}.ph-plan-col .ph-text-link{margin-top:19px;color:var(--blue)}
        .ph-faq{padding:82px 0 95px;border-top:1px solid var(--line)}.ph-faq-grid{display:grid;grid-template-columns:.72fr 1.28fr;gap:70px}.ph-faq-title h2{font-family:var(--serif);font-size:46px;font-weight:400;letter-spacing:-1.3px;line-height:1.08;margin:18px 0 12px}.ph-faq-title p{font-size:12px;color:#6b788b;line-height:1.8}.ph-faq-list{border-top:1px solid var(--line)}.ph-faq-item{border-bottom:1px solid var(--line)}.ph-faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;background:none;border:0;padding:17px 0;cursor:pointer;font-size:12px;font-weight:700}.ph-faq-q:hover{color:var(--blue)}.ph-faq-plus{height:22px;width:22px;border:1px solid #e1e6ec;border-radius:50%;display:grid;place-items:center;color:#657286;flex:none;font-weight:400}.ph-faq-a{font-size:11px;line-height:1.8;color:#6a778a;padding:0 36px 17px 0;max-width:660px}
        .ph-final{padding:0 0 80px}.ph-final-card{background:#f2f4fc;border:1px solid #e6e9f4;border-radius:8px;padding:43px 48px;display:flex;justify-content:space-between;align-items:center;gap:28px;position:relative;overflow:hidden}.ph-final-card:after{content:"";position:absolute;right:31%;top:-95px;width:250px;height:250px;border:1px solid #dfe3f2;border-radius:50%;pointer-events:none}.ph-final-card h2{font-family:var(--serif);font-size:39px;font-weight:400;letter-spacing:-1px;line-height:1.1;margin:0 0 9px;position:relative;z-index:1}.ph-final-card p{font-size:12px;color:#67748a;margin:0;position:relative;z-index:1}.ph-final-actions{display:flex;gap:18px;align-items:center;position:relative;z-index:1;flex:none}
        .ph-footer{padding:38px 0 25px;border-top:1px solid var(--line)}.ph-footer-top{display:flex;justify-content:space-between;gap:30px;align-items:flex-start}.ph-footer-brand p{font-size:11px;color:#758195;margin:12px 0 0;max-width:260px}.ph-footer-links{display:flex;gap:35px;flex-wrap:wrap}.ph-footer-links a{font-size:11px;color:#637085}.ph-footer-links a:hover{color:var(--blue)}.ph-footer-bottom{border-top:1px solid #edf0f3;margin-top:29px;padding-top:16px;display:flex;justify-content:space-between;color:#8a94a1;font-size:9px}
        .peoplehub-alt a:focus-visible,.peoplehub-alt button:focus-visible{outline:3px solid #8090ff;outline-offset:3px;border-radius:4px}
        @media(max-width:900px){.ph-hero-grid{grid-template-columns:1fr;gap:42px}.ph-hero-copy{max-width:590px}.ph-hero-visual{max-width:740px}.ph-reassure-inner{grid-template-columns:1fr 1fr;padding:20px 0}.ph-reassure-intro{grid-column:span 2}.ph-explore-layout{grid-template-columns:1fr;gap:30px}.ph-explore-copy{position:static}.ph-tabs{display:grid;grid-template-columns:1fr 1fr}.ph-explore-copy h2{font-size:43px}.ph-product-panel .ph-window-body{min-height:320px}.ph-guide-grid,.ph-faq-grid{grid-template-columns:1fr;gap:32px}.ph-guide-title h2,.ph-faq-title h2{font-size:40px}.ph-final-card{padding:34px}.ph-final-card:after{display:none}}
        @media(max-width:640px){.ph-container{width:min(100% - 36px,500px)}.ph-header{height:68px}.ph-navlinks,.ph-nav-actions .ph-login{display:none}.ph-nav-actions{gap:10px}.ph-nav-actions .ph-button{min-height:38px;padding:0 12px;font-size:10px}.ph-menu-toggle{display:grid;place-items:center}.ph-menu-toggle svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8}.ph-mobile-menu{display:flex;position:absolute;top:67px;left:0;right:0;padding:16px 18px 20px;background:#fff;border-bottom:1px solid var(--line);box-shadow:0 16px 25px #22304b12;flex-direction:column;gap:2px}.ph-mobile-menu a{padding:11px 2px;font-size:13px;color:#4d5a6d;border-bottom:1px solid #f1f3f6}.ph-hero{padding:53px 0 43px}.ph-hero-grid{gap:33px}.ph-hero h1{font-size:48px;letter-spacing:-1.9px;margin:18px 0}.ph-hero-copy{font-size:14px}.ph-hero-actions{gap:17px;flex-wrap:wrap}.ph-button{min-height:43px;padding:0 15px;font-size:11px}.ph-current-note{font-size:10px}.ph-visual-caption{font-size:8px}.ph-window-body{grid-template-columns:90px 1fr;min-height:260px}.ph-window-side{padding:13px 6px}.ph-side-item{padding:8px 5px;gap:5px;font-size:7px}.ph-side-label{font-size:6px;padding:0 5px}.ph-window-content{padding:13px 10px 10px}.ph-mock-heading h3{font-size:14px}.ph-mock-heading p{font-size:7px}.ph-mock-button{font-size:7px;padding:6px}.ph-table-row,.ph-table-head{grid-template-columns:1.25fr .9fr .67fr;gap:3px;font-size:7px}.ph-person{gap:4px;font-size:7px}.ph-initial{width:18px;height:18px;font-size:6px}.ph-window-brand{font-size:9px}.ph-window-brand .ph-mark{height:22px;width:22px}.ph-preview-note{font-size:6px}.ph-reassure-inner{gap:14px 10px;min-height:0;padding:20px 0}.ph-reassure-intro{font-size:17px}.ph-reassure-item{font-size:9px;gap:7px}.ph-check{height:18px;width:18px}.ph-path,.ph-services,.ph-plans{padding:69px 0}.ph-section-head,.ph-services-head,.ph-plans-top{display:block}.ph-section-head h2,.ph-services-head h2,.ph-plans-top h2{font-size:40px}.ph-section-intro,.ph-services-head p,.ph-plans-top p{margin-top:17px;font-size:12px}.ph-path-steps{grid-template-columns:1fr;margin-top:34px}.ph-step,.ph-step:not(:first-child){padding:20px 0;border-left:0;border-bottom:1px solid var(--line)}.ph-step:first-child{padding-top:20px}.ph-step-tag{right:0;top:22px}.ph-step h3{font-size:23px;margin:9px 0 6px}.ph-step p{margin-bottom:11px}.ph-explore{padding:69px 0}.ph-explore-copy h2{font-size:42px}.ph-explore-copy>p{font-size:12px}.ph-tabs{margin-top:23px;gap:4px}.ph-tab{padding:10px 8px;grid-template-columns:22px 1fr 12px;gap:5px}.ph-tab strong{font-size:10px}.ph-tab small{font-size:8px}.ph-tab-no{font-size:8px}.ph-product-panel .ph-window-body{min-height:280px}.ph-product-detail{display:block}.ph-product-detail h3{font-size:22px}.ph-product-detail p{font-size:11px}.ph-planned-pill{display:inline-flex;margin-top:12px}.ph-services-grid{grid-template-columns:1fr 1fr;margin-top:27px}.ph-service{padding:17px 13px;min-height:155px}.ph-service h3{font-size:17px;margin:10px 0 6px}.ph-service p{font-size:10px}.ph-services-foot{align-items:flex-start;flex-direction:column;font-size:10px}.ph-guidance{padding:65px 0}.ph-guide-title h2,.ph-faq-title h2{font-size:39px}.ph-plans-box{grid-template-columns:1fr}.ph-plan-col{padding:23px 19px}.ph-plan-col+.ph-plan-col{border-left:0;border-top:1px solid var(--line)}.ph-faq{padding:66px 0}.ph-faq-q{font-size:11px;padding:14px 0}.ph-faq-a{font-size:10px}.ph-final{padding-bottom:56px}.ph-final-card{display:block;padding:27px 22px}.ph-final-card h2{font-size:33px}.ph-final-card p{font-size:11px}.ph-final-actions{margin-top:22px;flex-wrap:wrap;gap:15px}.ph-footer-top{display:block}.ph-footer-links{gap:16px;margin-top:25px}.ph-footer-bottom{gap:10px;flex-direction:column}.ph-kicker{font-size:9px}}
        @media(max-width:640px){.ph-dashboard-controls{align-items:flex-start;flex-direction:column;gap:9px}.ph-dashboard-tools{width:100%}.ph-dashboard-copy strong{font-size:15px}.ph-dashboard-disclosure{font-size:7px}.ph-hiring-pipeline{gap:4px}.ph-hiring-stage{padding:7px 5px 10px}}
        @media(prefers-reduced-motion:reduce){.peoplehub-alt *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
        .ph-explore-layout{display:block}.ph-explore-copy{position:static;max-width:760px}.ph-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:28px 0 24px}.ph-tab{position:relative;isolation:isolate;min-width:0;min-height:78px;grid-template-columns:24px minmax(0,1fr) 12px;gap:8px;padding:12px;background:#fff;border-color:#e3e8ef}.ph-tab:hover{border-color:#c9d2e2}.ph-tab[aria-selected=true]{border-color:#435bd0;background:#fff;box-shadow:0 6px 18px #25334a10}.ph-tab strong{font-size:11px}.ph-tab small{line-height:1.4}.ph-tab-no,.ph-tab>span:not(.ph-tab-indicator){position:relative;z-index:1}.ph-tab-indicator{position:absolute;z-index:0;top:14px;bottom:14px;left:0;width:3px;border-radius:0 3px 3px 0;background:#354fd0;pointer-events:none}.ph-product-panel{margin-top:0}.ph-product-panel .ph-window-body{min-height:360px}
        @media(max-width:900px){.ph-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.ph-tab{min-height:72px}}
        @media(max-width:640px){.ph-tabs{grid-template-columns:repeat(4,minmax(180px,1fr));overflow-x:auto;padding-bottom:7px;scroll-snap-type:x proximity}.ph-tab{scroll-snap-align:start}}
        .ph-hero-kicker-row{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:470px}.ph-hero-lottie{display:grid;width:68px;height:68px;place-items:center;flex:none;overflow:hidden;border:1px solid #e7ebf2;border-radius:50%;background:radial-gradient(circle,#f9faff 0%,#fff 72%);opacity:.92}.ph-hero-lottie>div,.ph-hero-lottie svg{width:100%!important;height:100%!important}.ph-tab>span:not(.ph-tab-indicator){z-index:1}
        @media(max-width:640px){.ph-hero-lottie{width:52px;height:52px}}
        .ph-tabs{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;gap:9px;margin:28px 0 24px;padding:0 2px 9px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scroll-padding-inline:2px;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:#c4cedd transparent}
        .ph-tabs::-webkit-scrollbar{height:5px}.ph-tabs::-webkit-scrollbar-track{background:transparent}.ph-tabs::-webkit-scrollbar-thumb{background:#c4cedd;border-radius:8px}
        .ph-tabs .ph-tab{flex:0 0 clamp(210px,22vw,245px);min-width:0;min-height:78px;scroll-snap-align:start}.ph-thumb-recruitment .ph-thumb-chart{background:linear-gradient(90deg,#ced6fb,#566bda)!important}
        @media(max-width:900px){.ph-tabs{display:flex;flex-wrap:nowrap}.ph-tabs .ph-tab{flex-basis:225px;min-height:76px}}
        @media(max-width:640px){.ph-tabs{display:flex;flex-wrap:nowrap;gap:7px;margin:23px 0 20px;padding-bottom:8px}.ph-tabs .ph-tab{flex-basis:min(78vw,250px);min-width:200px;min-height:76px;padding:10px 11px}}
      `}</style>
      <div className="ph-topline" />
      <header className="ph-header">
        <div className="ph-container ph-nav">
          <a className="ph-brand" href="#top" aria-label="PeopleHub home"><Mark />PeopleHub</a>
          <nav className="ph-navlinks" aria-label="Main navigation">
            <a href="#explore">Platform</a><a href="#services">Services</a><a href="#plans">Plans</a><a href="#faq">Resources</a>
          </nav>
          <div className="ph-nav-actions"><a className="ph-login" href="/login">Log in</a><a className="ph-button" href="/register?mode=trial">Start free trial <Arrow /></a>
            <button className="ph-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><svg viewBox="0 0 24 24"><path d={menuOpen ? "M5 5l14 14M19 5 5 19" : "M3 7h18M3 12h18M3 17h18"} /></svg></button>
          </div>
          {menuOpen && <nav className="ph-mobile-menu" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}><a href="#explore">Platform</a><a href="#services">Services</a><a href="#plans">Plans</a><a href="#faq">Resources & FAQs</a><a href="/login">Log in</a></nav>}
        </div>
      </header>
      <div id="top" />
      <motion.section
        className="ph-hero"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: "easeOut" }}
      >
        <div className="ph-container ph-hero-grid">
          <div>
            <div className="ph-hero-kicker-row">
              <div className="ph-kicker">People-first HR, built for India</div>
              <span className="ph-hero-lottie" aria-hidden="true">
                <Lottie src={peopleOrbitAnimation} loop={!prefersReducedMotion} autoplay={!prefersReducedMotion} />
              </span>
            </div>
            <h1>Make room for <em>people.</em><br />We’ll help with the rest.</h1>
            <p className="ph-hero-copy">People operations get more complex as your business grows. PeopleHub brings modular HR software and specialist services together, so you can find a sensible next step.</p>
            <div className="ph-hero-actions"><a href="/register?mode=trial" className="ph-button">Start your free trial <Arrow /></a><a href="#path" className="ph-text-link">Find your starting point <Arrow /></a></div>
            <div className="ph-current-note"><span className="ph-status-dot" /><span><strong>Available now:</strong> organisation creation and free-trial signup. HRMS suites shown here are planned product direction—not live software.</span></div>
          </div>
          <div className="ph-hero-visual">
            <div className="ph-visual-caption"><span>Product dashboard concepts</span><span>Planned HRMS direction</span></div>
            <div id="hero-dashboard-panel" role="tabpanel" aria-labelledby={`hero-dashboard-tab-${currentDashboard.key}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentDashboard.key}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                >
                  <ProductSnapshot active={activeDashboard} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="ph-dashboard-controls">
              <div className="ph-dashboard-copy" aria-live={rotationPaused || prefersReducedMotion ? "polite" : "off"} aria-atomic="true">
                <strong>{currentDashboard.name}</strong>
                <p>{currentDashboard.short}</p>
              </div>
              <div className="ph-dashboard-tools">
                <span className="ph-dashboard-count">{String(activeDashboard + 1).padStart(2, "0")} / {String(heroProducts.length).padStart(2, "0")}</span>
                <button type="button" className="ph-dashboard-control" aria-label="Previous dashboard preview" onClick={() => { setRotationPaused(true); setActiveDashboard((current) => (current + heroProducts.length - 1) % heroProducts.length); }}>‹</button>
                <button type="button" className="ph-dashboard-control" aria-label="Next dashboard preview" onClick={() => { setRotationPaused(true); setActiveDashboard((current) => (current + 1) % heroProducts.length); }}>›</button>
                <button type="button" className="ph-dashboard-control ph-play" aria-label={prefersReducedMotion ? "Automatic rotation disabled by motion preference" : rotationPaused ? "Resume dashboard rotation" : "Pause dashboard rotation"} aria-pressed={rotationPaused} disabled={prefersReducedMotion} onClick={() => setRotationPaused((paused) => !paused)}>{prefersReducedMotion ? "Auto off" : rotationPaused ? "Play" : "Pause"}</button>
              </div>
            </div>
            <div className="ph-dashboard-thumbnails" role="tablist" aria-label="Choose a dashboard preview">
              {heroProducts.map((product, index) => <button type="button" role="tab" id={`hero-dashboard-tab-${product.key}`} aria-controls="hero-dashboard-panel" aria-selected={activeDashboard === index} aria-label={`Show ${product.name} dashboard`} className="ph-dashboard-thumb" key={product.key} onClick={() => { setRotationPaused(true); setActiveDashboard(index); }}>
                <span className={`ph-thumb-screen ph-thumb-${product.key}`} aria-hidden="true">
                  <i className="ph-thumb-sidebar" />
                  <span className="ph-thumb-main"><i className="ph-thumb-heading" /><i className="ph-thumb-stat" /><i className="ph-thumb-stat" /><i className="ph-thumb-chart" /></span>
                </span>
                <span className="ph-thumb-label">{product.name}</span>
              </button>)}
            </div>
            <p className="ph-dashboard-disclosure">Illustrative dashboard concepts. HRMS suites are planned product direction, not live software.</p>
          </div>
        </div>
      </motion.section>
      <section className="ph-reassure" aria-label="PeopleHub approach">
        <div className="ph-container ph-reassure-inner">
          <div className="ph-reassure-intro">One partner for the people work.</div>
          <div className="ph-reassure-item"><span className="ph-check">✓</span>Choose only what fits</div>
          <div className="ph-reassure-item"><span className="ph-check">✓</span>Software and specialist support</div>
          <div className="ph-reassure-item"><span className="ph-check">✓</span>Made for growing Indian teams</div>
        </div>
      </section>
      <section id="path" className="ph-path">
        <div className="ph-container">
          <div className="ph-section-head">
            <div><div className="ph-kicker">A clearer way to begin</div><h2>Start with the work in front of you.</h2></div>
            <p className="ph-section-intro">You don’t need to choose an entire HR stack on day one. Tell us what’s taking your team’s time, then take the next step that makes sense.</p>
          </div>
          <div className="ph-path-steps">
            <article className="ph-step"><span className="ph-step-num">01 / EXPLORE</span><span className="ph-step-tag">Available</span><h3>See how PeopleHub fits</h3><p>Explore our product direction and specialist services. These suite previews are illustrative—not an active HRMS.</p><a className="ph-step-link" href="#explore">Explore the platform <Arrow /></a></article>
            <article className="ph-step"><span className="ph-step-num">02 / GET STARTED</span><span className="ph-step-tag">Signup available</span><h3>Create your organisation</h3><p>Start a free-trial signup and set up your organisation. The full HRMS experience is planned, not currently operational.</p><a className="ph-step-link" href="/register?mode=trial">Start free trial <Arrow /></a></article>
            <article className="ph-step"><span className="ph-step-num">03 / TALK IT THROUGH</span><span className="ph-step-tag">People-powered</span><h3>Find the right support</h3><p>Discuss your team’s needs with us—from HR operations to recruitment and compliance support.</p><a className="ph-step-link" href="/contact">Talk to our team <Arrow /></a></article>
          </div>
        </div>
      </section>
      <section id="explore" className="ph-explore">
        <div className="ph-container ph-explore-layout">
          <div className="ph-explore-copy">
            <div className="ph-kicker">Explore the product direction</div>
            <h2>People work,<br />in connected parts.</h2>
            <p>Move between the areas a growing team may need. Each screen is a code-built illustration of a planned product suite—not a live capability.</p>
             <div className="ph-plan-alert"><strong>Planned HRMS suites</strong>The ten suite and service previews below are illustrative concepts. They do not process real employee data or transactions.</div>
          </div>
          <div className="ph-tabs" role="tablist" aria-orientation="horizontal" aria-label="Illustrative planned product areas">
            {products.map((product, index) => (
              <button
                key={product.key}
                className="ph-tab"
                role="tab"
                id={`ph-tab-${product.key}`}
                aria-selected={activeProduct === index}
                aria-controls="ph-product-panel"
                tabIndex={activeProduct === index ? 0 : -1}
                onClick={() => setActiveProduct(index)}
                onKeyDown={(event) => {
                  const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                  if (!direction) return;
                  event.preventDefault();
                  const next = (index + direction + products.length) % products.length;
                  setActiveProduct(next);
                  document.getElementById(`ph-tab-${products[next].key}`)?.focus();
                }}
              >
                {activeProduct === index ? <motion.span layoutId="explore-tab-indicator" className="ph-tab-indicator" transition={{ type: "spring", stiffness: 380, damping: 32 }} aria-hidden="true" /> : null}
                <span className="ph-tab-no">{product.number}</span>
                <span><strong>{product.name}</strong><small>{product.short}</small></span>
                <span className="ph-tab-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          <div className="ph-product-panel" id="ph-product-panel" role="tabpanel" aria-labelledby={`ph-tab-${products[activeProduct].key}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={products[activeProduct].key}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.32, ease: "easeOut" }}
              >
                <ProductSnapshot active={activeProduct} />
                <div className="ph-product-detail"><div><h3>{products[activeProduct].name}</h3><p>{products[activeProduct].description}</p></div><span className="ph-planned-pill">Planned suite</span></div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
      <section id="services" className="ph-services">
        <div className="ph-container">
          <div className="ph-services-head"><div><div className="ph-kicker">A little more than software</div><h2>Specialist help, when you need it.</h2></div><p>Sometimes the right answer is a person, not another platform. PeopleHub brings specialist services alongside its planned HRMS suites, with scope discussed for your needs.</p></div>
          <div className="ph-services-grid">{services.map(([title, copy], index) => <article className="ph-service" key={title}><span className="ph-service-no">SERVICE / {String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className="ph-services-foot"><span>Service availability and scope are discussed with our team.</span><a href="/services" className="ph-text-link">Explore specialist services <Arrow /></a></div>
        </div>
      </section>
      <section className="ph-guidance">
        <div className="ph-container ph-guide-grid">
          <div className="ph-guide-title"><div className="ph-kicker">Designed for your next chapter</div><h2>Less complexity.<br />More clarity.</h2><p>PeopleHub is built around a simple belief: growing businesses deserve useful choices, not more noise.</p></div>
          <div className="ph-guide-list">
            {[["Modular by design", "Begin with the people challenge you have; explore additional suites as your needs take shape."], ["India-aware, human-led", "Software direction made for Indian businesses, with specialist conversations when context matters."], ["One place to explore", "People operations software and services can be considered together, without pretending they’re the same thing."], ["Clear about what’s next", "Current signup capabilities are distinct from planned HRMS features. We’ll keep that distinction visible."]].map(([title, copy], i) => <div className="ph-guide-row" key={title}><span className="ph-guide-icon">{["↗", "◎", "⌘", "→"][i]}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}
          </div>
        </div>
      </section>
      <section id="plans" className="ph-plans">
        <div className="ph-container">
          <div className="ph-plans-top"><div><div className="ph-kicker">A practical first step</div><h2>Choose how to<br />continue.</h2></div><p>Current signup is available for organisations interested in a free trial. Product pricing and operational suite availability should be confirmed with PeopleHub; no plan prices are implied by these previews.</p></div>
          <div className="ph-plans-box">
            <div className="ph-plan-col"><span className="ph-plan-label">For a first look</span><h3>Start a free trial</h3><p>Create an organisation to begin the current trial signup journey. No credit card required during trial signup.</p><a href="/register?mode=trial" className="ph-button">Create your organisation <Arrow /></a></div>
            <div className="ph-plan-col"><span className="ph-plan-label">For a considered conversation</span><h3>Talk to our team</h3><p>Discuss your requirements, specialist services, implementation questions and the planned product direction.</p><a href="/contact" className="ph-text-link">Get in touch <Arrow /></a></div>
          </div>
        </div>
      </section>
      <section id="faq" className="ph-faq">
        <div className="ph-container ph-faq-grid">
          <div className="ph-faq-title"><div className="ph-kicker">Good questions, clear answers</div><h2>Before you<br />take the next step.</h2><p>Still deciding what fits? <a href="/contact" className="ph-text-link">Talk to our team <Arrow /></a></p></div>
          <div className="ph-faq-list">{faqs.map(([question, answer], index) => <div className="ph-faq-item" key={question}><button className="ph-faq-q" aria-expanded={openFaq === index} aria-controls={`ph-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<span className="ph-faq-plus" aria-hidden="true">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <div className="ph-faq-a" id={`ph-faq-answer-${index}`}>{answer}</div>}</div>)}</div>
        </div>
      </section>
      <section className="ph-final">
        <div className="ph-container ph-final-card"><div><h2>Let’s find your<br />people platform.</h2><p>Tell us where you are today. We’ll help you work out what comes next.</p></div><div className="ph-final-actions"><a href="/contact" className="ph-button">Talk to our team <Arrow /></a><a href="/register?mode=trial" className="ph-text-link">Start free trial <Arrow /></a></div></div>
      </section>
      <footer className="ph-footer">
        <div className="ph-container">
          <div className="ph-footer-top"><div className="ph-footer-brand"><a className="ph-brand" href="#top"><Mark />PeopleHub</a><p>People-first HR. Business-ready possibilities. Built for India. Built for you.</p></div><nav className="ph-footer-links" aria-label="Footer"><a href="#explore">Platform</a><a href="/services">Services</a><a href="#plans">Plans</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a></nav></div>
          <div className="ph-footer-bottom"><span>© {new Date().getFullYear()} PeopleHub. All rights reserved.</span><span>Made for Indian businesses</span></div>
        </div>
      </footer>
    </main>
  );
}
