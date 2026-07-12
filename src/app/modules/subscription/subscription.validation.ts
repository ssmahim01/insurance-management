
import { z } from "zod";
import { createUserZodSchema } from "../user/user.validation";

const beneficiaryZodSchema = z.object({
  name: z
    .string()
    .min(1, "Beneficiary name is required"),

  phone: z
    .string()
    .length(11, "Beneficiary phone must be 11 digits"),

  dateOfBirth: z.coerce.date().optional(),

  relationship: z
    .string()
    .min(1, "Relationship is required"),
});

export const createSubscriptionValidationSchema = z
  .object({
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

    // who the subscription actually covers
    subscribeFor: z.enum(["SELF", "OTHER"]),
    beneficiary: beneficiaryZodSchema.optional(),

    autoRenew: z.boolean().optional(),
  })
