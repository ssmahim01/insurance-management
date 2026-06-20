import { z } from "zod";
import { createUserZodSchema } from "../user/user.validation";

export const createSubscriptionValidationSchema = z.object({
  customer: z.string().optional(),
  customerPayload: createUserZodSchema.optional(),
  package: z.string(),

  planType: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
    "LIFETIME",
  ]),

  durationInMonths: z.number().optional(),

  price: z.number(),

  autoRenew: z.boolean().optional(),
});