import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { defaults, defaultPages } from "./defaults";
import bcrypt from "bcryptjs";

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
  for(const row of rows.rows) content[row.key] = merge(content[row.key],row.value);
  const storedBrand=rows.rows.find(r=>r.key==="brand");
  if(!storedBrand && content.nav?.brand)content.brand.name=content.nav.brand;
  content.nav.brand=content.brand.name;
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
