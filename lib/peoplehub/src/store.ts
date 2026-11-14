import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { defaults, defaultPages } from "./defaults";
import bcrypt from "bcryptjs";
import { appendMissingSamples, renameLegacyCaseStudyLinks, withoutRefundPolicyLinks } from "./content-normalizers";
import { samplePosts, sampleMediaItems, sampleUseCases } from "./sample-content";

export { pool };
export type Doc = Record<string, any>;
export function fail(message: string, status = 400): never { throw Object.assign(new Error(message), {status}); }
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const out = await fn(client); await client.query("COMMIT"); return out; }
  catch(error) { await client.query("ROLLBACK"); throw error; }
  finally {client.release();}
}
export async function audit(client: any, actor: string | null, action: string, entity: string, before: any, after: any) {
  await client.query('INSERT INTO audit_log(actor,action,entity,"before","after") VALUES($1,$2,$3,$4,$5)',[actor,action,entity,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after)]);
}
function merge(base: any, over: any): any {
  if (over === undefined) return base;
  if(Array.isArray(over) || typeof over !== "object" || over === null) return over;
  const result = {...base};
  for(const key of Object.keys(over)) result[key] = merge(base?.[key],over[key]);
  return result;
}
export async function getContent(): Promise<Doc> {
  const rows = await pool.query("SELECT key,value FROM site_content");
  const content = structuredClone(defaults);
  for(const row of rows.rows) if(!row.key.startsWith("sample_content_v"))content[row.key] = merge(content[row.key],row.value);
  // Collections replace arrays when merging. Add imagery to older records by
  // stable identity, without replacing copy, order, uploaded images or removals.
  for(const key of ["suites","services"]){
    for(const item of content[key]?.items ?? []){
      const original=defaults[key].items.find((d:Doc)=>d.key===item.key || d.slug===item.slug);
      const legacyArtwork=original && item.imageUrl===`/solution-images/${original.slug}.webp`;
      if(item.imageUrl===undefined || legacyArtwork)item.imageUrl=original?.imageUrl ?? "";
      if(item.imageAlt===undefined || (legacyArtwork && typeof item.imageAlt==="string" && item.imageAlt.startsWith("Creative illustration")))item.imageAlt=original?.imageAlt ?? String(item.title ?? key);
      if(original)for(const [field,value] of Object.entries(original)){
        if(field!=="imageUrl" && field!=="imageAlt" && item[field]===undefined)item[field]=structuredClone(value);
      }
    }
  }
  const storedBrand=rows.rows.find(r=>r.key==="brand");
  if(!storedBrand && content.nav?.brand)content.brand.name=content.nav.brand;
  content.nav.brand=content.brand.name;
  content.footer=withoutRefundPolicyLinks(content.footer) as Doc;
  return content;
}
export async function publicData() {
  const [content,pages,posts] = await Promise.all([
    getContent(),pool.query("SELECT * FROM pages WHERE status='published' ORDER BY title"),
    pool.query("SELECT * FROM posts WHERE status='published' AND (published_at IS NULL OR published_at <= now()) ORDER BY published_at DESC"),
  ]);
  return {content,pages:pages.rows,posts:posts.rows};
}
export async function syncModules(client: any, organisationId: string, planKey: string, content?: Doc) {
  const cms = content ?? await getContent();
  const plan = cms.pricing.plans.find((p: Doc)=>p.key===planKey);
  if(!plan) fail("Unknown plan");
  for(let i=0;i<cms.suites.items.length;i++){
    const s = cms.suites.items[i];
    await client.query("INSERT INTO modules(key,name,description,priority,sort_order) VALUES($1,$2,$3,$4,$5) ON CONFLICT(key) DO UPDATE SET name=excluded.name,description=excluded.description,priority=excluded.priority,sort_order=excluded.sort_order",[s.key,s.title,s.description,s.priority,i]);
  }
  const all = await client.query("SELECT key FROM modules");
  for(const m of all.rows) await client.query("INSERT INTO organisation_modules(organisation_id,module_key,enabled) VALUES($1,$2,$3) ON CONFLICT(organisation_id,module_key) DO UPDATE SET enabled=excluded.enabled",[organisationId,m.key,plan.modules.includes(m.key)]);
}
export async function expireTrials() {
  await pool.query("UPDATE subscriptions SET status='expired' WHERE status='trial' AND trial_ends_at <= now()");
}
function replaceLegacyBrand(value: any, field = ""): any {
  if (typeof value === "string") {
    if (/(?:url|href|path|slug|email|uri)$/i.test(field)) return value;
    return value.split(/(https?:\/\/[^\s<>"')]+|mailto:[^\s<>"')]+|www\.[^\s<>"')]+)/gi)
      .map((part, index) => index % 2 ? part : part.replace(/\bPeopleHub\b/gi, "ZefoHR"))
      .join("");
  }
  if (Array.isArray(value)) return value.map((item) => replaceLegacyBrand(item, field));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceLegacyBrand(child, key)]));
  }
  return value;
}
export async function seed(reset=false) {
  await transaction(async client=>{
    const existingNav=(await client.query("SELECT value FROM site_content WHERE key='nav'")).rows[0]?.value;
    for(const [key,defaultValue] of Object.entries(defaults)){
      const value=key==="brand"&&existingNav?.brand&&!reset?{...defaultValue,name:existingNav.brand}:defaultValue;
      await client.query(`INSERT INTO site_content(key,value) VALUES($1,$2) ON CONFLICT(key) ${reset ? "DO UPDATE SET value=excluded.value,updated_at=now()" : "DO NOTHING"}`,[key,JSON.stringify(value)]);
    }
    // Upgrade the old profile once. Retaining an address key (even blank) lets
    // administrators clear or change these details without a restart restoring them.
    await client.query(`UPDATE site_content SET value=value || jsonb_build_object(
      'address',$1::text,'phone',COALESCE(NULLIF(value->>'phone',''),$2::text),
      'mapUrl','','officeHours',''),updated_at=now()
      WHERE key='contact' AND NOT (value ? 'address')`,
      [defaults.contact.address,defaults.contact.phone]);
    const sampleSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v1'")).rowCount;
    if(!sampleSeed){
      for(const [key,samples] of [["media",sampleMediaItems],["caseStudies",sampleUseCases]] as const){
        const row=(await client.query("SELECT value FROM site_content WHERE key=$1 FOR UPDATE",[key])).rows[0];
        const current=row?.value??defaults[key];
        const next={...current,items:appendMissingSamples(current.items,samples)};
        await client.query("INSERT INTO site_content(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()",[key,JSON.stringify(next)]);
      }
      const legalRow=(await client.query("SELECT value FROM site_content WHERE key='legal' FOR UPDATE")).rows[0];
      if(legalRow){
        const legal={...legalRow.value};
        const oldDefaults:Record<string,string>={
          "privacy-policy":"PeopleHub collects the contact, organisation and account information you submit to provide your account and respond to enquiries. We use role-based access controls to restrict access to organisation data. Contact the PeopleHub team to request access, correction or deletion of your information. This is a draft policy and must be reviewed and completed with the operator's legal details, retention periods, contact information and applicable data-protection obligations before public launch.",
          terms:"PeopleHub Phase 1 provides marketing information, organisation registration and subscription administration. HRMS business modules are planned for a later phase. Specialised services are subject to separately agreed scope and fees. Software alone does not fulfil every statutory obligation. These draft terms must be reviewed and completed with the operator's legal identity, contact details, governing law and dispute-resolution terms before public launch.",
        };
        for(const slug of ["privacy-policy","terms"]){
          const existing=legal[slug]??{};
          legal[slug]={
            ...existing,
            ...(existing.body===oldDefaults[slug]?{body:defaults.legal[slug].body}:{}),
            reviewNotice:existing.reviewNotice||defaults.legal[slug].reviewNotice,
          };
        }
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='legal'",[JSON.stringify(legal)]);
      }
      for(const post of samplePosts){
        await client.query(
          "INSERT INTO posts(slug,title,excerpt,body_md,cover_image_url,cover_image_alt,author,tags,status,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'published',$9) ON CONFLICT(slug) DO NOTHING",
          [post.slug,post.title,post.excerpt,post.body_md,post.cover_image_url,post.cover_image_alt,post.author,post.tags,post.published_at],
        );
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v1','{\"seeded\":true}'::jsonb)");
    }
    const copySeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v2'")).rowCount;
    if(!copySeed){
      const oldCopy:Record<string,Record<string,string>>={
        media:{description:"News, announcements and independent perspectives about PeopleHub."},
        caseStudies:{
          eyebrow:"REAL TEAMS. REAL POSSIBILITIES.",
          title:"Stories built around people.",
          description:"Explore customer experiences and implementation stories when verified case studies are available.",
          emptyMessage:"We're preparing our first verified customer stories. Check back soon, or request a demo to explore the platform.",
          linkLabel:"Read the story",
          backLabel:"All case studies",
        },
      };
      for(const [key,fields] of Object.entries(oldCopy)){
        const row=(await client.query("SELECT value FROM site_content WHERE key=$1 FOR UPDATE",[key])).rows[0];
        if(!row)continue;
        const value={...row.value};
        let changed=false;
        for(const [field,oldValue] of Object.entries(fields)){
          if(value[field]===oldValue){value[field]=defaults[key][field];changed=true;}
        }
        if(changed)await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key=$2",[JSON.stringify(value),key]);
      }
      const oldPages=[
        {slug:"media-coverage",title:"Media coverage",intro:"News, announcements and perspectives about PeopleHub."},
        {slug:"case-studies",title:"Case studies",intro:"Verified customer experiences and implementation stories."},
      ];
      for(const page of oldPages){
        const updated=defaultPages.find((p)=>p.slug===page.slug)!;
        await client.query(
          "UPDATE pages SET title=$1,content=jsonb_set(content,'{intro}',to_jsonb($2::text)),updated_at=now() WHERE slug=$3 AND title=$4 AND content->>'intro'=$5",
          [updated.title,updated.content.intro,page.slug,page.title,page.intro],
        );
      }
      for(const key of ["nav","footer"]){
        const row=(await client.query("SELECT value FROM site_content WHERE key=$1 FOR UPDATE",[key])).rows[0];
        if(!row)continue;
        const renamed=renameLegacyCaseStudyLinks(row.value);
        if(JSON.stringify(renamed)!==JSON.stringify(row.value)){
          await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key=$2",[JSON.stringify(renamed),key]);
        }
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v2','{\"seeded\":true}'::jsonb)");
    }
    const visualSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v3'")).rowCount;
    if(!visualSeed){
      for(const post of samplePosts){
        await client.query(
          "UPDATE posts SET cover_image_url=$1,cover_image_alt=$2,updated_at=now() WHERE slug=$3 AND tags @> ARRAY['Sample article']::text[] AND COALESCE(cover_image_url,'')=''",
          [post.cover_image_url,post.cover_image_alt,post.slug],
        );
      }
      const mediaRow=(await client.query("SELECT value FROM site_content WHERE key='media' FOR UPDATE")).rows[0];
      if(mediaRow){
        const media={...mediaRow.value};
        media.items=(Array.isArray(media.items)?media.items:[]).map((item:Doc)=>{
          const sample=sampleMediaItems.find((entry)=>entry.sampleId===item.sampleId);
          if(!sample)return item;
          return {...item,imageUrl:item.imageUrl||sample.imageUrl,imageAlt:item.imageAlt||sample.imageAlt};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='media'",[JSON.stringify(media)]);
      }
      const casesRow=(await client.query("SELECT value FROM site_content WHERE key='caseStudies' FOR UPDATE")).rows[0];
      if(casesRow){
        const cases={...casesRow.value};
        if(cases.eyebrow==="ILLUSTRATIVE WORKFLOWS")cases.eyebrow=defaults.caseStudies.eyebrow;
        cases.items=(Array.isArray(cases.items)?cases.items:[]).map((item:Doc)=>{
          if(typeof item.sampleId!=="string"||!item.sampleId.startsWith("usecase-sample-"))return item;
          const title=typeof item.title==="string"?item.title.replace(/^Illustrative use case:/,"Sample workflow:"):item.title;
          const body=typeof item.body==="string"?item.body.replace(/^> Illustrative use case —/,"> Sample workflow —"):item.body;
          return {...item,title,body};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='caseStudies'",[JSON.stringify(cases)]);
      }
      const page=defaultPages.find((entry)=>entry.slug==="case-studies")!;
      await client.query(
        "UPDATE pages SET content=jsonb_set(content,'{intro}',to_jsonb($1::text)),updated_at=now() WHERE slug='case-studies' AND content->>'intro'=$2",
        [page.content.intro,"Illustrative workflows for different teams; not customer stories or performance claims."],
      );
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v3','{\"seeded\":true}'::jsonb)");
    }
    const titleSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v4'")).rowCount;
    if(!titleSeed){
      const casesRow=(await client.query("SELECT value FROM site_content WHERE key='caseStudies' FOR UPDATE")).rows[0];
      if(casesRow){
        const cases={...casesRow.value};
        cases.items=(Array.isArray(cases.items)?cases.items:[]).map((item:Doc)=>{
          if(typeof item.sampleId!=="string"||!item.sampleId.startsWith("usecase-sample-")||typeof item.title!=="string")return item;
          return {...item,title:item.title.replace(/^Sample workflow:\s*/,"")};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='caseStudies'",[JSON.stringify(cases)]);
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v4','{\"seeded\":true}'::jsonb)");
    }
    const copyTextSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v5'")).rowCount;
    if(!copyTextSeed){
      const mediaIntro="Editorial topics are clearly marked until verified coverage is available.";
      const caseIntro="Workflows for different teams; not customer stories or performance claims.";
      const clean=(value:unknown):unknown=>{
        if(typeof value!=="string")return value;
        const cleaned=value.replace(/\bsample\b/gi,"").replace(/[ \t]{2,}/g," ").replace(/[ \t]+([,.;:!?])/g,"$1").replace(/[ \t]+$/gm,"").trim();
        return cleaned.replace(/^[a-z]/,(first)=>first.toUpperCase());
      };
      const blogRows=(await client.query("SELECT id,title,excerpt,body_md,tags FROM posts WHERE tags @> ARRAY['Sample article']::text[] FOR UPDATE")).rows;
      for(const post of blogRows){
        const tags=(Array.isArray(post.tags)?post.tags:[]).filter((tag:string)=>!/\bsample\b/i.test(tag));
        await client.query("UPDATE posts SET title=$1,excerpt=$2,body_md=$3,tags=$4,updated_at=now() WHERE id=$5",
          [clean(post.title),clean(post.excerpt),clean(post.body_md),tags,post.id]);
      }
      const mediaRow=(await client.query("SELECT value FROM site_content WHERE key='media' FOR UPDATE")).rows[0];
      if(mediaRow){
        const media={...mediaRow.value};
        media.description=clean(media.description);
        media.items=(Array.isArray(media.items)?media.items:[]).map((item:Doc)=>{
          if(typeof item.sampleId!=="string"||!item.sampleId.startsWith("media-sample-"))return item;
          const title=typeof item.title==="string"?item.title.replace(/^Sample editorial topic:\s*/i,""):item.title;
          return {...item,publication:item.publication==="Sample entry"?"":clean(item.publication),title:clean(title),description:clean(item.description)};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='media'",[JSON.stringify(media)]);
      }
      const casesRow=(await client.query("SELECT value FROM site_content WHERE key='caseStudies' FOR UPDATE")).rows[0];
      if(casesRow){
        const cases={...casesRow.value};
        cases.eyebrow=clean(cases.eyebrow);
        cases.description=clean(cases.description);
        cases.items=(Array.isArray(cases.items)?cases.items:[]).map((item:Doc)=>{
          if(typeof item.sampleId!=="string"||!item.sampleId.startsWith("usecase-sample-"))return item;
          const body=typeof item.body==="string"?item.body.replace(/^>\s*Sample workflow\s*—\s*/i,"> "):item.body;
          const summary=clean(item.summary);
          const cleanedBody=clean(body);
          const normalizedBody=typeof cleanedBody==="string"?cleanedBody.replace(/^>\s*not\b/i,"> Not"):cleanedBody;
          return {...item,summary:typeof summary==="string"?summary.replace(/^A approach\b/i,"An approach"):summary,body:normalizedBody};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='caseStudies'",[JSON.stringify(cases)]);
      }
      await client.query(
        "UPDATE pages SET content=jsonb_set(content,'{intro}',to_jsonb($1::text)),updated_at=now() WHERE slug='media-coverage' AND content->>'intro'=$2",
        [mediaIntro,"Sample editorial topics are clearly marked until verified coverage is available."],
      );
      await client.query(
        "UPDATE pages SET content=jsonb_set(content,'{intro}',to_jsonb($1::text)),updated_at=now() WHERE slug='case-studies' AND content->>'intro'=$2",
        [caseIntro,"Sample workflows for different teams; not customer stories or performance claims."],
      );
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v5','{\"seeded\":true}'::jsonb)");
    }
    const mediaLabelSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v6'")).rowCount;
    if(!mediaLabelSeed){
      const mediaRow=(await client.query("SELECT value FROM site_content WHERE key='media' FOR UPDATE")).rows[0];
      if(mediaRow){
        const media={...mediaRow.value};
        let changed=false;
        media.items=(Array.isArray(media.items)?media.items:[]).map((item:Doc)=>{
          if(typeof item.publication!=="string"||!/^content\s*[—–-]\s*not verified coverage$/i.test(item.publication.trim()))return item;
          changed=true;
          return {...item,publication:""};
        });
        if(changed)await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='media'",[JSON.stringify(media)]);
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v6','{\"seeded\":true}'::jsonb)");
    }
    const caseNoticeSeed=(await client.query("SELECT key FROM site_content WHERE key='sample_content_v7'")).rowCount;
    if(!caseNoticeSeed){
      const casesRow=(await client.query("SELECT value FROM site_content WHERE key='caseStudies' FOR UPDATE")).rows[0];
      if(casesRow){
        const cases={...casesRow.value};
        cases.items=(Array.isArray(cases.items)?cases.items:[]).map((item:Doc)=>{
          if(typeof item.sampleId!=="string"||!item.sampleId.startsWith("usecase-sample-")||typeof item.body!=="string")return item;
          const body=item.body.replace(/^>\s*Not a customer story\.\s*This describes a possible workflow and does not claim a real implementation or result\.\s*(?:\r?\n){1,2}/i,"");
          return body===item.body?item:{...item,body};
        });
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='caseStudies'",[JSON.stringify(cases)]);
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('sample_content_v7','{\"seeded\":true}'::jsonb)");
    }
    const marketingHubCopySeed=(await client.query("SELECT key FROM site_content WHERE key='marketing_hub_copy_v1'")).rowCount;
    if(!marketingHubCopySeed){
      const updateLegacySection=(async(key:string,field:string,legacy:string[])=>{
        const row=(await client.query("SELECT value FROM site_content WHERE key=$1 FOR UPDATE",[key])).rows[0];
        if(!row||!legacy.includes(row.value?.[field]))return;
        const value={...row.value,[field]:defaults[key]?.[field]};
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key=$2",[JSON.stringify(value),key]);
      });
      await updateLegacySection("media","description",[
        "Editorial topics are shown for layout illustration only. They are not verified third-party coverage.",
        "News, announcements and independent perspectives about PeopleHub.",
      ]);
      await updateLegacySection("caseStudies","description",[
        "These use cases describe possible workflows, not actual customers, implementations or measured results.",
        "Workflows for different teams; not customer stories or performance claims.",
      ]);
      const mediaPage=defaultPages.find((entry)=>entry.slug==="media-coverage");
      const casesPage=defaultPages.find((entry)=>entry.slug==="case-studies");
      if(mediaPage)await client.query(
        "UPDATE pages SET content=jsonb_set(content,'{intro}',to_jsonb($1::text)),updated_at=now() WHERE slug='media-coverage' AND content->>'intro'=ANY($2::text[])",
        [mediaPage.content.intro,["Editorial topics are clearly marked until verified coverage is available.","Sample editorial topics are clearly marked until verified coverage is available.","News, announcements and independent perspectives about PeopleHub."]],
      );
      if(casesPage)await client.query(
        "UPDATE pages SET content=jsonb_set(content,'{intro}',to_jsonb($1::text)),updated_at=now() WHERE slug='case-studies' AND content->>'intro'=ANY($2::text[])",
        [casesPage.content.intro,["Illustrative workflows for different teams; not customer stories or performance claims.","Sample workflows for different teams; not customer stories or performance claims.","Workflows for different teams; not customer stories or performance claims."]],
      );
      await client.query("INSERT INTO site_content(key,value) VALUES('marketing_hub_copy_v1','{\"seeded\":true}'::jsonb)");
    }
    const marketingHubNavSeed=(await client.query("SELECT key FROM site_content WHERE key='marketing_hub_navigation_v1'")).rowCount;
    if(!marketingHubNavSeed){
      const navRow=(await client.query("SELECT value FROM site_content WHERE key='nav' FOR UPDATE")).rows[0];
      if(navRow){
        const nav={...navRow.value};
        let changed=false;
        const addLink=(list:Doc[],link:Doc)=>{
          if(!list.some((entry)=>entry.href===link.href)){list.push(link);changed=true;}
        };
        const links=Array.isArray(nav.links)?nav.links:[];
        for(const link of links)if(link.label==="Resources"&&link.href==="/blog"){link.href="/resources";changed=true;}
        addLink(links,{label:"AI",href:"/ai"});
        addLink(links,{label:"Solutions",href:"/solutions"});
        nav.links=links;
        const menus=Array.isArray(nav.megaMenu)?nav.megaMenu:[];
        let resources=menus.find((menu:Doc)=>menu.label==="Resources");
        if(!resources){resources={label:"Resources",href:"/resources",groups:[]};menus.push(resources);changed=true;}
        if(resources.href==="/blog"){resources.href="/resources";changed=true;}
        const resourceGroups=Array.isArray(resources.groups)?resources.groups:[];
        let explore=resourceGroups.find((group:Doc)=>group.title==="Explore & learn")??resourceGroups[0];
        if(!explore){explore={title:"Explore & learn",links:[]};resourceGroups.push(explore);changed=true;}
        const resourceMenuLinks=Array.isArray(explore.links)?explore.links:[];
        for(const link of [
          {label:"Resource hub",href:"/resources"},
          {label:"Customer stories",href:"/customer-stories"},
          {label:"Integrations",href:"/integrations"},
          {label:"Compliance references",href:"/compliance"},
        ])addLink(resourceMenuLinks,link);
        explore.links=resourceMenuLinks;
        resources.groups=resourceGroups;
        if(!menus.some((menu:Doc)=>menu.label==="AI")){
          menus.push({label:"AI",href:"/ai",groups:[{title:"Explore AI capabilities",links:[{label:"AI overview",href:"/ai",description:"Planned AI-assisted ideas for people teams.",icon:"Sparkles"}]}]});
          changed=true;
        }
        if(!menus.some((menu:Doc)=>menu.label==="Solutions")){
          menus.push({label:"Solutions",href:"/solutions",groups:[
            {title:"By industry",links:[{label:"Explore industries",href:"/industries",description:"Browse people-operation needs by industry.",icon:"Building2"}]},
            {title:"By team",links:[{label:"Company size and roles",href:"/solutions",description:"Find a starting point by company size or role.",icon:"Users"}]},
          ]});
          changed=true;
        }
        nav.megaMenu=menus;
        if(changed)await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='nav'",[JSON.stringify(nav)]);
      }
      const footerRow=(await client.query("SELECT value FROM site_content WHERE key='footer' FOR UPDATE")).rows[0];
      if(footerRow){
        const footer={...footerRow.value};
        const columns=Array.isArray(footer.columns)?footer.columns:[];
        const addFooterLink=(list:Doc[],link:Doc)=>{
          if(!list.some((entry)=>entry.href===link.href))list.push(link);
        };
        let solutions=columns.find((column:Doc)=>column.title==="Solutions");
        if(!solutions){solutions={title:"Solutions",links:[]};columns.splice(Math.min(3,columns.length),0,solutions);}
        const solutionLinks=Array.isArray(solutions.links)?solutions.links:[];
        for(const link of [
          {label:"Industries",href:"/industries"},
          {label:"Company size and roles",href:"/solutions"},
          {label:"AI capabilities",href:"/ai"},
        ])addFooterLink(solutionLinks,link);
        solutions.links=solutionLinks;
        let resources=columns.find((column:Doc)=>column.title==="Resources");
        if(!resources){resources={title:"Resources",links:[]};columns.push(resources);}
        const resourceLinks=Array.isArray(resources.links)?resources.links:[];
        for(const link of [
          {label:"Resource hub",href:"/resources"},
          {label:"Customer stories",href:"/customer-stories"},
          {label:"Integrations",href:"/integrations"},
          {label:"Compliance references",href:"/compliance"},
        ])addFooterLink(resourceLinks,link);
        resources.links=resourceLinks;
        footer.columns=columns;
        await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key='footer'",[JSON.stringify(footer)]);
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('marketing_hub_navigation_v1','{\"seeded\":true}'::jsonb)");
    }
    const content = await getContent();
    for(let i=0;i<content.suites.items.length;i++){
      const s=content.suites.items[i];
      await client.query("INSERT INTO modules(key,name,description,priority,sort_order) VALUES($1,$2,$3,$4,$5) ON CONFLICT(key) DO NOTHING",[s.key,s.title,s.description,s.priority,i]);
    }
    for(const page of defaultPages) await client.query("INSERT INTO pages(slug,title,content,status) VALUES($1,$2,$3,'published') ON CONFLICT(slug) DO NOTHING",[page.slug,page.title,JSON.stringify(page.content)]);
    const zefohrProfileSeed=(await client.query("SELECT key FROM site_content WHERE key='zefohr_profile_v1'")).rowCount;
    if(!zefohrProfileSeed){
      const profileRows=await client.query("SELECT key,value FROM site_content WHERE key NOT LIKE 'sample_content_v%' AND key<>'zefohr_profile_v1' FOR UPDATE");
      for(const row of profileRows.rows){
        let value=replaceLegacyBrand(row.value);
        if(row.key==="brand")value={...value,name:"ZefoHR",logoUrl:"/brand/zefohr-logo.svg",logoMode:"image",logoAlt:"ZefoHR logo",showWordmark:false};
        if(row.key==="nav")value={...value,brand:"ZefoHR"};
        if(row.key==="contact")value={...value,email:"info@zefohr.com",supportEmail:"support@zefohr.com"};
        if(row.key==="about")value={
          ...value,
          mission:"Our mission is to empower every HR team to deliver fast, seamless, transparent, compliant and personalised services to their employees.",
          vision:"To help individuals make their employment experience delightful by enhancing our processes and systems.",
          values:[
            "Customer value creation is our priority",
            "Develop easy-to-use platforms",
            "Trustworthy computation and data management",
            "Proactive online and offline customer support",
            "Continuous innovation in product development",
            "Foster a supportive and congenial work environment",
            "Contribute to reducing the carbon footprint of processes",
            "Practise diversity and inclusion in management",
          ],
        };
        if(row.key==="footer")value={...value,copyright:"ZefoHR. All rights reserved."};
        if(JSON.stringify(value)!==JSON.stringify(row.value)){
          await client.query("UPDATE site_content SET value=$1,updated_at=now() WHERE key=$2",[JSON.stringify(value),row.key]);
        }
      }
      const pageRows=await client.query("SELECT id,title,content FROM pages FOR UPDATE");
      for(const page of pageRows.rows){
        const title=replaceLegacyBrand(page.title);
        const content=replaceLegacyBrand(page.content);
        if(title!==page.title||JSON.stringify(content)!==JSON.stringify(page.content)){
          await client.query("UPDATE pages SET title=$1,content=$2,updated_at=now() WHERE id=$3",[title,JSON.stringify(content),page.id]);
        }
      }
      const postRows=await client.query("SELECT id,title,excerpt,body_md,author FROM posts FOR UPDATE");
      for(const post of postRows.rows){
        const title=replaceLegacyBrand(post.title);
        const excerpt=replaceLegacyBrand(post.excerpt);
        const body=replaceLegacyBrand(post.body_md);
        const author=replaceLegacyBrand(post.author);
        if(title!==post.title||excerpt!==post.excerpt||body!==post.body_md||author!==post.author){
          await client.query("UPDATE posts SET title=$1,excerpt=$2,body_md=$3,author=$4,updated_at=now() WHERE id=$5",[title,excerpt,body,author,post.id]);
        }
      }
      await client.query("INSERT INTO site_content(key,value) VALUES('zefohr_profile_v1','{\"seeded\":true}'::jsonb)");
    }
    const zefohrTaglineSeed=(await client.query("SELECT key FROM site_content WHERE key='zefohr_tagline_v1'")).rowCount;
    if(!zefohrTaglineSeed){
      await client.query(
        "UPDATE site_content SET value=jsonb_set(value,'{tagline}',to_jsonb($1::text),true),updated_at=now() WHERE key='brand'",
        ["PEOPLE, PROCESS & PERFORMANCE."],
      );
      await client.query("INSERT INTO site_content(key,value) VALUES('zefohr_tagline_v1','{\"seeded\":true}'::jsonb)");
    }
    const zefohrLogoSeed=(await client.query("SELECT key FROM site_content WHERE key='zefohr_logo_svg_v1'")).rowCount;
    if(!zefohrLogoSeed){
      await client.query(
        "UPDATE site_content SET value=jsonb_set(value,'{logoUrl}',to_jsonb($1::text),true),updated_at=now() WHERE key='brand'",
        ["/brand/zefohr-logo.svg"],
      );
      await client.query("INSERT INTO site_content(key,value) VALUES('zefohr_logo_svg_v1','{\"seeded\":true}'::jsonb)");
    }
    await client.query("INSERT INTO seo_settings(id,site_url,site_name) VALUES(1,$1,'ZefoHR') ON CONFLICT(id) DO NOTHING",[process.env.SITE_URL ?? ""]);
    if(!zefohrProfileSeed){
      const seoSettings=(await client.query("SELECT site_name,organisation_schema FROM seo_settings WHERE id=1")).rows[0];
      if(seoSettings){
        const siteName=replaceLegacyBrand(seoSettings.site_name);
        const organisationSchema=replaceLegacyBrand(seoSettings.organisation_schema ?? {});
        if(siteName!==seoSettings.site_name||JSON.stringify(organisationSchema)!==JSON.stringify(seoSettings.organisation_schema)){
          await client.query("UPDATE seo_settings SET site_name=$1,organisation_schema=$2 WHERE id=1",[siteName,JSON.stringify(organisationSchema)]);
        }
      }
      const seoRows=await client.query("SELECT id,title,meta_description,og_title,og_description FROM seo_pages FOR UPDATE");
      for(const page of seoRows.rows){
        const fields=[replaceLegacyBrand(page.title),replaceLegacyBrand(page.meta_description),replaceLegacyBrand(page.og_title),replaceLegacyBrand(page.og_description)];
        if(fields.some((field,index)=>field!==[page.title,page.meta_description,page.og_title,page.og_description][index])){
          await client.query("UPDATE seo_pages SET title=$1,meta_description=$2,og_title=$3,og_description=$4,updated_at=now() WHERE id=$5",[...fields,page.id]);
        }
      }
    }
    if(process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD){
      if(process.env.SUPER_ADMIN_PASSWORD.length<10) fail("SUPER_ADMIN_PASSWORD must be at least 10 characters.");
      const exists = await client.query("SELECT id FROM users WHERE lower(email)=lower($1)",[process.env.SUPER_ADMIN_EMAIL]);
      if(!exists.rowCount) await client.query("INSERT INTO users(name,email,password_hash,role) VALUES('Super administrator',$1,$2,'super_admin')",[process.env.SUPER_ADMIN_EMAIL.toLowerCase(),await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD,12)]);
    }
  });
}
