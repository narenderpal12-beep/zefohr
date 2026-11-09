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
