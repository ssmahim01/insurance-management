import { z } from "zod";

export const createPartnerZodSchema = z.object({
  name: z.string().min(2),

  logo: z.string().optional(),

  description: z.string().optional(),

  phone: z.string().optional(),

  email: z.string().email().optional(),

  website: z.string().optional(),
});

export const updatePartnerZodSchema = createPartnerZodSchema.partial();