import { z } from 'zod';

export const homepageSettingsSchema = z.object({
  activeVariant: z.enum(['original', 'alternate', 'creative']),
}).passthrough();
