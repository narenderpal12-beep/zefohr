import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { RegisterOrganisationBody, LoginBody } from "@workspace/api-zod";
import { pool, transaction, getContent, syncModules, expireTrials, fail, audit } from "./store";
import { randomUUID } from "node:crypto";

const secret=()=>process.env.JWT_SECRET||process.env.SESSION_SECRET||fail("Signing secret is not configured",503);
export const authLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:"draft-8",legacyHeaders:false,message:{error:"Too many attempts. Please try again later."}});
export async function requireAuth(req:Request,res:Response,next:NextFunction) {
  try {
    const token=req.cookies?.peoplehub_session;
    if(!token){res.status(401).json({error:"Sign in to continue"});return;}
    const payload=jwt.verify(token,secret(),{algorithms:["HS256"]}) as {sub:string};
    const user=(await pool.query("SELECT id,organisation_id,name,email,role,is_active FROM users WHERE id=$1 AND is_active=true",[payload.sub])).rows[0];
    if(!user){res.status(401).json({error:"Account is inactive or unavailable"});return;}
    (req as any).user=user;next();
  } catch {res.status(401).json({error:"Your session has expired. Please sign in again."});}
}
export function requireAdmin(req:Request,res:Response,next:NextFunction) {
  if((req as any).user?.role!=="super_admin"){res.status(403).json({error:"Super administrator access is required"});return;}
  next();
}
export function requireModule(moduleKey:string) {
  return async (req:Request,res:Response,next:NextFunction)=>{
    await expireTrials();
    const user=(req as any).user;
    if(!user){res.status(401).json({error:"Sign in to continue"});return;}
    const row=(await pool.query("SELECT m.enabled,s.status FROM organisation_modules m JOIN subscriptions s ON s.organisation_id=m.organisation_id WHERE m.organisation_id=$1 AND m.module_key=$2",[user.organisation_id,moduleKey])).rows[0];
    if(!row?.enabled || !["trial","active"].includes(row.status)){res.status(403).json({error:"This module is not enabled for your subscription"});return;}
    next();
  };
}
function signIn(res:Response,userId:string){
  const token=jwt.sign({},secret(),{algorithm:"HS256",subject:userId,expiresIn:"7d"});
  res.cookie("peoplehub_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:7*86400000,path:"/"});
}
export async function account(userId:string) {
  await expireTrials();
  const user=(await pool.query("SELECT id,name,email,role,organisation_id FROM users WHERE id=$1",[userId])).rows[0];
  if(!user) fail("Account not found",404);
  if(!user.organisation_id) return {user,organisation:null,subscription:null,modules:[]};
  const [org,sub,modules]=await Promise.all([
    pool.query("SELECT * FROM organisations WHERE id=$1",[user.organisation_id]),
    pool.query("SELECT * FROM subscriptions WHERE organisation_id=$1",[user.organisation_id]),
    pool.query("SELECT m.*,coalesce(om.enabled,false) AS enabled FROM modules m LEFT JOIN organisation_modules om ON om.module_key=m.key AND om.organisation_id=$1 ORDER BY m.sort_order",[user.organisation_id]),
  ]);
  const subscription=sub.rows[0];
  if(subscription) subscription.days_left=subscription.status==="trial"?Math.max(0,Math.ceil((new Date(subscription.trial_ends_at).getTime()-Date.now())/86400000)):0;
  return {user,organisation:org.rows[0]??null,subscription:subscription??null,modules:modules.rows};
}
export const authRouter=Router();
authRouter.post("/register-organisation",authLimiter,async(req,res)=>{
  const parsed=RegisterOrganisationBody.safeParse(req.body);
  if(!parsed.success) fail(parsed.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
  const b=parsed.data;
  if(!b.terms)fail("You must accept the terms");
  if(b.password!==b.confirm_password)fail("Passwords do not match");
  // bcrypt only uses the first 72 bytes; reject instead of silently truncating.
  if(Buffer.byteLength(b.password,"utf8")>72)fail("Password must be at most 72 UTF-8 bytes");
  if(!/^[+()\d\s-]{8,20}$/.test(b.phone))fail("Enter a valid phone number");
  if(b.gst_number&&!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i.test(b.gst_number))fail("Enter a valid GST number");
  secret();
  const cms=await getContent();
  if(!cms.pricing.plans.some((p:any)=>p.key===b.plan_key))fail("Unknown plan");
  const email=b.email.trim().toLowerCase();
  const existing=await pool.query("SELECT id FROM users WHERE lower(email)=$1",[email]);
  if(existing.rowCount)fail("An account with this email already exists",409);
  const hash=await bcrypt.hash(b.password,12);
  const user=await transaction(async client=>{
    const slug=b.organisation_name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"organisation";
    const org=(await client.query("INSERT INTO organisations(name,slug,industry,size_band,gst_number,phone) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[b.organisation_name,slug+"-"+randomUUID().slice(0,8),b.industry,b.size_band,b.gst_number?.toUpperCase()||null,b.phone])).rows[0];
    const u=(await client.query("INSERT INTO users(organisation_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'org_admin') RETURNING id",[org.id,b.name,email,hash])).rows[0];
    const trial=b.mode==="trial";
    await client.query("INSERT INTO subscriptions(organisation_id,plan_key,billing_cycle,status,employee_count,trial_started_at,trial_ends_at,payment_provider) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[org.id,b.plan_key,b.billing_cycle||"monthly",trial?"trial":"pending_payment",b.employee_count,trial?new Date():null,trial?new Date(Date.now()+Number(cms.pricing.trialDays)*86400000):null,trial?null:"stub"]);
    await syncModules(client,org.id,b.plan_key,cms);
    await audit(client,u.id,"organisation.register",org.id,null,{organisation_name:b.organisation_name,mode:b.mode,plan_key:b.plan_key});
    return u;
  });
  signIn(res,user.id);
  res.status(201).json(await account(user.id));
});
authRouter.post("/login",authLimiter,async(req,res)=>{
  const parsed=LoginBody.safeParse(req.body);if(!parsed.success)fail("Enter a valid email and password");
  const u=(await pool.query("SELECT * FROM users WHERE lower(email)=lower($1) AND is_active=true",[parsed.data.email.trim()])).rows[0];
  if(!u || !await bcrypt.compare(parsed.data.password,u.password_hash))fail("Email or password is incorrect",401);
  signIn(res,u.id);res.json(await account(u.id));
});
authRouter.get("/me",requireAuth,async(req,res)=>{res.json(await account((req as any).user.id));});
authRouter.post("/logout",(_req,res)=>{res.clearCookie("peoplehub_session",{path:"/"});res.json({ok:true});});
