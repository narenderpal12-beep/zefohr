import { readFile } from "node:fs/promises";
import { pool,seed } from "./store";
import { discoverPages } from "./seo";
import pino from "pino";
const logger = pino();
const command=process.argv[2];
try {
  if(command==="migrate" || command==="setup"){
    if(process.env.REPLIT_DEPLOYMENT) throw new Error("Use Replit Publish to apply production schema changes.");
    await pool.query(await readFile(new URL("../migrations/001_initial.sql",import.meta.url),"utf8"));
    logger.info("Development schema ready");
  }
  if(command==="seed" || command==="setup"){
    await seed(process.argv.includes("--reset"));
    await discoverPages();
    logger.info("Content seeded without overwriting edits");
  }
} catch(error){logger.error({error},"Database setup failed");process.exitCode=1;}
finally{await pool.end();}
