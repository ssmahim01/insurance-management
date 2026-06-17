import { z } from "zod";

export const PlanTypeEnum = z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
    "LIFETIME"
]);

export const planValidationSchema = z.object({
    type: PlanTypeEnum,
    durationInMonths: z.number().min(1, "Duration must be at least 1 month"),
    regularPrice: z.number().min(0, "Price must be 0 or greater"),
    discountPrice: z.number().min(0, "Price must be 0 or greater").optional(),
});

export const createInsurancePackageValidationSchema = z.object({
    name: z.string().min(2, "Name is required"),

    slug: z
        .string()
        .optional(),

    description: z.string().min(10, "Description is required"),

    coverageAmount: z
        .number()
        .min(1, "Coverage amount must be greater than 0"),

    plans: z
        .array(planValidationSchema)
        .min(1, "At least one plan is required"),

    benefits: z.array(z.string()).optional().default([]),

    exclusions: z.array(z.string()).optional().default([]),

    isActive: z.boolean().optional().default(true),
});


export const updateInsurancePackageValidationSchema = createInsurancePackageValidationSchema.partial();