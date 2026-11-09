import { z } from "zod";

export const themeContentSchema = z.object({
  preset: z.enum(["aurora", "ocean", "emerald", "sunset", "rose", "royal", "slate", "teal", "amber", "crimson", "indigo", "forest"]).optional(),
  defaultMode: z.enum(["light", "dark"]).optional(),
  allowModeToggle: z.boolean().optional(),
  customColors: z.boolean().optional(),
  primary: z.string().regex(/^#[a-f0-9]{3,8}$/i).optional(),
  cyan: z.string().regex(/^#[a-f0-9]{3,8}$/i).optional(),
  pink: z.string().regex(/^#[a-f0-9]{3,8}$/i).optional(),
  background: z.string().regex(/^#[a-f0-9]{3,8}$/i).optional(),
  containerLayout: z.enum(["standard", "wide", "fluid", "custom"]).optional(),
  customContainerWidth: z.number().int().min(1080).max(1920).optional(),
}).strict();
