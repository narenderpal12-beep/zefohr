import type {Doc} from "./store";
import {sampleMediaItems, sampleUseCases} from "./sample-content";

const companyLinks=[
  {label:"About us",href:"/about"},{label:"Careers",href:"/careers"},
  {label:"Our support",href:"/support"},{label:"Request a demo",href:"/request-demo"},
];
const resourceLinks=[
  {label:"Blog",href:"/blog"},{label:"Media coverage",href:"/media-coverage"},
  {label:"Use cases",href:"/case-studies"},{label:"FAQs",href:"/faq"},
];
export function marketingDefaults(suites:Doc[],services:Doc[],complianceNote:string):Doc{
  const suiteLink=(s:Doc)=>({label:s.title,href:`/features/${s.slug}`,description:s.description,icon:s.icon});
  const serviceLink=(s:Doc)=>({label:s.title,href:`/services/${s.slug}`,description:s.description,icon:s.icon});
  return {
    brand:{name:"PeopleHub",tagline:"People-first HR. Business-ready possibilities.",logoUrl:"",logoAlt:"PeopleHub logo",showWordmark:true},
    theme:{preset:"aurora",defaultMode:"dark",allowModeToggle:true,customColors:false,primary:"#8b5cf6",cyan:"#22d3ee",pink:"#ec4899",background:"#090b13",containerLayout:"standard",customContainerWidth:1440},
    nav:{
      brand:"PeopleHub",loginLabel:"Log in",ctaLabel:"Start free trial",
      links:[{label:"Products",href:"/features"},{label:"Services",href:"/services"},{label:"Pricing",href:"/pricing"},{label:"Resources",href:"/blog"},{label:"Company",href:"/about"}],
      megaMenu:[
        {label:"Products",href:"/features",groups:[
          {title:"HR, time & payroll",links:suites.slice(0,3).map(suiteLink)},
          {title:"Talent & experience",links:suites.slice(3,7).map(suiteLink)},
          {title:"Operations & governance",links:suites.slice(7).map(suiteLink)},
        ]},
        {label:"Services",href:"/services",groups:[
          {title:"Compliance & administration",links:services.slice(0,4).map(serviceLink)},
          {title:"People & outsourcing",links:services.slice(4,7).map(serviceLink)},
          {title:"Learning & growth",links:services.slice(7).map(serviceLink)},
        ]},
        {label:"Pricing",href:"/pricing",groups:[]},
        {label:"Resources",href:"/blog",groups:[{title:"Explore & learn",links:resourceLinks}]},
        {label:"Company",href:"/about",groups:[{title:"PeopleHub",links:companyLinks}]},
      ],
      themeToggleLabel:"Switch colour mode",lightLabel:"Light",darkLabel:"Dark",
    },
    footer:{
      adminLoginLabel:"Admin Panel",
      description:"People-first HR. Business-ready possibilities.\nBuilt for India. Built for you.",complianceNote,copyright:"All rights reserved.",
      columns:[
        {title:"Products",links:suites.slice(0,5).map(suiteLink)},
        {title:"More suites",links:suites.slice(5).map(suiteLink)},
        {title:"Services",links:services.map(serviceLink)},
        {title:"Company",links:companyLinks},
        {title:"Resources",links:resourceLinks},
      ],
      socials:[
        {platform:"instagram",label:"Instagram",url:"",enabled:true},
        {platform:"linkedin",label:"LinkedIn",url:"",enabled:true},
        {platform:"facebook",label:"Facebook",url:"",enabled:true},
        {platform:"twitter",label:"X / Twitter",url:"",enabled:true},
      ],
      socialUnavailableMessage:"Social profile will be available soon.",
      socialHeading:"Stay connected",legalHeading:"Legal",contactHeading:"Get in touch",
      demoLabel:"Find the right fit for your team",demoButton:"Request a demo",
      links:[{label:"Privacy policy",href:"/privacy-policy"},{label:"Terms of service",href:"/terms"},{label:"Contact",href:"/contact"}],
    },
    whatsapp:{
      enabled:true,phone:"+919311638356",message:"Hello, I would like to learn more about PeopleHub.",
      label:"Chat on WhatsApp",unconfiguredLabel:"Contact our team",fallbackHref:"/contact",
    },
    homepageV2:{
      announcement:{enabled:true,label:"PEOPLEHUB",text:"A clearer way to explore people operations for growing Indian teams.",linkLabel:"Talk to our team",href:"/request-demo",dismissLabel:"Dismiss announcement"},
      hero:{
        eyebrow:"PEOPLE-FIRST HR, BUILT FOR INDIA",
        title:"Make room for people. We’ll help with the rest.",
        description:"People operations get more complex as your business grows. Explore modular HR software direction and specialist services, then choose a sensible next step.",
        primaryLabel:"Start your free trial",primaryHref:"/register?mode=trial",secondaryLabel:"Find your starting point",secondaryHref:"#path",
        currentNote:"Available now: organisation creation and free-trial signup. HRMS suites shown here are illustrative previews of planned product direction.",
      },
      approach:{title:"One partner for the people work.",points:["Choose what fits your team","Software and specialist support","Made for growing Indian businesses"]},
      stats:{
        ariaLabel:"Current PeopleHub content",
        items:[
          {key:"suites",label:"Product suites to explore"},
          {key:"services",label:"Specialist services"},
          {key:"clients",label:"Client logos"},
          {key:"articles",label:"Published articles"},
        ],
        note:"Counts reflect the current public content and can change as the site is updated.",
      },
      path:{
        eyebrow:"A CLEARER WAY TO BEGIN",title:"Start with the work in front of you.",
        description:"You don’t need to choose an entire HR stack on day one. Start with the people challenge taking your team’s time, then take the next step that makes sense.",
        steps:[
          {title:"See how PeopleHub fits",description:"Explore the product direction and specialist services. Product screens are illustrative, not an active HRMS.",label:"Explore",linkLabel:"Explore the platform",href:"#explore"},
          {title:"Create your organisation",description:"Start a free-trial signup and set up your organisation. Operational HRMS suites are planned, not currently live.",label:"Get started",linkLabel:"Start free trial",href:"/register?mode=trial"},
          {title:"Find the right support",description:"Discuss your team’s needs with our people—from HR operations to recruitment and compliance support.",label:"Talk it through",linkLabel:"Talk to our team",href:"/request-demo"},
        ],
      },
      product:{
        eyebrow:"EXPLORE THE PRODUCT DIRECTION",title:"People work, in connected parts.",
        description:"Move between the areas a growing team may need. Each screen is a code-built illustration of a planned product suite—not a live capability.",
        disclosureTitle:"Planned HRMS suites",
        disclosure:"These employee, time, payroll and talent screens are illustrative concepts. They do not process real employee data or transactions.",
        tabsLabel:"Explore product suites",plannedLabel:"Planned suite",learnMoreLabel:"Explore this suite",
        emptyPreview:"Add product suites in Admin to show a product preview.",
        visualCaption:"A considered view of what’s ahead",visualTag:"Illustrative product concept",
      },
      roles:{
        eyebrow:"MADE FOR THE WORK YOU DO",title:"Find your starting point.",
        description:"Choose a role to see which parts of the people journey may matter most to you.",
        selectorLabel:"Choose a role",suiteLinksLabel:"Explore the planned suites that connect to this kind of work:",
        items:[
          {name:"People and HR",description:"Keep everyday people processes easier to understand and coordinate.",suiteKeys:["core_hrms","engagement","governance_compliance"]},
          {name:"Finance leaders",description:"Explore how payroll inputs, reviews and specialist support could connect.",suiteKeys:["payroll_compliance","time_workforce","extended_hr_services"]},
          {name:"Payroll admins",description:"See planned payroll inputs, review steps and compliance records.",suiteKeys:["payroll_compliance","governance_compliance"]},
          {name:"Team leaders",description:"See planned tools for workforce schedules, employee milestones and team growth.",suiteKeys:["time_workforce","performance_talent","recruitment_ats"]},
          {name:"Employees",description:"Explore planned self-service, workplace updates and employee support.",suiteKeys:["core_hrms","engagement","learning_development"]},
          {name:"IT and operations",description:"Review planned workspace structure, access, integrations and operational tools.",suiteKeys:["core_hrms","hr_operations","governance_compliance"]},
        ],
      },
      lifecycle:{
        eyebrow:"FROM FIRST DAY TO WHAT’S NEXT",title:"Follow the employee journey.",
        description:"Explore planned capabilities across common people milestones. The screens are illustrative product direction, not live employee workflows.",
        selectorLabel:"Employee journey stages",plannedLabel:"A planned capability",
        disclosure:"Illustrative product direction, not an operational employee workflow.",linkPrefix:"Explore",
        phases:[
          {title:"Plan and hire",description:"Explore planned recruitment, candidate and joining workflows.",suiteKey:"recruitment_ats"},
          {title:"Welcome and organise",description:"Explore planned employee records, onboarding and self-service.",suiteKey:"core_hrms"},
          {title:"Support the workday",description:"Explore planned time, attendance, shifts and leave.",suiteKey:"time_workforce"},
          {title:"Recognise and grow",description:"Explore planned feedback, learning and talent development.",suiteKey:"performance_talent"},
        ],
      },
      ai:{
        eyebrow:"A HUMAN-CENTRED VIEW OF AI",title:"Useful assistance, with people in control.",
        description:"Explore planned AI-assisted ideas for everyday HR work. These concept interactions do not process real employee data or make decisions.",
        prompts:[
          {prompt:"What could help a new hire feel prepared?",answer:"A future onboarding guide could bring together first-week tasks, people to meet and the policies a new team member may need to review."},
          {prompt:"How might a team prepare for a review cycle?",answer:"A future planning assistant could help organise review dates, goal-setting steps and reminders for managers and employees."},
          {prompt:"Where could payroll review begin?",answer:"A future payroll workspace could help teams organise inputs and review steps. Statutory obligations still require qualified expertise."},
        ],
        items:[
          {title:"Ask",description:"Find a clear starting point for everyday people questions."},
          {title:"Organise",description:"Explore how routine steps could be easier to coordinate."},
          {title:"Anticipate",description:"Bring upcoming milestones and reminders into view."},
        ],
        disclosure:"Illustrative assistant preview. No AI request is sent and no employee information is processed.",
        assistantLabel:"Assistant concept",previewLabel:"Preview only",emptyPromptLabel:"Choose a question to explore",promptListLabel:"Example questions",
      },
      comparison:{
        eyebrow:"A MORE CONNECTED WAY TO EXPLORE",title:"Less chasing. More clarity.",
        description:"A practical comparison of common coordination challenges and the connected product direction PeopleHub is planning.",
        leftTitle:"Common coordination challenge",rightTitle:"PeopleHub direction",
        rows:[
          {challenge:"People details live in separate places.",approach:"A planned people workspace brings key records and milestones into one view."},
          {challenge:"Teams repeat the same handoffs.",approach:"Planned workflows aim to make ownership and next steps easier to follow."},
          {challenge:"Specialist questions need context.",approach:"Software exploration sits alongside specialist services and human conversations."},
        ],
      },
      industries:{
        eyebrow:"BUILT FOR GROWING TEAMS",title:"People operations for the way you work.",
        description:"Explore common operating contexts and discuss the right fit for your organisation.",
        linkLabel:"Discuss your needs",linkHref:"/request-demo",
        items:[
          {title:"Retail and distribution",description:"Coordinate people across locations, shifts and customer-facing teams."},
          {title:"Manufacturing and logistics",description:"Explore workforce planning for teams working across sites and schedules."},
          {title:"Professional services",description:"Keep hiring, people records and development in view as teams grow."},
          {title:"Hospitality and education",description:"Bring people processes into a clearer rhythm across busy workdays."},
          {title:"Healthcare and pharma",description:"Explore people workflows for regulated teams and varied work schedules."},
          {title:"Banking and financial services",description:"Discuss structured people operations across specialist and distributed teams."},
          {title:"Technology and SaaS",description:"Support hiring, onboarding and development as teams evolve."},
          {title:"Staffing and recruitment",description:"Coordinate hiring activity and people administration across engagements."},
          {title:"Construction and infrastructure",description:"Explore people coordination for project-based, multi-location teams."},
        ],
      },
      services:{
        contextNote:"Sometimes the right answer is a person, not another platform. Service scope is discussed with your team.",
        itemLabel:"SERVICE",allLabel:"Explore specialist services",allHref:"/services",
      },
      tools:{
        eyebrow:"PRACTICAL HR RESOURCES",title:"Clearer answers for everyday HR questions.",
        description:"Explore practical resources for common HR decisions. For organisation-specific guidance, our team can help you find the right next step.",
        ctaLabel:"Talk through a question",ctaHref:"/request-demo",
        items:[
          {title:"People cost planning",description:"Understand the inputs behind a workforce budget."},
          {title:"Leave and exit planning",description:"Review the information teams commonly need to prepare."},
          {title:"Payroll questions",description:"Organise questions to discuss with your payroll specialist."},
          {title:"Hiring and onboarding",description:"Map the steps your team may want to plan before a new hire joins."},
        ],
      },
      security:{
        eyebrow:"RESPONSIBLE BY DESIGN",title:"Clear about data, support and scope.",
        description:"PeopleHub is an early-stage platform. Discuss your security and data requirements with the team before onboarding sensitive employee information.",
        points:["Account passwords are hashed and access is role-based.","Organisation records are scoped to the relevant organisation.","EOR, POSH, FRRO and labour-law matters require appropriate specialist expertise."],
      },
      learning:{
        eyebrow:"IDEAS FOR PEOPLE TEAMS",title:"Keep learning as your team grows.",
        description:"Read practical perspectives on people operations, payroll and compliance.",
        emptyTitle:"Explore the PeopleHub blog",
        emptyDescription:"Visit the resource hub for the latest articles and guides.",
        readLabel:"Read article",visitLabel:"Visit the resource hub",emptyLinkLabel:"Visit the blog",
      },
      pricing:{
        eyebrow:"A PRACTICAL FIRST STEP",title:"Choose how to continue.",
        description:"Current organisation signup is available for a free-trial journey. Product pricing and operational suite availability should be confirmed with PeopleHub.",
        cycleLabel:"Billing cycle",noPriceLabel:"Talk to our team",unitLabel:"/ employee / month",
        priceNote:"Plan details are managed by PeopleHub and can be confirmed with the team.",
      },
      faq:{eyebrow:"GOOD QUESTIONS, CLEAR ANSWERS",title:"Before you take the next step.",supportPrompt:"Still deciding what fits?",supportLabel:"Talk to our team",supportHref:"/contact"},
      finalCta:{
        title:"Let’s find your people platform.",
        description:"Tell us where you are today. We’ll help you work out what comes next.",
        primaryLabel:"Talk to our team",primaryHref:"/request-demo",secondaryLabel:"Start free trial",secondaryHref:"/register?mode=trial",
      },
    },
    media:{
      eyebrow:"IN THE CONVERSATION",title:"PeopleHub in the media.",
      description:"Editorial topics are shown for layout illustration only. They are not verified third-party coverage.",
      emptyMessage:"Verified media coverage will be published here when available.",
      items:sampleMediaItems,linkLabel:"Read coverage",
      pressTitle:"Press enquiries",pressDescription:"For interviews, company information or press enquiries, contact our team.",pressButton:"Contact our team",
    },
    caseStudies:{
      eyebrow:"WORKFLOWS",title:"Use cases for people-first teams.",
      description:"These use cases describe possible workflows, not actual customers, implementations or measured results.",
      emptyMessage:"Use cases will appear here as they are prepared.",
      items:sampleUseCases,linkLabel:"Explore the use case",backLabel:"All use cases",ctaLabel:"Request a demo",
    },
    careers:{
      eyebrow:"BUILD BETTER WORK WITH US",title:"Your next chapter could start here.",
      description:"Help growing businesses put their people first. Discover opportunities with PeopleHub.",
      emptyMessage:"There are no published vacancies right now. Contact our team to register your interest.",
      items:[],applyLabel:"Apply for this role",interestLabel:"Introduce yourself",contactDescription:"Tell us about your experience and the work you would love to do.",
    },
    support:{
      eyebrow:"WE'RE HERE TO HELP",title:"Support for your next step.",
      description:"Get help with your account, organisation setup, plans or platform questions.",
      formTitle:"How can we help?",button:"Send support request",sendingLabel:"Sending...",sendAnotherLabel:"Send another",optionalLabel:"optional",topicLabel:"Topic",messageLabel:"How can we help?",faqTitle:"Common questions",emptyFaqMessage:"Send us your question using the form and our team will respond.",successMessage:"Your support request has been received. Our team will follow up using the contact details you provided.",
      faq:[
        {question:"How do I access my organisation?",answer:"Sign in using the email and password used to create your organisation, then open your dashboard."},
        {question:"Where can I view my trial or subscription?",answer:"Your organisation dashboard shows your plan, subscription status, trial period and enabled suites."},
        {question:"Can I get help with implementation?",answer:"Send a support request describing your team and requirements. Our team can discuss onboarding and implementation support."},
      ],
    },
    demo:{
      eyebrow:"SEE WHAT'S POSSIBLE",title:"Let's find your people platform.",
      description:"Tell us about your organisation and what you want to simplify. Our team will arrange a conversation tailored to your needs.",
      benefits:["Explore the suites relevant to your organisation","Discuss payroll and compliance requirements","Understand pricing and implementation","Plan your next steps with our team"],
      formTitle:"Request your demo",successMessage:"Thank you. Your demo request has been received. Our team will contact you to arrange a suitable time.",
      button:"Request a demo",sendingLabel:"Sending...",sendAnotherLabel:"Send another",optionalLabel:"optional",teamSizeLabel:"Team size",messageLabel:"What would you like to explore?",note:"This submits a demo enquiry. No meeting is booked or payment collected automatically.",
    },
  };
}

export const additionalMarketingPages=[
  {slug:"media-coverage",title:"Media coverage",section:"media",intro:"Editorial topics are clearly marked until verified coverage is available."},
  {slug:"case-studies",title:"Use cases",section:"caseStudies",intro:"Workflows for different teams; not customer stories or performance claims."},
  {slug:"careers",title:"Careers at PeopleHub",section:"careers",intro:"Explore opportunities to help build better work."},
  {slug:"career",title:"Careers at PeopleHub",section:"careers",intro:"Explore opportunities to help build better work."},
  {slug:"support",title:"Our support",section:"support",intro:"Get help with your account, plans and organisation setup."},
  {slug:"our-support",title:"Our support",section:"support",intro:"Get help with your account, plans and organisation setup."},
  {slug:"request-demo",title:"Request a demo",section:"demo",intro:"Explore the right PeopleHub suites for your organisation."},
  {slug:"request-for-demo",title:"Request a demo",section:"demo",intro:"Explore the right PeopleHub suites for your organisation."},
].map(p=>({slug:p.slug,title:p.title,content:{intro:p.intro,body:"",section:p.section,benefits:[],faq:[]}}));
