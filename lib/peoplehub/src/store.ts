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
      if(key==="suites" && item.body===undefined && original?.body)item.body=original.body;
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
    const content = await getContent();
    for(let i=0;i<content.suites.items.length;i++){
      const s=content.suites.items[i];
      await client.query("INSERT INTO modules(key,name,description,priority,sort_order) VALUES($1,$2,$3,$4,$5) ON CONFLICT(key) DO NOTHING",[s.key,s.title,s.description,s.priority,i]);
    }
    for(const page of defaultPages) await client.query("INSERT INTO pages(slug,title,content,status) VALUES($1,$2,$3,'published') ON CONFLICT(slug) DO NOTHING",[page.slug,page.title,JSON.stringify(page.content)]);
    await client.query("INSERT INTO seo_settings(id,site_url) VALUES(1,$1) ON CONFLICT(id) DO NOTHING",[process.env.SITE_URL ?? ""]);
    if(process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD){
      if(process.env.SUPER_ADMIN_PASSWORD.length<10) fail("SUPER_ADMIN_PASSWORD must be at least 10 characters.");
      const exists = await client.query("SELECT id FROM users WHERE lower(email)=lower($1)",[process.env.SUPER_ADMIN_EMAIL]);
      if(!exists.rowCount) await client.query("INSERT INTO users(name,email,password_hash,role) VALUES('Super administrator',$1,$2,'super_admin')",[process.env.SUPER_ADMIN_EMAIL.toLowerCase(),await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD,12)]);
    }
  });
}
