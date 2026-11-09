import express from "express";
import path from "node:path";
import {readFile} from "node:fs/promises";
import {createServer as createViteServer} from "vite";
import {configureApp,errorHandler,publicData,resolveSeo,renderHead,sitemap,robots,pool,discoverPages,seed,logger} from "@workspace/peoplehub-core";

const production=process.env.NODE_ENV==="production";
const root=process.cwd();
const port=Number(process.env.PORT);
if(!port)throw new Error("PORT is required");
const app=express();
configureApp(app);
// Content seeding is idempotent; schema changes are never performed on startup.
await seed();
await discoverPages();
const vite=production?null:await createViteServer({configFile:path.join(root,"vite.config.ts"),server:{middlewareMode:true},appType:"custom"});
if(production) app.use("/assets",express.static(path.join(root,"dist/public/assets"),{immutable:true,maxAge:"1y"}));
app.get("/robots.txt",async(req,res)=>{res.type("text/plain").send(await robots(`${req.protocol}://${req.get("host")}`));});
app.get(/^\/sitemap(?:-(\d+))?\.xml$/,async(req,res)=>{
  const part=req.path.match(/sitemap-(\d+)/)?.[1];
  res.type("application/xml").send(await sitemap(`${req.protocol}://${req.get("host")}`,part?Number(part):undefined));
});
if(vite)app.use(vite.middlewares);
app.use(express.static(path.join(root,production?"dist/public":"public"),{index:false}));
app.get("/{*splat}",async(req,res,next)=>{
  try{
    const requestPath=req.path.length>1?req.path.replace(/\/+$/,""):req.path;
    // Apply configured redirects before page rendering.
    const redirect=(await pool.query("UPDATE redirects SET hit_count=hit_count+1 WHERE from_path=$1 AND is_active=true RETURNING *",[requestPath])).rows[0];
    if(redirect){res.redirect(redirect.status_code,redirect.to_path);return;}
    const data=await publicData();
    await discoverPages(data);
    const origin=`${req.protocol}://${req.get("host")}`;
    const seo=await resolveSeo(requestPath,data,origin);
    // Admin child routes are real app routes even though only the root is in the catalogue.
    const isApp=/^\/(admin|dashboard|login|register)(\/|$)/.test(requestPath);
    const status=seo.found||isApp?200:404;
    if(status===404 && !/\.(js|css|map|ico|png|svg|webp|jpg|woff2?)$/.test(requestPath)){
      await pool.query("INSERT INTO not_found_log(path) VALUES($1) ON CONFLICT(path) DO UPDATE SET count=not_found_log.count+1,last_seen=now()",[requestPath.slice(0,500)]);
    }
    const initial={...data,seo,path:requestPath,status};
    let template=await readFile(path.join(root,production?"dist/public/index.html":"index.html"),"utf8");
    if(vite)template=await vite.transformIndexHtml(req.originalUrl,template);
    const entry=production?await import("../dist/ssr/entry-server.js"):await vite!.ssrLoadModule("/src/entry-server.tsx");
    const html=await entry.render(initial,req.originalUrl);
    // Clear scaffold tags; real per-route metadata is added by the resolver.
    template=template.replace(/<title>[\s\S]*?<\/title>/g,"").replace(/<meta[^>]+(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/g,"").replace(/<link[^>]+rel=["'](?:canonical|icon)["'][^>]*>/g,"");
    template=template.replace("</head>",renderHead(seo)+"</head>");
    template=template.replace('<div id="root"></div>',`<div id="root">${html}</div><script>window.__INITIAL_DATA__=${JSON.stringify(initial).replace(/</g,"\\u003c")}</script>`);
    res.status(status).type("html").set("Cache-Control","no-store").send(template);
  }catch(error){vite?.ssrFixStacktrace(error as Error);next(error);}
});
app.use(errorHandler);
app.listen(port,"0.0.0.0",()=>logger.info({port},"PeopleHub SSR server running"));
