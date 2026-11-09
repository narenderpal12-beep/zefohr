import { Router } from "express";
import { z } from "zod";
import { requireAuth,requireAdmin } from "./auth";
import { pool,fail,transaction,audit,type Doc } from "./store";
import { discoverPages,resolveSeo,updateSeo,getSettings,cleanPath,validJsonLd,sanitizeHead,sitemap,robots,invalidateSeo } from "./seo";

export const seoRouter=Router();
seoRouter.get("/resolve",async(req,res)=>{res.json(await resolveSeo(cleanPath(req.query.path??"/"),undefined,requestOrigin(req)));});
seoRouter.use(requireAuth,requireAdmin);
export function requestOrigin(req:any){return `${req.protocol}://${req.get("host")}`;}
seoRouter.get("/settings",async(_req,res)=>{res.json(await getSettings());});
const settingFields=["site_name","site_url","default_title_template","default_meta_description","default_og_image_url","favicon_url","twitter_handle","organisation_schema","ga4_id","gsc_verification","bing_verification","extra_head_html","robots_extra_rules","sitemap_enabled"];
seoRouter.put("/settings",async(req,res)=>{
  const before=await getSettings();
  const next:Doc={...before};
  for(const field of settingFields)if(req.body[field]!==undefined)next[field]=req.body[field];
  for(const f of settingFields.filter(k=>!["organisation_schema","sitemap_enabled"].includes(k)))if(typeof next[f]!=="string"||next[f].length>30000)fail(`Invalid ${f}`);
  if(next.site_url&&!/^https?:\/\/[^/]+\/?$/.test(next.site_url))fail("Site URL must be an absolute http(s) origin");
  if(next.ga4_id&&!/^G-[A-Z0-9]+$/.test(next.ga4_id))fail("Enter a valid GA4 measurement ID");
  next.organisation_schema=validJsonLd(next.organisation_schema)||{};
  next.extra_head_html=sanitizeHead(next.extra_head_html||"");
  if(typeof next.sitemap_enabled!=="boolean")fail("Invalid sitemap setting");
  await transaction(async client=>{
    const values=settingFields.map(k=>k==="organisation_schema"?JSON.stringify(next[k]):next[k]);
    await client.query(`UPDATE seo_settings SET ${settingFields.map((k,i)=>`${k}=$${i+1}`).join(",")} WHERE id=1`,values);
    await audit(client,(req as any).user.id,"seo.settings.update","global",before,next);
  });
  invalidateSeo();res.json(next);
});
async function enrichedPages(req:any) {
  await discoverPages();
  const rows=(await pool.query("SELECT * FROM seo_pages WHERE discovered=true ORDER BY path")).rows;
  const items=[];
  for(const row of rows)items.push({...row,...await resolveSeo(row.path,undefined,requestOrigin(req)),id:row.id});
  return items;
}
seoRouter.get("/pages",async(req,res)=>{
  let items=await enrichedPages(req);
  const {search,type,status,issue}=req.query;
  if(search)items=items.filter(p=>(p.path+" "+p.title).toLowerCase().includes(String(search).toLowerCase()));
  if(type&&type!=="all")items=items.filter(p=>p.page_type===type);
  if(status&&status!=="all")items=items.filter(p=>String(status).includes("noindex")?p.robots.includes("noindex"):!p.robots.includes("noindex"));
  if(issue&&issue!=="all")items=items.filter(p=>issue==="missing-title"?!p.title:issue==="missing-description"?!p.meta_description:issue==="long-title"?p.title.length>60:issue==="long-description"?p.meta_description.length>160:p.score<80);
  const page=Math.max(1,Number(req.query.page)||1),pageSize=Number(req.query.limit)===0?items.length:50;
  res.json({items:items.slice((page-1)*pageSize,page*pageSize),total:items.length,page,totalPages:Math.max(1,Math.ceil(items.length/pageSize))});
});
seoRouter.post("/pages/bulk",async(req,res)=>{
  if(!Array.isArray(req.body.ids)||req.body.ids.length>1000||!req.body.changes)fail("Choose pages and changes");
  const results=[];
  for(const id of req.body.ids){if(!z.string().uuid().safeParse(id).success)fail("Invalid page ID");results.push(await updateSeo(id,req.body.changes,(req as any).user.id));}
  res.json({updated:results.length});
});
seoRouter.get("/pages/:id",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)fail("Invalid page ID");
  const row=(await pool.query("SELECT * FROM seo_pages WHERE id=$1",[req.params.id])).rows[0];
  if(!row)fail("SEO page not found",404);
  res.json({...row,resolved:await resolveSeo(row.path,undefined,requestOrigin(req))});
});
seoRouter.put("/pages/:id",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)fail("Invalid page ID");
  res.json(await updateSeo(String(req.params.id),req.body,(req as any).user.id));
});
seoRouter.get("/pages/:id/history",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)fail("Invalid page ID");
  res.json((await pool.query("SELECT * FROM seo_page_history WHERE seo_page_id=$1 ORDER BY updated_at DESC LIMIT 100",[req.params.id])).rows);
});
seoRouter.post("/pages/:id/restore",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success||!z.string().uuid().safeParse(req.body.history_id).success)fail("Invalid history ID");
  const history=(await pool.query("SELECT * FROM seo_page_history WHERE id=$1 AND seo_page_id=$2",[req.body.history_id,req.params.id])).rows[0];if(!history)fail("Version not found",404);
  res.json(await updateSeo(String(req.params.id),history.value,(req as any).user.id));
});
const csvFields=["id","path","page_type","title","meta_description","canonical_url","robots","og_title","og_description","og_image_url","twitter_card","focus_keyword","schema_type","include_in_sitemap","sitemap_priority","changefreq"];
const csvEscape=(v:any)=>`"${String(v??"").replace(/"/g,'""')}"`;
function parseCsv(text:string) {
  const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===","&&!quoted){row.push(field);field="";}
    else if(c==="\n"&&!quoted){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}
    else field+=c;
  }
  if(quoted)fail("Unclosed CSV quote");
  if(field||row.length){row.push(field.replace(/\r$/,""));rows.push(row);}
  return rows;
}
seoRouter.get("/export",async(req,res)=>{
  const rows=await enrichedPages(req);
  res.type("text/csv").set("Content-Disposition",'attachment; filename="peoplehub-seo.csv"').send([csvFields.join(","),...rows.map(r=>csvFields.map(k=>csvEscape(r[k])).join(","))].join("\r\n"));
});
seoRouter.post("/import",async(req,res)=>{
  const text=req.body.csv;if(typeof text!=="string"||text.length>1000000)fail("Provide a CSV file under 1 MB");
  const [header,...rows]=parseCsv(text);if(!header?.includes("path"))fail("CSV must include a path column");
  if(rows.length>1000)fail("Import at most 1000 records at once");
  let updated=0;
  for(const values of rows.filter(r=>r.some(Boolean))){
    const record:Doc={};header.forEach((k,i)=>{if(csvFields.includes(k))record[k]=values[i]??"";});
    const existing=(await pool.query("SELECT id FROM seo_pages WHERE path=$1",[cleanPath(record.path)])).rows[0];
    if(!existing)continue;
    if(record.include_in_sitemap!==undefined)record.include_in_sitemap=record.include_in_sitemap==="true";
    if(record.sitemap_priority!==undefined)record.sitemap_priority=Number(record.sitemap_priority);
    await updateSeo(existing.id,record,(req as any).user.id);updated++;
  }
  res.json({updated});
});
seoRouter.get("/preview",async(req,res)=>{res.type("text/plain").send(req.query.type==="robots"?await robots(requestOrigin(req)):await sitemap(requestOrigin(req)));});
async function validateRedirect(input:Doc,id?:string){
  const from=cleanPath(input.from_path),to=cleanPath(input.to_path);
  if(from.includes(":")||to.includes(":"))fail("Redirects must be concrete paths");
  if(from===to)fail("A redirect cannot point to itself");
  const code=Number(input.status_code??301);if(![301,302].includes(code))fail("Only 301 or 302 redirects are supported");
  const rows=(await pool.query("SELECT * FROM redirects WHERE is_active=true")).rows.filter(r=>r.id!==id);
  const edges=new Map(rows.map(r=>[r.from_path,r.to_path]));edges.set(from,to);
  let path=from;const seen=new Set<string>();
  while(edges.has(path)){if(seen.has(path))fail("This redirect would create a loop");seen.add(path);path=edges.get(path)!;}
  return {from_path:from,to_path:to,status_code:code,is_active:input.is_active!==false};
}
seoRouter.post("/redirects/test",async(req,res)=>{
  const result=await validateRedirect(req.body,req.body.id);
  res.json({...result,valid:true,message:"No redirect loop detected"});
});
seoRouter.get("/redirects",async(_req,res)=>{res.json((await pool.query("SELECT * FROM redirects ORDER BY from_path")).rows);});
seoRouter.post("/redirects",async(req,res)=>{
  const b=await validateRedirect(req.body);
  const row=await transaction(async client=>{
    const row=(await client.query("INSERT INTO redirects(from_path,to_path,status_code,is_active) VALUES($1,$2,$3,$4) RETURNING *",[b.from_path,b.to_path,b.status_code,b.is_active])).rows[0];
    await audit(client,(req as any).user.id,"redirect.create",row.id,null,row);return row;
  });res.status(201).json(row);
});
seoRouter.put("/redirects/:id",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)fail("Invalid redirect ID");
  const id=String(req.params.id);
  const before=(await pool.query("SELECT * FROM redirects WHERE id=$1",[id])).rows[0];if(!before)fail("Redirect not found",404);
  const b=await validateRedirect({...before,...req.body},id);
  const row=await transaction(async client=>{
    const row=(await client.query("UPDATE redirects SET from_path=$1,to_path=$2,status_code=$3,is_active=$4 WHERE id=$5 RETURNING *",[b.from_path,b.to_path,b.status_code,b.is_active,id])).rows[0];
    await audit(client,(req as any).user.id,"redirect.update",id,before,row);return row;
  });res.json(row);
});
seoRouter.delete("/redirects/:id",async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success)fail("Invalid redirect ID");
  await transaction(async client=>{
    const old=(await client.query("DELETE FROM redirects WHERE id=$1 RETURNING *",[req.params.id])).rows[0];if(!old)fail("Redirect not found",404);
    await audit(client,(req as any).user.id,"redirect.delete",String(req.params.id),old,null);
  });res.json({ok:true});
});
seoRouter.get("/not-found",async(_req,res)=>{res.json((await pool.query("SELECT * FROM not_found_log ORDER BY last_seen DESC LIMIT 500")).rows);});
