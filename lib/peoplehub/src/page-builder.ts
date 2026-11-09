import { z } from "zod";

export const SECTION_TYPES = ["original","hero","heroSlider","text","imageText","cards","faq","cta","stats","clients","suites","services","pricing","contact","ai","whyUs","integrations"] as const;
const heroLinkSchema = z.string().max(1000).refine(value => !value || /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value), "Choose a website page or a safe external link");
export const heroSlideSchema = z.object({
  eyebrow: z.string().max(150),
  title: z.string().trim().min(1).max(250),
  description: z.string().max(2000),
  imageUrl: z.string().max(200000).refine(value => !value || /^(?:\/(?!\/)|https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(value), "Choose a local image, HTTPS image or PNG/JPEG/WebP upload"),
  imageAlt: z.string().max(300),
  ctaLabel: z.string().max(100),
  ctaHref: heroLinkSchema,
  secondaryLabel: z.string().max(100),
  secondaryHref: heroLinkSchema,
}).strict();
export const heroSliderSchema = z.object({
  variant: z.enum(["split","centered","cover"]),
  autoplay: z.boolean(),
  intervalMs: z.number().int().min(3000).max(20000),
  slides: z.array(heroSlideSchema).min(1).max(8),
}).strict();
export const heroSliderDefaults: z.infer<typeof heroSliderSchema> = {
  variant: "split", autoplay: false, intervalMs: 6000,
  slides: [
    {eyebrow:"PEOPLE-FIRST HR",title:"Bring your people and processes together",description:"Manage employee records, everyday HR tasks and the employee journey from one connected workspace.",imageUrl:"/solution-photos/core-hrms.webp",imageAlt:"HR team collaborating in a workplace",ctaLabel:"Explore HRMS",ctaHref:"/features/core-hrms",secondaryLabel:"Request a demo",secondaryHref:"/request-demo"},
    {eyebrow:"PAYROLL & COMPLIANCE",title:"Make every payroll run simpler",description:"Bring payroll inputs, reviews and statutory workflows into an organised process built for growing Indian businesses.",imageUrl:"/solution-photos/payroll-and-compliance.webp",imageAlt:"Finance professionals reviewing payroll information",ctaLabel:"Explore payroll",ctaHref:"/features/payroll-and-compliance",secondaryLabel:"View pricing",secondaryHref:"/pricing"},
    {eyebrow:"TIME & ATTENDANCE",title:"A clearer view of every working day",description:"Keep attendance, leave and workforce planning connected so managers and employees can focus on their work.",imageUrl:"/solution-photos/time-and-workforce-management.webp",imageAlt:"Workforce team planning their day",ctaLabel:"Explore workforce tools",ctaHref:"/features/time-and-workforce-management",secondaryLabel:"Talk to us",secondaryHref:"/contact"},
  ],
};
export const pageSectionSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(SECTION_TYPES),
  enabled: z.boolean().default(true),
  content: z.record(z.string(), z.unknown()).default({}),
}).strict().superRefine((section,ctx) => {
  if(section.type!=="heroSlider")return;
  const result=heroSliderSchema.safeParse(section.content);
  if(!result.success)for(const issue of result.error.issues)ctx.addIssue({...issue,path:["content",...issue.path]});
});
export const pageSectionsSchema = z.array(pageSectionSchema).max(40)
  .refine(sections => new Set(sections.map(s => s.id)).size === sections.length, "Section IDs must be unique");
export const layoutPathSchema = z.string().max(500).regex(/^\/(?:[a-z0-9][a-z0-9/_-]*)?$/)
  .refine(path => !path.includes("//") && !/^\/(api|admin|dashboard|login|register)(\/|$)/.test(path), "Choose a public website page");
export const pageLayoutsSchema = z.object({
  routes: z.record(layoutPathSchema, z.object({
    sections: pageSectionsSchema.refine(sections => sections.filter(s => s.type === "original").length <= 1, "Keep at most one original page content section"),
  }).strict()),
}).strict();

export const BUILTIN_PAGE_PATHS = [
  "/","/features","/services","/pricing","/about","/about-us","/contact","/faq","/blog",
  "/media-coverage","/case-studies","/careers","/career","/support","/our-support",
  "/request-demo","/request-for-demo","/privacy-policy","/terms","/refund-policy",
] as const;
export function reservedPageSlug(slug: string) {
  return BUILTIN_PAGE_PATHS.some(path => path === `/${slug}`) ||
    /^(api|admin|dashboard|login|register|features|services|blog|case-studies|assets|solution-photos|client-logos|__mockup)(\/|$)/.test(slug) ||
    /^(robots\.txt|sitemap(?:-\d+)?\.xml|favicon\.svg)$/.test(slug);
}

/** Update exact page targets without changing unrelated links or deleting menu groups. */
export function retargetPageLinks(value: unknown, oldPath: string, newPath: string | null): unknown {
  if (Array.isArray(value)) return value.map(v => retargetPageLinks(v, oldPath, newPath)).filter(v => v !== undefined);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const hasChildren = (Array.isArray(source.groups) && source.groups.length > 0) || (Array.isArray(source.links) && source.links.length > 0);
  if (source.href === oldPath && !newPath && !hasChildren) return undefined;
  const result = Object.fromEntries(Object.entries(source).map(([key, item]) => [key, retargetPageLinks(item, oldPath, newPath)]));
  if (source.href === oldPath) result.href = newPath ?? "#";
  return result;
}
