export const complianceNote = "The platform automates documentation and tracking. EOR, POSH, FRRO and labour-law compliance are supported by appropriate legal, statutory and operational expertise; software alone does not fulfil every statutory obligation.";
import {marketingDefaults,additionalMarketingPages} from "./marketing-defaults";
import {clientDefaults} from "./client-defaults";
import {defaultSolutionPhoto} from "./solution-photos";
import {privacyDraft,termsDraft} from "./sample-content";
import {creativeHomeDefaults} from "./creative-home-defaults";
const suiteData = [
  ["core_hrms", "core-hrms", "Core HRMS", "Users", "employee database, organisation structure, employee lifecycle, onboarding, confirmation, transfer, promotion, separation, document management, ESS, mobile app, HR policies", "Designed to bring employee profiles, organisation structure, onboarding and key lifecycle records into one connected view. Give teams a clearer way to organise people information, keep processes consistent and plan for each employee milestone as the business grows."],
  ["time_workforce", "time-and-workforce-management", "Time & Workforce Management", "Clock", "attendance, biometric, face recognition, GPS, geo-fencing, shift, roster, leave, overtime, comp-off, timesheets, field-force tracking", "Designed to connect attendance, shifts, leave and timesheets in a clearer workforce workflow. Planned tools span biometric and location-based capture, rosters and field-force scheduling so teams can plan work across sites."],
  ["payroll_compliance", "payroll-and-compliance", "Payroll & Compliance", "Wallet", "salary processing, PF, ESI, PT, TDS, LWF, gratuity, bonus, minimum wages, F&F, Form 16, investment declaration, payroll reconciliation, statutory calendar, loans, advances, travel, expense, reimbursement", "Plan payroll around organised salary inputs, review steps and reconciliation. The proposed suite covers PF, ESI, PT, TDS, LWF and related records; statutory obligations still require appropriate expertise, since software alone cannot fulfil every requirement."],
  ["recruitment_ats", "recruitment-and-ats", "Recruitment & ATS", "UserPlus", "manpower requisition, job posting, job portal integration, resume parsing, AI screening, candidate database, interview scheduling, assessment, offer, background verification, joining", "Map a hiring journey from a manpower request and job posting through interviews, offers and joining. Planned tools include candidate records, resume parsing and assisted screening, while keeping hiring decisions with your team."],
  ["performance_talent", "performance-and-talent-management", "Performance & Talent Management", "Target", "KRA, KPI, OKR, goal setting, appraisal, 180/360 feedback, competency mapping, bell curve, nine-box matrix, promotion, succession planning", "Bring goals, KRA/KPI/OKR planning and review cycles into a more structured approach to performance. The suite is designed to support feedback, competency mapping and talent development as people grow in their roles."],
  ["engagement", "employee-engagement", "Employee Engagement", "Heart", "surveys, eNPS, grievance, HR helpdesk, rewards, recognition, announcements, employee feedback, wellness programmes", "Create more ways for people to share feedback, recognise great work and stay informed. Planned capabilities include surveys, eNPS, helpdesk and wellbeing workflows that help teams listen and respond consistently."],
  ["learning_development", "learning-and-development", "Learning & Development", "GraduationCap", "LMS, training calendar, TNA, training effectiveness, assessments, certifications, competency development, CPD, skill matrix, learning paths", "Organise learning needs, training calendars, courses and assessments around the skills your teams need. Designed to support certification tracking and individual development paths, the suite gives learning a clearer structure."],
  ["hr_operations", "hr-administration-and-operations", "HR Administration & Operations", "Building2", "asset management, visitor management, canteen, transport, task management, contract labour", "Plan everyday workplace operations, from assets and visitors to tasks, transport and canteen needs. Bring these operational workflows into a shared view and make contract-labour processes easier to coordinate."],
  ["governance_compliance", "governance-and-specialised-compliance", "Governance & Specialised Compliance", "ShieldCheck", "POSH, ICC records, compliance dashboard, labour-law registers, audits, contractor compliance, policy acknowledgements, FRRO and immigration case management", "Keep policies, acknowledgements, audit records and compliance responsibilities easier to organise. Planned workflows include POSH/ICC records and immigration case management; legal and statutory matters require qualified specialist support."],
  ["extended_hr_services", "extended-hr-services", "Extended HR Services", "Briefcase", "EOR, payroll outsourcing, recruitment outsourcing, background verification, HR consultancy, HR audit, manpower outsourcing, HR shared services, contract staffing", "Connect your people team with support for payroll, recruitment, background checks, HR consulting and staffing. Services are scoped with each organisation, and EOR or compliance work is delivered with the appropriate specialist expertise."],
];
export const suites = suiteData.map(([key, slug, title, icon, modules, body], i) => ({
  key, slug, title, icon, modules: modules.split(", "), priority: i < 8 ? "Must have" : "Differentiator",
  ...defaultSolutionPhoto(slug),
  description: `Bring ${title.toLowerCase()} together in one connected workspace, built for the way Indian businesses work.`,
  body,
  moduleDetails: modules.split(", ").map((module:string) => ({
    title:module,
    description:`Discuss the records, owners and review steps your organisation needs for ${module.toLowerCase()}.`,
  })),
  workflowSteps:[
    {title:"Map the current process",description:"List the people, handoffs and information involved today."},
    {title:"Assign clear ownership",description:"Decide who maintains records, reviews changes and supports employees."},
    {title:"Plan a practical rollout",description:"Choose a team or workflow to start with, then review what should change next."},
  ],
  audiences:[
    {title:"HR teams",description:"Coordinate people records and lifecycle responsibilities."},
    {title:"Managers",description:"Make team handoffs and routine approvals easier to understand."},
    {title:"Employees",description:"Give people a clearer path to find information and complete tasks."},
  ],
  benefits: ["Reduce repetitive administration", "Keep your people and records connected", "Scale at your own pace"],
  faq: [{question: `Is ${title} available in my plan?`, answer: "Choose the suites included in your plan, or speak to our team about a tailored package."}],
}));
const serviceData = [
  ["posh-management", "POSH Management", "complaints, ICC records, inquiry workflow, training, annual reporting", "annual subscription / managed service", "ShieldCheck"],
  ["employer-of-record-eor", "EOR", "employer-of-record administration, contracts, payroll, statutory obligations, lifecycle support", "per employee/month", "Globe"],
  ["frro-immigration", "FRRO / Immigration", "visa and registration tracking, expiry alerts, case records, coordination", "per case / annual", "Plane"],
  ["contract-labour-management", "Contract Labour Management", "contractor onboarding, worker records, attendance, wage verification, statutory documents", "per worker/month", "HardHat"],
  ["hr-outsourcing", "HR Outsourcing", "payroll, documentation, HR operations, compliance administration, helpdesk", "monthly retainer", "Briefcase"],
  ["recruitment-outsourcing", "Recruitment Outsourcing", "sourcing, screening, interviews, offers, joining coordination", "per position / success fee", "UserPlus"],
  ["background-verification", "Background Verification", "education, employment, address, reference checks via authorised providers", "per candidate", "BadgeCheck"],
  ["cpd-learning-development", "CPD / L&D", "industry-specific courses, assessments, certification, learning dashboard", "per learner / corporate licence", "GraduationCap"],
  ["employee-wellness", "Employee Wellness", "wellness programmes, counselling, preventive initiatives", "per employee/month", "Heart"],
  ["manpower-planning", "Manpower Planning", "budgeting, sanctioned strength, vacancy planning, workforce cost analysis", "subscription / consulting", "Users"],
];
export const services = serviceData.map(([slug,title,description,billing,icon]) => ({
  key:slug,slug,title,description:`${title} support scoped around your organisation’s processes, responsibilities and operational needs.`,billing,icon,modules:description.split(", "),
  moduleDetails:description.split(", ").map((area:string) => ({
    title:area,
    description:`Agree the key records, responsibilities and handoffs for ${area.toLowerCase()} before the engagement begins.`,
  })),
  ...defaultSolutionPhoto(slug),
  body:`Work with our team to define the scope, responsibilities and handoffs for ${title.toLowerCase()}. We will discuss your organisation's current process, the support required and the next practical steps before agreeing an engagement.`,
  engagementSteps:[
    {title:"Understand your requirements",description:"Share the current process, locations, team size and the responsibilities you want support with."},
    {title:"Agree the scope",description:"Confirm deliverables, owners, timelines, dependencies and any specialist advice needed."},
    {title:"Review the engagement",description:"Set a check-in cadence and agree how questions, changes and outcomes will be reviewed."},
  ],
  benefits:["Expert-led support for your business", "Clear records and coordinated workflows", "Flexible service packages"],
  faq:[{question:"How is this service priced?",answer:`This service is billed as ${billing}. Contact our team for a proposal.`}],
}));
const aiFeatures = ["AI HR chatbot", "AI recruitment assistant (sourcing to joining)", "Automated JD creation and candidate-job matching", "AI-assisted appraisal and KPI evaluation", "Payroll anomaly detection", "HR policy generator and document automation", "Labour-code compliance alerts", "Attrition prediction and workforce analytics", "WhatsApp communication and approvals", "Multi-company and multi-location administration", "API integration with accounting, ERP, biometric devices and job portals"];
const starter = ["core_hrms","time_workforce","payroll_compliance"];
const growth = [...starter,"recruitment_ats","performance_talent","engagement"];
export const defaults: Record<string, any> = {
  homepage:{activeVariant:"original"},
  nav:{brand:"ZefoHR",links:[{label:"Platform",href:"/features"},{label:"Services",href:"/services"},{label:"Pricing",href:"/pricing"},{label:"Resources",href:"/blog"},{label:"Company",href:"/about"}],loginLabel:"Log in",ctaLabel:"Start free trial"},
  hero:{eyebrow:"THE PEOPLE-FIRST HR PLATFORM",title:"Run HR, payroll and compliance from one smart platform",description:"Less busywork. More people work. Bring your entire employee journey together with intelligent HR software, built for growing Indian businesses.",titleColor:"",descriptionColor:"",buttonColor:"",buttonTextColor:"",primaryCta:"Start free trial",secondaryCta:"View pricing",badges:["PF · ESI · PT · TDS ready","AI-assisted HR","WhatsApp approvals"],lottieUrl:"",trialNote:"14 days free. No credit card required.",visualLabel:"Your people. Perfectly connected."},
  stats:{items:[{value:10,label:"Integrated suites"},{value:10,label:"Specialised services"},{value:11,label:"Smart capabilities"},{value:14,label:"Day free trial"}]},
  suites:{eyebrow:"ONE PLATFORM. EVERY POSSIBILITY.",title:"Everything your people need.\nNothing they don't.",description:"From the first hello to the next big milestone, connect every part of your employee journey.",items:suites},
  services:{eyebrow:"EXPERTISE, WHEN YOU NEED IT",title:"More than software.\nA partner in your growth.",description:"Specialised HR services that bring the right expertise to your business.",items:services},
  ai:{eyebrow:"A SMARTER WAY TO WORK",title:"Your HR team, with superpowers.",description:"Make room for meaningful work with AI-assisted tools and connected workflows.",items:aiFeatures.map((title,i)=>({title,description:"Designed to simplify everyday HR and help your team make informed decisions.",icon:["Sparkles","Bot","Zap","Target"][i%4]}))},
  whyUs:{eyebrow:"BUILT FOR YOUR NEXT CHAPTER",title:"Big possibilities.\nBuilt for your business.",items:["Simple, fast implementation for MSMEs","Affordable entry packages","HR software, compliance support and outsourcing under one roof","Mobile-first UX","AI-assisted hiring","Modular, so customers buy only what they need"],complianceNote},
  integrations:{title:"Works with the tools you already love",items:["WhatsApp","Tally","Biometric devices","ERP systems","Job portals","Accounting tools"]},
  pricing:{eyebrow:"GROW YOUR TEAM, NOT YOUR COSTS",title:"Simple plans. Room to grow.",description:"Start with what you need. Add more as your people and possibilities grow.",comparisonTitle:"Compare the available suites",comparisonDescription:"Plan inclusions are managed by ZefoHR. Confirm current availability and implementation needs with our team.",trialDays:14,monthlyLabel:"Monthly",annualLabel:"Annually",savingLabel:"Save up to 21%",plans:[
    {key:"starter",name:"Starter",description:"The essentials to get your HR in order.",monthly:49,annual:39,highlighted:false,badge:"",button:"Start free trial",modules:starter,features:["Core HRMS","Time & Workforce Management","Payroll & Compliance","Employee self-service","Mobile access"]},
    {key:"growth",name:"Growth",description:"More possibilities for ambitious teams.",monthly:99,annual:79,highlighted:true,badge:"Most popular",button:"Start free trial",modules:growth,features:["Everything in Starter","Recruitment & ATS","Performance & Talent Management","Employee Engagement","AI-assisted hiring"]},
    {key:"enterprise",name:"Enterprise",description:"The complete platform, tailored to you.",monthly:null,annual:null,highlighted:false,badge:"",button:"Talk to sales",modules:suites.map(s=>s.key),features:["All 10 integrated suites","Specialised services","Advanced governance & compliance","Tailored implementation","Dedicated support"]},
  ]},
  faq:{title:"A little clarity goes a long way.",description:"Everything else you might be wondering.",items:[
    {question:"How does the free trial work?",answer:"Explore ZefoHR for 14 days with the suites included in your chosen plan. No credit card is required. Your trial period is shown in your organisation dashboard."},
    {question:"How is our data protected?",answer:"Account passwords are hashed, access is role-based and organisation records are scoped to your organisation. Contact our team to discuss your security requirements before onboarding sensitive employee data."},
    {question:"Does the software handle all statutory obligations?",answer:complianceNote},
    {question:"Can we choose only the modules we need?",answer:"Yes. ZefoHR is modular. Starter, Growth and Enterprise bring together different suites so you can start small and expand."},
    {question:"Can you help us migrate our existing data?",answer:"Our team can discuss your current records and help plan a structured migration and implementation."},
    {question:"Do you offer outsourcing services?",answer:"Yes. Our specialised services include HR and recruitment outsourcing, EOR, background verification, compliance support and more. Service fees are scoped separately."},
  ]},
  contact:{eyebrow:"LET'S TALK PEOPLE",title:"Your next chapter starts here.",description:"Tell us a little about your team. We'll help you find the right fit.",email:"info@zefohr.com",supportEmail:"support@zefohr.com",phone:"+919311638356",address:"H-96, Office No - BS-3, Sector - 63, Noida 201301",mapUrl:"",officeHours:"",nameLabel:"Full name",emailLabel:"Work email",organisationLabel:"Organisation",phoneLabel:"Phone number",messageLabel:"How can we help?",button:"Send message",successMessage:"Thank you. Your message has been received."},
  footer:{description:"People-first HR. Business-ready possibilities.\nBuilt for India. Built for you.",complianceNote,copyright:"ZefoHR. All rights reserved.",links:[{label:"Privacy policy",href:"/privacy-policy"},{label:"Terms of service",href:"/terms"},{label:"Contact",href:"/contact"}]},
  theme:{primary:"#8b5cf6",cyan:"#22d3ee",pink:"#ec4899",background:"#090b13"},
  register:{title:"Great teams start here.",description:"Give your people a better workday. Set up your organisation in just a few minutes.",successTitle:"Welcome to ZefoHR.",successDescription:"Your organisation is ready. Explore your dashboard and enabled suites.",trialLabel:"Free trial",subscribeLabel:"Subscribe",button:"Create organisation",termsLabel:"I agree to the terms and privacy policy."},
  dashboard:{title:"Your people platform.",description:"Manage your organisation and subscription in one place.",comingSoon:"HRMS app coming soon",upgradeLabel:"Upgrade / subscribe"},
  roadmap:{title:"What's coming next",items:[{title:"Connected employee workspace",description:"Employee records, self-service and onboarding.",status:"Planned"},{title:"Time and payroll",description:"Attendance, leave and India-ready payroll workflows.",status:"Planned"},{title:"Talent and intelligence",description:"Recruitment, performance and AI-assisted tools.",status:"Planned"}]},
  about:{title:"Better work starts with people.",description:"ZefoHR helps HR teams deliver thoughtful employee services through clear processes, dependable systems and people-first support.",mission:"Our mission is to empower every HR team to deliver fast, seamless, transparent, compliant and personalised services to their employees.",vision:"To help individuals make their employment experience delightful by enhancing our processes and systems.",focusTitle:"What we focus on",focusDescription:"Practical systems for the people processes that keep a business moving.",focusAreas:["Connected employee workflows","Clear ownership and handoffs","Support shaped around your organisation"],values:["Customer value creation is our priority","Develop easy-to-use platforms","Trustworthy computation and data management","Proactive online and offline customer support","Continuous innovation in product development","Foster a supportive and congenial work environment","Contribute to reducing the carbon footprint of processes","Practise diversity and inclusion in management"]},
  legal:{
     "privacy-policy":privacyDraft,
     terms:termsDraft,
    "refund-policy":{title:"Refund policy",body:"No online payments are processed in this release. Subscription requests remain pending payment until handled by an authorised administrator. Before payment collection is enabled, the operator must publish the applicable cancellation, refund, eligibility and processing timelines. Contact the ZefoHR team about any billing queries. This draft policy requires legal and commercial review before public launch."},
  },
  cta:{title:"Less admin.\nMore human.",description:"Give your team the space to do their best work.",button:"Start your free trial"},
  pages:{featuresTitle:"Ten suites. One connected journey.",featuresDescription:"Explore the ZefoHR platform, from core HR to specialist services.",servicesTitle:"Expertise that goes beyond software.",blogTitle:"Ideas for a better workday.",blogDescription:"Practical perspectives on people, payroll and the future of HR.",emptyBlog:"New perspectives are on their way.",notFoundTitle:"This page took a day off.",notFoundDescription:"We couldn't find that page. Let's get you back to your people.",backHome:"Back to home"},
  preview:{label:"HRMS preview · People, payroll and attendance in one place.",payrollLabel:"Payroll run",payrollPeriod:"Mar 26",payrollDetail:"248 payslips",coreHrmsTitle:"Core HRMS",coreHrmsDetail:"People suite",statutoryLabel:"Statutory",statutoryTitle:"PF ECR filed",statutoryDetail:"ESI 12 / PT 4 states",approvalLabel:"WhatsApp approval",approvalTitle:"Leave request",approvalStatus:"Approved",approvalDetail:"2 days",attendanceLabel:"Attendance",attendanceValue:"96.4%",attendanceDetail:"Example workplace"},
};
Object.assign(defaults,marketingDefaults(suites,services,complianceNote));
defaults.homepageV3=creativeHomeDefaults;
defaults.pageLayouts={routes:{}};
defaults.clients=clientDefaults;
export const defaultPages = [
  ...additionalMarketingPages,
  {slug:"solutions/payroll-software-india",title:"Payroll software for Indian businesses",content:{intro:"Bring salary processing, statutory tracking and employee records into one connected platform.",body:"Simplify PF, ESI, PT, TDS and payroll administration with ZefoHR. Our payroll and compliance suite connects salary processing with your employee and attendance records.",benefits:["India-ready payroll workflows","Connected employee records","Statutory calendar and documentation"],faq:defaults.faq.items.slice(0,3)}},
  {slug:"solutions/hrms-for-msme",title:"HRMS built for growing MSMEs",content:{intro:"Start with the essentials. Grow without the complexity.",body:"ZefoHR brings affordable, modular HR software and expert-led services together for Indian MSMEs.",benefits:["Affordable entry packages","Simple implementation","Modular suites"],faq:defaults.faq.items.slice(0,3)}},
  {slug:"solutions/attendance-management-software",title:"Attendance management software",content:{intro:"Make every workday easier to manage.",body:"Connect attendance, shifts, rosters, leave, overtime, biometric devices, GPS and field-force tracking with your wider HR platform.",benefits:["Connected time and attendance","Flexible workforce management","Less manual administration"],faq:defaults.faq.items.slice(0,3)}},
];
