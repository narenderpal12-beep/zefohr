import { Router } from "express";
import { CreateLeadBody, SaveContentBody } from "@workspace/api-zod";
import { z } from "zod";
import { pool,transaction,getContent,publicData,syncModules,fail,audit,expireTrials, type Doc } from "./store";
import { defaults } from "./defaults";
import { requireAuth,requireAdmin } from "./auth";
import { invalidateSeo,discoverPages,cleanPath } from "./seo";
import { paymentProvider } from "./payments/provider";
import { rateLimit } from "express-rate-limit";
import { clientsSchema, safeLogo } from "./clients";
import { pageLayoutsSchema, pageSectionsSchema, reservedPageSlug, retargetPageLinks } from "./page-builder";
import { themeContentSchema } from "./theme-schema";

const uuid=z.string().uuid();
const asText=(value:unknown)=>typeof value==="string"?value:"";
function validateSectionLinks(value:unknown):void{
  if(Array.isArray(value)){for(const item of value)validateSectionLinks(item);return;}
  if(!value||typeof value!=="object")return;
  for(const [key,item] of Object.entries(value)){
    if(typeof item==="string"&&item){
      if(/^(imageUrl|logoUrl|imageSrc)$/i.test(key)&&(!safeLogo(item)||item.length>200000))fail("Section images must be local images, HTTPS images or PNG/JPEG/WebP uploads up to 150KB");
      else if(/(?:href|url)$/i.test(key)&&! /^(?:\/(?!\/)|#|\?|https?:\/\/|mailto:|tel:)/i.test(item)&&!/^data:image\/(?:png|jpeg|webp);base64,/.test(item))fail("Use a local page, HTTPS link, email or telephone link");
    }else if(item&&typeof item==="object")validateSectionLinks(item);
  }
}
function validateContent(key:string,value:Doc) {
  if(!value || typeof value!=="object" || Array.isArray(value))fail("A section must be a JSON object");
  const sectionLimit=["suites","services","pageLayouts"].includes(key)?2100000:["clients","media","caseStudies","resourcesHub","customerStories","integrationMarketplace","complianceHub"].includes(key)?1500000:500000;
  if(JSON.stringify(value).length>sectionLimit)fail(["clients","media","caseStudies","suites","services"].includes(key)?"Image collection is too large. Use smaller images or fewer uploads.":"Section is too large");
  if(["industryHub","segments","aiHub","resourcesHub","integrationMarketplace","complianceHub","customerStories"].includes(key))validateSectionLinks(value);
  if(key==="clients"){
    const result=clientsSchema.safeParse(value);
    if(!result.success)fail(result.error.issues[0]?.message??"Invalid client details");
  }
  if(key==="pageLayouts"){
    const result=pageLayoutsSchema.safeParse(value);
    if(!result.success)fail(result.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
    for(const layout of Object.values(result.data.routes))validateSectionLinks(layout.sections);
  }
  if(["suites","services"].includes(key)){
    if(!Array.isArray(value.items)||!value.items.length)fail("At least one item is required");
    const keys=new Set<string>(),slugs=new Set<string>();
    for(const item of value.items){
      if(typeof item.key!=="string"||!item.key||keys.has(item.key))fail("Item keys must be non-empty and unique");
      if(typeof item.slug!=="string"||!/^[a-z0-9-]+$/.test(item.slug)||slugs.has(item.slug))fail("Item slugs must be unique lower-case URL slugs");
      if(!item.title||!Array.isArray(item.modules))fail("Each item needs a title and module list");
      if(item.imageUrl!=null&&(typeof item.imageUrl!=="string"||item.imageUrl.length>200000||(item.imageUrl!==""&&!safeLogo(item.imageUrl))))fail("Choose a valid PNG, JPEG or WebP image up to 150KB");
      if(item.imageAlt!=null&&(typeof item.imageAlt!=="string"||item.imageAlt.length>300))fail("Image descriptions must be text up to 300 characters");
      keys.add(item.key);slugs.add(item.slug);
    }
  }
  if(key==="pricing"){
    if(!Number.isInteger(value.trialDays)||value.trialDays<1||value.trialDays>365)fail("Trial days must be between 1 and 365");
    if(!Array.isArray(value.plans)||!value.plans.length)fail("Plans are required");
    const keys=new Set();
    for(const plan of value.plans){
      if(!plan.key||!plan.name||keys.has(plan.key)||!Array.isArray(plan.modules))fail("Plans need unique keys, names and module lists");
      keys.add(plan.key);
      for(const cycle of ["monthly","annual"])if(plan[cycle]!=null&&(!Number.isFinite(plan[cycle])||plan[cycle]<0))fail("Prices must be positive numbers or null");
    }
  }
  if(key==="theme"){
    if(!themeContentSchema.safeParse(value).success)fail("Choose a valid theme, colour mode, website width and hex colours.");
  }
  if(key==="brand"){
    if(typeof value.name!=="string"||!value.name.trim()||value.name.length>100)fail("Brand name must be 1–100 characters");
    if(value.logoUrl&&(typeof value.logoUrl!=="string"||value.logoUrl.length>200000||!safeLogo(value.logoUrl)))fail("Use a local image path, HTTPS URL or PNG/JPEG/WebP upload up to 150KB");
    if(value.logoMode!=null&&!["text","image","mark"].includes(value.logoMode))fail("Choose text, image or built-in logo");
    if(value.logoMode==="image"&&!value.logoUrl)fail("Upload an image or enter its URL");
    if(typeof value.showWordmark!=="boolean")fail("Choose whether to show the brand name");
  }
  if(key==="contact"){
    for(const field of ["phone","email","address","mapUrl","officeHours"]){
      if(value[field]!=null&&(typeof value[field]!=="string"||value[field].length>2000))fail("Contact profile fields must be text up to 2,000 characters");
    }
    if(value.mapUrl&&!/^https?:\/\/[^\s]+$/i.test(value.mapUrl))fail("Map link must be a full http(s) URL or blank");
    if(value.email&&!z.string().email().safeParse(value.email).success)fail("Enter a valid public email or leave it blank");
  }
  if(key==="whatsapp"){
    if(typeof value.enabled!=="boolean")fail("Choose whether WhatsApp contact is enabled");
    if(value.phone&&!/^\+?[\d\s()-]{8,24}$/.test(value.phone))fail("Enter a WhatsApp number including country code");
  }
  if(key==="footer"&&Array.isArray(value.socials)){
    for(const social of value.socials)if(social.url&&!/^https?:\/\//i.test(social.url))fail("Social links must be full http(s) URLs or blank");
  }
  if(key==="caseStudies"){
    if(!Array.isArray(value.items))fail("Case studies must be a list");
    const slugs=new Set<string>();
    for(let i=0;i<value.items.length;i++){
      const item=value.items[i];
      if(!item||typeof item!=="object"||typeof item.title!=="string")fail("Each case study needs a title");
      const slug=item.slug||`story-${i+1}`;
      if(!/^[a-z0-9-]+$/.test(slug)||slugs.has(slug))fail("Use a unique lower-case URL slug for every case study");
      if(item.imageUrl!=null&&(typeof item.imageUrl!=="string"||item.imageUrl.length>200000||(item.imageUrl!==""&&!safeLogo(item.imageUrl))))fail("Choose a valid PNG, JPEG or WebP upload up to 150KB");
      if(item.imageAlt!=null&&(typeof item.imageAlt!=="string"||item.imageAlt.length>300))fail("Image descriptions must be text up to 300 characters");
      slugs.add(slug);
    }
  }
  if(key==="media"){
    if(!Array.isArray(value.items))fail("Media coverage must be a list");
    for(const item of value.items){
      if(!item||typeof item!=="object")fail("Each media entry must be an object");
      if(item.imageUrl!=null&&(typeof item.imageUrl!=="string"||item.imageUrl.length>200000||(item.imageUrl!==""&&!safeLogo(item.imageUrl))))fail("Choose a valid PNG, JPEG or WebP upload up to 150KB");
      if(item.imageAlt!=null&&(typeof item.imageAlt!=="string"||item.imageAlt.length>300))fail("Image descriptions must be text up to 300 characters");
      if(item.status==="published"&&(item.verified!==true||!item.publication||!/^https:\/\/[^\s]+$/i.test(item.url||"")))fail("Published media items need a verified status, publisher and secure source link");
    }
  }
  const sluggableSections=["industryHub","segments","resourcesHub","customerStories"];
  if(sluggableSections.includes(key)){
    if(!Array.isArray(value.items))fail("Items must be a list");
    const slugs=new Set<string>();
    for(const item of value.items){
      if(!item||typeof item!=="object"||typeof item.title!=="string"||!item.title.trim())fail("Each item needs a title");
      if(typeof item.slug!=="string"||!/^[a-z0-9-]+$/.test(item.slug)||slugs.has(item.slug))fail("Item slugs must be unique lower-case URL slugs");
      if(["resourcesHub","customerStories"].includes(key)&&item.status!=null&&!["draft","published"].includes(item.status))fail("Choose draft or published for each item");
      if(key==="resourcesHub"&&item.status==="published"&&!asText(item.body).trim())fail("Published resources need article content");
      if(key==="customerStories"&&item.status==="published"&&(item.verified!==true||!asText(item.summary).trim()||!asText(item.body).trim()))fail("Published customer stories need verified review, a summary and story content");
      slugs.add(item.slug);
    }
  }
  if(key==="integrationMarketplace"){
    if(!Array.isArray(value.items))fail("Integration details must be a list");
    const slugs=new Set<string>();
    for(const item of value.items){
      if(!item||typeof item!=="object"||!asText(item.title).trim())fail("Each integration needs a title");
      if(!/^[a-z0-9-]+$/.test(item.slug||"")||slugs.has(item.slug))fail("Integration slugs must be unique lower-case URL slugs");
      if(item.status!=null&&!["draft","published"].includes(item.status))fail("Choose draft or published for each integration");
      if(item.status==="published"&&(item.verified!==true||!asText(item.description).trim()))fail("Published integrations need verified review and a description");
      slugs.add(item.slug);
    }
  }
  if(key==="complianceHub"){
    if(!Array.isArray(value.references))fail("Compliance references must be a list");
    const slugs=new Set<string>();
    for(const ref of value.references){
      if(!ref||typeof ref!=="object"||!asText(ref.title||ref.topic).trim())fail("Each compliance reference needs a title or topic");
      if(ref.slug&&(!/^[a-z0-9-]+$/.test(ref.slug)||slugs.has(ref.slug)))fail("Reference slugs must be unique lower-case URL slugs");
      if(ref.status!=null&&!["draft","published"].includes(ref.status))fail("Choose draft or published for each reference");
      if(ref.status==="published"&&(ref.verified!==true||!/^https:\/\/[^\s]+$/i.test(ref.sourceUrl||"")||!asText(ref.lastReviewed).trim()))fail("Published references need verified review, a secure source link and a review date");
      if(ref.slug)slugs.add(ref.slug);
    }
  }
}
export const contentRouter=Router();
contentRouter.get("/content",async(_req,res)=>{res.set("Cache-Control","no-store").json(await getContent());});
async function saveSection(key:string,value:Doc,actor:string){
  validateContent(key,value);
  const before=(await pool.query("SELECT value FROM site_content WHERE key=$1",[key])).rows[0]?.value??defaults[key];
  await transaction(async client=>{
    await client.query("INSERT INTO site_content_history(key,value,updated_by) VALUES($1,$2,$3)",[key,JSON.stringify(before),actor]);
    await client.query("INSERT INTO site_content(key,value,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()",[key,JSON.stringify(value),actor]);
    if(key==="brand"){
      await client.query("UPDATE site_content SET value=jsonb_set(value,'{brand}',to_jsonb($1::text)),updated_at=now(),updated_by=$2 WHERE key='nav'",[value.name,actor]);
      await client.query("UPDATE seo_settings SET site_name=$1 WHERE id=1",[value.name]);
    }
    if(key==="nav"&&value.brand){
      await client.query("UPDATE site_content SET value=jsonb_set(value,'{name}',to_jsonb($1::text)),updated_at=now(),updated_by=$2 WHERE key='brand'",[value.brand,actor]);
      await client.query("UPDATE seo_settings SET site_name=$1 WHERE id=1",[value.brand]);
    }
    const sectionPages:Record<string,string[]>={media:["media-coverage"],caseStudies:["case-studies"],careers:["careers","career"],support:["support","our-support"],demo:["request-demo","request-for-demo"]};
    if(sectionPages[key]&&typeof value.title==="string"&&typeof value.description==="string"){
      await client.query("UPDATE pages SET title=$1,content=jsonb_set(content,'{intro}',to_jsonb($2::text)),updated_at=now() WHERE slug=ANY($3::text[])",[value.title,value.description,sectionPages[key]]);
    }
    if(key==="pricing"||key==="suites"){
      const cms={...await getContent(),[key]:value};
      const current=(await client.query("SELECT organisation_id,plan_key FROM subscriptions")).rows;
      for(const sub of current)await syncModules(client,sub.organisation_id,sub.plan_key,cms);
    }
    await audit(client,actor,"content.update",key,before,value);
  });
  invalidateSeo();await discoverPages();return value;
}
contentRouter.put("/content/:key",requireAuth,requireAdmin,async(req,res)=>{
  const key=String(req.params.key);if(!(key in defaults))fail("Unknown content section",404);
  const p=SaveContentBody.safeParse(req.body);if(!p.success)fail("Invalid section");
  res.json(await saveSection(key,p.data,(req as any).user.id));
});
contentRouter.post("/content/:key/reset",requireAuth,requireAdmin,async(req,res)=>{
  const key=String(req.params.key);if(!(key in defaults))fail("Unknown content section",404);
  res.json(await saveSection(key,defaults[key],(req as any).user.id));
});
contentRouter.get("/content/:key/history",requireAuth,requireAdmin,async(req,res)=>{
  res.json((await pool.query("SELECT * FROM site_content_history WHERE key=$1 ORDER BY updated_at DESC LIMIT 100",[req.params.key])).rows);
});
const leadLimiter=rateLimit({windowMs:60*60*1000,limit:20,message:{error:"Too many enquiries. Please try again later."},standardHeaders:true,legacyHeaders:false});
contentRouter.post("/leads",leadLimiter,async(req,res)=>{
  const p=CreateLeadBody.safeParse(req.body);if(!p.success)fail("Please provide a name, valid email and message of at least 5 characters");
  const b=p.data;
  const row=(await pool.query("INSERT INTO leads(name,email,phone,organisation,message) VALUES($1,$2,$3,$4,$5) RETURNING id",[b.name,b.email,b.phone??null,b.organisation??null,b.message])).rows[0];
  res.status(201).json({id:row.id,message:"Thank you. Your message has been received."});
});
contentRouter.get("/pages",async(_req,res)=>{res.json((await publicData()).pages);});
contentRouter.get("/posts",async(_req,res)=>{res.json((await publicData()).posts);});
contentRouter.post("/billing/subscribe",requireAuth,async(req,res)=>{
  const user=(req as any).user;
  if(user.role!=="org_admin"||!user.organisation_id)fail("Organisation administrator access required",403);
  const cms=await getContent();
  if(!cms.pricing.plans.some((p:Doc)=>p.key===req.body.plan_key))fail("Choose a valid plan");
  const cycle=req.body.billing_cycle??"monthly";if(!["monthly","annual"].includes(cycle))fail("Choose a billing cycle");
  const current=(await pool.query("SELECT * FROM subscriptions WHERE organisation_id=$1",[user.organisation_id])).rows[0];
  if(current?.status==="active")fail("Contact the PeopleHub team to change an active subscription",409);
  await transaction(async client=>{
    await client.query("UPDATE subscriptions SET plan_key=$1,billing_cycle=$2,status='pending_payment',payment_provider='stub' WHERE organisation_id=$3",[req.body.plan_key,cycle,user.organisation_id]);
    await syncModules(client,user.organisation_id,req.body.plan_key,cms);
    await audit(client,user.id,"subscription.request",user.organisation_id,current,{plan_key:req.body.plan_key,billing_cycle:cycle,status:"pending_payment"});
  });
  res.json(await paymentProvider.createOrder({organisation_id:user.organisation_id,plan_key:req.body.plan_key,billing_cycle:cycle}));
});
const pageInput=z.object({slug:z.string().min(1).max(250),title:z.string().min(1).max(200),content:z.record(z.string(),z.unknown()).default({}),status:z.enum(["draft","published"]).default("draft")});
const postInput=z.object({slug:z.string().regex(/^[a-z0-9-]+$/),title:z.string().min(1).max(200),excerpt:z.string().max(5000).default(""),body_md:z.string().max(100000).default(""),cover_image_url:z.string().max(200000).default(""),cover_image_alt:z.string().max(500).default(""),author:z.string().max(100).default(""),tags:z.array(z.string().max(100)).default([]),status:z.enum(["draft","published"]).default("draft"),published_at:z.string().nullable().optional()});
export const adminRouter=Router();
adminRouter.use(requireAuth,requireAdmin);
adminRouter.get("/summary",async(_req,res)=>{
  await expireTrials();
  const counts=await pool.query("SELECT (SELECT count(*)::int FROM organisations) organisations,(SELECT count(*)::int FROM leads) leads,(SELECT count(*)::int FROM pages WHERE status='published') published_pages,(SELECT count(*)::int FROM posts WHERE status='published') published_posts,(SELECT count(*)::int FROM subscriptions WHERE status='trial') active_trials");
  const recent=(await pool.query("SELECT action,entity,at FROM audit_log ORDER BY at DESC LIMIT 10")).rows;
  res.json({...counts.rows[0],recent_activity:recent});
});
adminRouter.get("/:entity",async(req,res)=>{
  const entity=String(req.params.entity);
  if(entity==="organisations"){
    await expireTrials();res.json((await pool.query("SELECT o.*,s.plan_key,s.billing_cycle,s.status,s.employee_count,s.trial_ends_at,s.current_period_end FROM organisations o LEFT JOIN subscriptions s ON s.organisation_id=o.id ORDER BY o.created_at DESC LIMIT 1000")).rows);return;
  }
  if(!["pages","posts","leads"].includes(entity))fail("Unknown collection",404);
  res.json((await pool.query(`SELECT * FROM ${entity} ORDER BY ${entity==="leads"?"created_at":"updated_at"} DESC LIMIT 1000`)).rows);
});
async function syncPageMenus(client:any,actor:string,oldSlug:string,newSlug:string|null){
  for(const key of ["nav","footer"]){
    const stored=(await client.query("SELECT value FROM site_content WHERE key=$1 FOR UPDATE",[key])).rows[0];
    const before=stored?.value ?? defaults[key];
    const after=retargetPageLinks(before,`/${oldSlug}`,newSlug?`/${newSlug}`:null);
    if(JSON.stringify(before)===JSON.stringify(after))continue;
    await client.query("INSERT INTO site_content_history(key,value,updated_by) VALUES($1,$2,$3)",[key,JSON.stringify(before),actor]);
    await client.query("INSERT INTO site_content(key,value,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()",[key,JSON.stringify(after),actor]);
    await audit(client,actor,"content.page-links",key,before,after);
  }
}
async function writeRecord(entity:string,id:string|null,input:Doc,actor:string){
  if(!["pages","posts"].includes(entity))fail("This collection does not support this operation",405);
  if(id&&!uuid.safeParse(id).success)fail("Invalid record ID");
  const parser=entity==="pages"?pageInput:postInput;
  const p=parser.safeParse(input);if(!p.success)fail(p.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
  const b=p.data as Doc;
  const before=id?(await pool.query(`SELECT * FROM ${entity} WHERE id=$1`,[id])).rows[0]:null;
  if(id&&!before)fail("Record not found",404);
  if(entity==="pages"){
    b.slug=cleanPath("/"+b.slug.replace(/^\/+/,"")).slice(1);
    if(!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(b.slug))fail("Use a lower-case page path with words separated by hyphens or slashes");
    if(reservedPageSlug(b.slug)&&before?.slug!==b.slug)fail("This path is reserved for an existing website page");
    if(JSON.stringify(b.content).length>1500000)fail("Page content is too large. Use smaller images or fewer sections");
    if(b.content?.sections!==undefined){
      const sections=pageSectionsSchema.safeParse(b.content.sections);
      if(!sections.success)fail(sections.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
      if(sections.data.some(s=>s.type==="original"))fail("Original page sections are only available on existing website pages");
      validateSectionLinks(sections.data);
      b.content.sections=sections.data;
    }
  }
  if(entity==="posts"){
    if(b.cover_image_url&&!safeLogo(b.cover_image_url)&&!/^http:\/\/[^\s]+$/i.test(b.cover_image_url))fail("Choose a local image, HTTPS image or PNG/JPEG/WebP upload up to 150KB");
    if(b.published_at && Number.isNaN(Date.parse(b.published_at)))fail("Invalid publication date");
    if(b.status==="published"&&!b.published_at)b.published_at=new Date().toISOString();
  }
  const keys=Object.keys(b);
  const values=keys.map(k=>k==="content"?JSON.stringify(b[k]):b[k]);
  const row=await transaction(async client=>{
    const out=id?(await client.query(`UPDATE ${entity} SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(",")},updated_at=now() WHERE id=$${values.length+1} RETURNING *`,[...values,id])).rows[0]:(await client.query(`INSERT INTO ${entity}(${keys.join(",")}) VALUES(${values.map((_,i)=>`$${i+1}`).join(",")}) RETURNING *`,values)).rows[0];
    if(entity==="pages" && before && !reservedPageSlug(before.slug) && (before.slug!==out.slug || out.status!=="published")){
      await syncPageMenus(client,actor,before.slug,out.status==="published"?out.slug:null);
    }
    await audit(client,actor,id?`${entity}.update`:`${entity}.create`,out.id,before,out);return out;
  });
  invalidateSeo();await discoverPages();return row;
}
adminRouter.post("/:entity",async(req,res)=>{res.status(201).json(await writeRecord(String(req.params.entity),null,req.body,(req as any).user.id));});
adminRouter.put("/:entity/:id",async(req,res)=>{
  const entity=String(req.params.entity),id=String(req.params.id);
  if(entity!=="organisations"){res.json(await writeRecord(entity,id,req.body,(req as any).user.id));return;}
  if(!uuid.safeParse(id).success)fail("Invalid organisation ID");
  const parser=z.object({plan_key:z.string().optional(),status:z.enum(["trial","pending_payment","active","past_due","cancelled","expired"]).optional(),trial_ends_at:z.string().nullable().optional()});
  const p=parser.safeParse(req.body);if(!p.success)fail("Invalid subscription details");
  const before=(await pool.query("SELECT * FROM subscriptions WHERE organisation_id=$1",[id])).rows[0];if(!before)fail("Organisation not found",404);
  const next={...before,...p.data};
  if(next.trial_ends_at && Number.isNaN(Date.parse(next.trial_ends_at)))fail("Invalid trial end date");
  const cms=await getContent();if(!cms.pricing.plans.some((p:Doc)=>p.key===next.plan_key))fail("Unknown plan");
  const result=await transaction(async client=>{
    const row=(await client.query("UPDATE subscriptions SET plan_key=$1,status=$2,trial_ends_at=$3 WHERE organisation_id=$4 RETURNING *",[next.plan_key,next.status,next.trial_ends_at,id])).rows[0];
    await syncModules(client,id,next.plan_key,cms);
    await audit(client,(req as any).user.id,"subscription.update",id,before,row);return row;
  });
  res.json(result);
});
adminRouter.delete("/:entity/:id",async(req,res)=>{
  const entity=String(req.params.entity),id=String(req.params.id);
  if(!["pages","posts","leads"].includes(entity))fail("Deletion is not supported for this collection",405);
  if(!uuid.safeParse(id).success)fail("Invalid ID");
  await transaction(async client=>{
    if(entity==="pages"){
      const current=(await client.query("SELECT slug FROM pages WHERE id=$1 FOR UPDATE",[id])).rows[0];
      if(current&&reservedPageSlug(current.slug))fail("Existing website pages cannot be deleted. Edit their sections in Content instead");
    }
    const old=(await client.query(`DELETE FROM ${entity} WHERE id=$1 RETURNING *`,[id])).rows[0];if(!old)fail("Record not found",404);
    if(entity==="pages")await syncPageMenus(client,(req as any).user.id,old.slug,null);
    await audit(client,(req as any).user.id,`${entity}.delete`,id,old,null);
  });
  invalidateSeo();await discoverPages();res.json({ok:true});
});
