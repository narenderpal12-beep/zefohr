import { pool, publicData, fail, type Doc, transaction, audit } from "./store";
import sanitizeHtml from "sanitize-html";

type RouteDef = {path:string,type:string,titleFrom:string|((data:Doc)=>string),descFrom?:string|((data:Doc)=>string)};
const registry: RouteDef[]=[];
export function registerSeoRoute(route: RouteDef) {
  if(!registry.some(r=>r.path===route.path)) registry.push(route);
}
for(const [path,type,title] of [
  ["/","static","HR, payroll and compliance for Indian businesses"],["/features","static","All-in-one HRMS platform"],
  ["/services","static","Specialised HR services"],["/pricing","static","Flexible HRMS pricing"],
  ["/about","static","People-first HR for growing businesses"],["/contact","static","Contact our people team"],
  ["/about-us","static","People-first HR for growing businesses"],
  ["/faq","static","PeopleHub frequently asked questions"],["/blog","static","HR insights and resources"],
  ["/register","app_public","Create your organisation"],["/login","app_public","Sign in"],
  ["/dashboard","app_public","Organisation dashboard"],["/admin","app_public","Site administration"],["/admin/seo","app_public","SEO Manager"],
  ["/features/:slug","suite","%title%"],["/services/:slug","service","%title%"],["/blog/:slug","blog","%title%"],["/case-studies/:slug","case_study","%title%"],
]) registerSeoRoute({path,type,titleFrom:title});
export const appPath = (path:string)=>/^\/(admin|dashboard|login|register)(\/|$)/.test(path);
const pathSchema = /^\/[a-zA-Z0-9/_:.-]*$/;
export function cleanPath(path: unknown) {
  if(typeof path!=="string" || !pathSchema.test(path) || path.includes("..") || path.includes("//") || path.length>500) fail("Enter a valid local path starting with /");
  return path.length>1 ? path.replace(/\/+$/,"") : path;
}
export function sanitizeHead(html: string) {
  return sanitizeHtml(html,{allowedTags:["meta","link"],allowedAttributes:{meta:["name","content","property"],link:["rel","href","type","sizes"]},allowedSchemes:["https","http"],allowProtocolRelative:false});
}
export function validJsonLd(value:any) {
  if(value==null || value==="") return null;
  if(typeof value==="string"){try{value=JSON.parse(value);}catch{fail("Invalid JSON-LD");}}
  if(typeof value!=="object") fail("JSON-LD must be a JSON object or array.");
  if(JSON.stringify(value).length>100000) fail("JSON-LD is too large.");
  return value;
}
export async function getSettings() {
  const row=(await pool.query("SELECT * FROM seo_settings WHERE id=1")).rows[0];
  return row ?? {site_name:"PeopleHub",site_url:process.env.SITE_URL??"",default_title_template:"%page% | %site%",default_meta_description:"Connected HR, payroll and compliance for growing Indian businesses.",default_og_image_url:"/og-default.svg",organisation_schema:{},sitemap_enabled:true};
}
export async function routeCatalogue(data?:Doc) {
  const d=data ?? await publicData();
  const result:Doc[]=[];
  for(const r of registry) result.push({path:r.path,page_type:r.type,title:typeof r.titleFrom==="function"?r.titleFrom(d):r.titleFrom,description:typeof r.descFrom==="function"?r.descFrom(d):r.descFrom??`${typeof r.titleFrom==="string"?r.titleFrom:"PeopleHub"}. Explore connected HR software and expert-led support for growing Indian businesses.`,pattern:r.path.includes(":")});
  for(const s of d.content.suites.items) result.push({path:`/features/${s.slug}`,page_type:"suite",title:s.title,description:s.description,item:s});
  for(const s of d.content.services.items) result.push({path:`/services/${s.slug}`,page_type:"service",title:s.title,description:s.description,item:s});
  for(const p of d.pages) result.push({path:`/${p.slug.replace(/^\/+/,"")}`,page_type:"landing",title:p.title,description:p.content?.intro||p.content?.body?.slice(0,155),item:p});
  for(const p of d.posts) result.push({path:`/blog/${p.slug}`,page_type:"blog",title:p.title,description:p.excerpt,item:p});
  for(const [i,p] of (d.content.caseStudies?.items??[]).entries()){
    if(p.title)result.push({path:`/case-studies/${p.slug||`story-${i+1}`}`,page_type:"case_study",title:p.title,description:p.summary,item:p});
  }
  for(const [slug,p] of Object.entries(d.content.legal) as [string,Doc][]) result.push({path:`/${slug}`,page_type:"legal",title:p.title,description:p.body.slice(0,155),item:p});
  return result;
}
let discoverAt=0;
let discovery:Promise<void>|null=null;
export function invalidateSeo(){ discoverAt=0; cache.clear(); }
export async function discoverPages(data?:Doc) {
  if(discovery) return discovery;
  if(Date.now()-discoverAt<3000) return;
  discovery=(async()=>{
    const routes=await routeCatalogue(data);
    await transaction(async client=>{
      await client.query("UPDATE seo_pages SET discovered=false WHERE discovered=true");
      for(const r of routes){
        const noindex=appPath(r.path)||r.pattern;
        await client.query("INSERT INTO seo_pages(path,page_type,robots,include_in_sitemap,schema_type) VALUES($1,$2,$3,$4,$5) ON CONFLICT(path) DO UPDATE SET discovered=true,page_type=excluded.page_type",[r.path,r.page_type,noindex?"noindex,follow":"index,follow",!noindex,r.page_type==="blog"?"Article":r.page_type==="service"?"Service":r.path==="/pricing"?"SoftwareApplication":r.path==="/faq"||r.page_type==="suite"?"FAQPage":"WebPage"]);
      }
    });
    discoverAt=Date.now();
  })();
  try {await discovery;} finally {discovery=null;}
}
const cache=new Map<string,{at:number,value:Doc}>();
const hasText=(v:any)=>typeof v==="string" && v.trim()!=="";
export function seoScore(seo:Doc) {
  const checklist=[
    {label:"Title is 1–60 characters",ok:!!seo.title && seo.title.length<=60},
    {label:"Description is 50–160 characters",ok:seo.meta_description?.length>=50 && seo.meta_description.length<=160},
    {label:"Canonical is set",ok:!!seo.canonical_url},
    {label:"Focus keyword in title",ok:!!seo.focus_keyword && seo.title?.toLowerCase().includes(seo.focus_keyword.toLowerCase())},
    {label:"Focus keyword in description",ok:!!seo.focus_keyword && seo.meta_description?.toLowerCase().includes(seo.focus_keyword.toLowerCase())},
    {label:"Focus keyword in H1",ok:!!seo.focus_keyword && seo.h1?.toLowerCase().includes(seo.focus_keyword.toLowerCase())},
    {label:"One H1 in page template",ok:true},
    {label:"Descriptive image alt text",ok:seo.image_alt_ok!==false},
    {label:"Internal links present",ok:true},
    {label:"Social share image is set",ok:!!seo.og_image_url},
  ];
  return {score:checklist.filter(c=>c.ok).length*10,checklist,suggestions:checklist.filter(c=>!c.ok).map(c=>c.label)};
}
export async function resolveSeo(path:string,data?:Doc,origin?:string) {
  const settings=await getSettings();
  const base=(settings.site_url || process.env.SITE_URL || origin || "").replace(/\/$/,"");
  const cacheKey=path+":"+base;
  const hit=cache.get(cacheKey);
  if(!data && hit && Date.now()-hit.at<2000) return hit.value;
  const d=data ?? await publicData();
  const catalog=await routeCatalogue(d);
  const match=catalog.find(r=>r.path===path && !r.pattern);
  const pattern=catalog.find(r=>r.pattern && new RegExp("^"+r.path.replace(/:[^/]+/g,"[^/]+")+"$").test(path));
  const rows=(await pool.query("SELECT * FROM seo_pages WHERE path = ANY($1::text[])",[[path,pattern?.path??path]])).rows;
  const exact=rows.find(r=>r.path===path)??{};
  const inherited=rows.find(r=>r.path===pattern?.path)??{};
  const get=(key:string,fallback:any)=>hasText(exact[key])?exact[key]:hasText(inherited[key])?inherited[key]:fallback;
  const pageTitle=match?.title??"Page not found";
  const templatedTitle=(settings.default_title_template||"%page% | %site%").replace(/%page%/g,pageTitle).replace(/%site%/g,settings.site_name||d.content.nav.brand);
  const title=get("title",templatedTitle).replace(/%title%/g,pageTitle);
  const description=get("meta_description",match?.description||settings.default_meta_description);
  let robots=get("robots","index,follow");
  if((appPath(path) && !exact.explicit_index_override)||!match) robots="noindex,follow";
  const canonical=get("canonical_url",base+path);
  const image=get("og_image_url",settings.default_og_image_url||"/og-default.svg");
  const result:Doc={...inherited,...exact,path,title,meta_description:description,canonical_url:canonical,robots,
    og_title:get("og_title",title),og_description:get("og_description",description),
    og_image_url:image.startsWith("/")?base+image:image,twitter_card:get("twitter_card","summary_large_image"),
    focus_keyword:get("focus_keyword",""),h1:path==="/"?d.content.hero.title:pageTitle,
    schema_type:get("schema_type","WebPage"),page_type:match?.page_type??"static",
    include_in_sitemap:!!match&&!appPath(path)&&!robots.includes("noindex")&&(exact.include_in_sitemap??true),
    sitemap_priority:exact.sitemap_priority??0.7,changefreq:exact.changefreq??"weekly",
    image_alt_ok:match?.page_type!=="blog"||!match.item.cover_image_url||!!match.item.cover_image_alt,found:!!match,settings,
  };
  const schema:Doc[]=[
    {"@context":"https://schema.org","@type":"Organization",name:settings.site_name||d.content.nav.brand,url:base,...settings.organisation_schema},
    {"@context":"https://schema.org","@type":"WebSite",name:settings.site_name||d.content.nav.brand,url:base},
    {"@context":"https://schema.org","@type":"WebPage",name:title,description,url:canonical},
  ];
  if(path!=="/" && match) schema.push({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:base+"/"},{"@type":"ListItem",position:2,name:pageTitle,item:canonical}]});
  if(path==="/pricing") schema.push({"@context":"https://schema.org","@type":"SoftwareApplication",name:d.content.nav.brand,applicationCategory:"BusinessApplication",operatingSystem:"Web",offers:d.content.pricing.plans.filter((p:Doc)=>p.monthly!=null).map((p:Doc)=>({"@type":"Offer",name:p.name,price:p.monthly,priceCurrency:"INR",description:"Per employee per month"}))});
  const faq=path==="/faq"?d.content.faq.items:match?.item?.faq??match?.item?.content?.faq;
  if((result.schema_type==="FAQPage" || faq) && faq?.length) schema.push({"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map((f:Doc)=>({"@type":"Question",name:f.question,acceptedAnswer:{"@type":"Answer",text:f.answer}}))});
  if(match?.page_type==="blog") schema.push({"@context":"https://schema.org","@type":"Article",headline:match.item.title,description:match.item.excerpt,datePublished:match.item.published_at,author:{"@type":"Person",name:match.item.author||d.content.nav.brand},image:match.item.cover_image_url||result.og_image_url});
  if(result.schema_type==="Service") schema.push({"@context":"https://schema.org","@type":"Service",name:pageTitle,description,provider:{"@type":"Organization",name:d.content.nav.brand}});
  const custom=exact.custom_jsonld??inherited.custom_jsonld;
  if(custom) schema.push(...(Array.isArray(custom)?custom:[custom]));
  result.jsonld=schema;Object.assign(result,seoScore(result));
  cache.set(cacheKey,{at:Date.now(),value:result});
  return result;
}
export const escapeHtml=(s:any)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export function renderHead(seo:Doc) {
  const e=escapeHtml;const s=seo.settings;
  let head=`<title>${e(seo.title)}</title><meta name="description" content="${e(seo.meta_description)}"><link rel="canonical" href="${e(seo.canonical_url)}"><meta name="robots" content="${e(seo.robots)}">`;
  for(const [name,value] of Object.entries({"og:title":seo.og_title,"og:description":seo.og_description,"og:image":seo.og_image_url,"og:url":seo.canonical_url,"og:type":seo.page_type==="blog"?"article":"website"}))head+=`<meta property="${name}" content="${e(value)}">`;
  for(const [name,value] of Object.entries({"twitter:card":seo.twitter_card,"twitter:title":seo.og_title,"twitter:description":seo.og_description,"twitter:image":seo.og_image_url,"twitter:site":s.twitter_handle}))head+=`<meta name="${name}" content="${e(value)}">`;
  head+=`<link rel="icon" href="${e(s.favicon_url||"/favicon.svg")}"><script type="application/ld+json">${JSON.stringify(seo.jsonld).replace(/</g,"\\u003c")}</script>`;
  if(s.gsc_verification) head+=`<meta name="google-site-verification" content="${e(s.gsc_verification)}">`;
  if(s.bing_verification) head+=`<meta name="msvalidate.01" content="${e(s.bing_verification)}">`;
  if(/^G-[A-Z0-9]+$/.test(s.ga4_id||"")) head+=`<script async src="https://www.googletagmanager.com/gtag/js?id=${s.ga4_id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${s.ga4_id}');</script>`;
  return head+sanitizeHead(s.extra_head_html||"");
}
export async function sitemap(origin:string,part?:number) {
  const data=await publicData();await discoverPages(data);
  const settings=await getSettings();
  const base=(settings.site_url||process.env.SITE_URL||origin).replace(/\/$/,"");
  if(!settings.sitemap_enabled) return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
  const catalog=(await routeCatalogue(data)).filter(r=>!r.pattern&&!appPath(r.path));
  const overrides=(await pool.query("SELECT * FROM seo_pages WHERE discovered=true")).rows;
  const pages=catalog.filter(r=>{const s=overrides.find(s=>s.path===r.path);return s?.include_in_sitemap!==false&&!s?.robots?.includes("noindex");});
  if(pages.length>50000 && !part) return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({length:Math.ceil(pages.length/50000)},(_,i)=>`<sitemap><loc>${escapeHtml(base)}/sitemap-${i+1}.xml</loc></sitemap>`).join("")}</sitemapindex>`;
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.slice(part?((part-1)*50000):0,part?part*50000:50000).map(r=>{const s=overrides.find(s=>s.path===r.path);return `<url><loc>${escapeHtml(base+r.path)}</loc><lastmod>${new Date(r.item?.updated_at??s?.updated_at??Date.now()).toISOString()}</lastmod><changefreq>${escapeHtml(s?.changefreq||"weekly")}</changefreq><priority>${Number(s?.sitemap_priority??0.7)}</priority></url>`;}).join("")}</urlset>`;
}
export async function robots(origin:string) {
  const s=await getSettings();
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api\nDisallow: /login\nDisallow: /register\n${s.robots_extra_rules||""}\nSitemap: ${(s.site_url||process.env.SITE_URL||origin).replace(/\/$/,"")}/sitemap.xml\n`;
}
const seoFields=["title","meta_description","canonical_url","robots","og_title","og_description","og_image_url","twitter_card","focus_keyword","schema_type","custom_jsonld","include_in_sitemap","sitemap_priority","changefreq","explicit_index_override"];
export async function updateSeo(id:string,input:Doc,actor:string) {
  const before=(await pool.query("SELECT * FROM seo_pages WHERE id=$1",[id])).rows[0];
  if(!before) fail("SEO page not found",404);
  const next:Doc={...before};
  for(const k of seoFields) if(input[k]!==undefined) next[k]=input[k];
  next.custom_jsonld=validJsonLd(next.custom_jsonld);
  if(!["WebPage","FAQPage","Article","SoftwareApplication","Service"].includes(next.schema_type))fail("Invalid schema type");
  if(!["index,follow","noindex,follow","index,nofollow","noindex,nofollow","index, follow","noindex, follow","index, nofollow","noindex, nofollow"].includes(next.robots))fail("Invalid robots setting");
  if(appPath(before.path)&&!next.explicit_index_override){next.robots="noindex,follow";next.include_in_sitemap=false;}
  if(!["always","hourly","daily","weekly","monthly","yearly","never"].includes(next.changefreq))fail("Invalid sitemap frequency");
  if(!Number.isFinite(Number(next.sitemap_priority))||Number(next.sitemap_priority)<0||Number(next.sitemap_priority)>1)fail("Priority must be 0–1");
  for(const k of ["canonical_url","og_image_url"]) if(next[k] && !/^https?:\/\//.test(next[k]) && !next[k].startsWith("/"))fail(`Invalid ${k}`);
  return transaction(async client=>{
    await client.query("INSERT INTO seo_page_history(seo_page_id,value,updated_by) VALUES($1,$2,$3)",[id,JSON.stringify(before),actor]);
    const values=seoFields.map(k=>k==="custom_jsonld"?(next[k]?JSON.stringify(next[k]):null):next[k]);
    const row=(await client.query(`UPDATE seo_pages SET ${seoFields.map((k,i)=>`${k}=$${i+1}`).join(",")},updated_at=now(),updated_by=$${values.length+1} WHERE id=$${values.length+2} RETURNING *`,[...values,actor,id])).rows[0];
    await audit(client,actor,"seo.update",before.path,before,row);
    invalidateSeo();return row;
  });
}
