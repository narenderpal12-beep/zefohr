import { z } from "zod";

const imageData = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
export function safeLogo(value:string):boolean {
  if(value.startsWith("/")&&!value.startsWith("//"))return !/[\s\\<>]/.test(value);
  try {if(new URL(value).protocol==="https:")return true;}catch {/* Check embedded image next. */}
  const match=value.match(imageData);
  if(!match || match[2].length%4!==0)return false;
  const bytes=Buffer.from(match[2],"base64");
  if(bytes.length>150000)return false;
  if(match[1]==="png"){
    if(bytes.length<24 || bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")return false;
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    return width>0&&height>0&&width<=4096&&height<=4096;
  }
  if(match[1]==="jpeg")return bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  return bytes.length>12&&bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP";
}
export const clientsSchema=z.object({
  enabled:z.boolean(),
  eyebrow:z.string().max(150),
  title:z.string().trim().min(1).max(200),
  description:z.string().max(2000),
  items:z.array(z.object({
    id:z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
    name:z.string().trim().min(1).max(150),
    alt:z.string().max(250).optional(),
    logoUrl:z.string().min(1).max(200000).refine(safeLogo,"Use a local image, an https URL, or a PNG/JPEG/WebP upload up to 150 KB."),
    website:z.string().max(2000).refine(s=>{if(!s)return true;try{return ["https:","http:"].includes(new URL(s).protocol);}catch{return false;}},"Use a full http(s) website URL or leave it blank."),
    visible:z.boolean(),
  })).max(60).refine(items=>new Set(items.map(i=>i.id)).size===items.length,"Client IDs must be unique."),
});
