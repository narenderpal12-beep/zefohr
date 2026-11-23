import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import pino from "pino";
import pinoHttp from "pino-http";
import { authRouter } from "./auth";
import { contentRouter,adminRouter } from "./content";
import { seoRouter } from "./seo-routes";
export { publicData,seed,pool } from "./store";
export { resolveSeo,renderHead,sitemap,robots,discoverPages,registerSeoRoute,escapeHtml } from "./seo";
export { requireAuth,requireAdmin,requireModule } from "./auth";
export const logger=pino({level:process.env.LOG_LEVEL||"info",redact:["req.headers.authorization","req.headers.cookie","res.headers['set-cookie']"]});
export function configureApp(app:Express) {
  app.set("trust proxy",1);
  app.use(pinoHttp({logger,serializers:{req(req){return {id:req.id,method:req.method,url:req.url?.split("?")[0]};},res(res){return {statusCode:res.statusCode};}}}));
  app.use(helmet({contentSecurityPolicy:{
    directives:{
      defaultSrc:["'self'"],scriptSrc:["'self'","'unsafe-inline'","https://www.googletagmanager.com"],
      styleSrc:["'self'","'unsafe-inline'","https://fonts.googleapis.com"],
      fontSrc:["'self'","https://fonts.gstatic.com","data:"],imgSrc:["'self'","https:","data:"],
      connectSrc:["'self'","https:","ws:","wss:"],frameAncestors:["'self'","https://*.localcheck.dev","https://*.localcheck.com","https://localcheck.com"],
      upgradeInsecureRequests:process.env.NODE_ENV==="production"?[]:null,
    },
  },crossOriginEmbedderPolicy:false,frameguard:false}));
  app.use(compression());
  app.use(express.json({limit:"3mb"}));
  app.use(cookieParser());
  // Same-origin API. Reject cross-origin cookie mutations (JWT cookies use SameSite=Lax).
  app.use("/api",(req:Request,res:Response,next:NextFunction)=>{
    if(!["GET","HEAD","OPTIONS"].includes(req.method)&&req.headers.origin){
      try{if(new URL(req.headers.origin).host!==req.get("host")){res.status(403).json({error:"Cross-origin requests are not allowed"});return;}}catch{res.status(403).json({error:"Invalid origin"});return;}
    }next();
  });
  const router=express.Router();
  router.get("/healthz",(_req,res)=>{res.json({status:"ok"});});
  router.use("/v1/auth",authRouter);
  router.use("/v1",contentRouter);
  router.use("/v1/admin",adminRouter);
  router.use("/v1/seo",seoRouter);
  router.use((_req,res)=>{res.status(404).json({error:"API route not found"});});
  app.use("/api",router);
}
export function errorHandler(error:any,req:Request,res:Response,_next:NextFunction) {
  req.log?.error({code:error.code,status:error.status,message:error.message},"Request failed");
  const status=error.status??(error.code==="23505"?409:error.code==="22P02"?400:500);
  res.status(status).json({error:status===500?"Something went wrong. Please try again.":error.code==="23505"?"A record with this email or slug already exists.":error.message});
}
