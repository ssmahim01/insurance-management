import { z } from "zod";
import { ClaimStatus } from "./claim.interface";

export const createClaimValidationSchema = z.object({
  customer: z
    .string({
      required_error: "Customer is required",
    })
    .min(1, "Customer is required"),

  subscription: z
    .string({
      required_error: "Subscription is required",
    })
    .min(1, "Subscription is required"),

  serviceTitle: z
    .string({
      required_error: "Service title is required",
    })
    .min(2, "Service title must be at least 2 characters"),

  description: z
    .string({
      required_error: "Description is required",
    })
    .min(5, "Description must be at least 5 characters"),

  attachments: z
    .array(z.string())
    .optional(),
});

export const updateClaimValidationSchema = z.object({
  serviceTitle: z
    .string()
    .min(2)
    .optional(),

  description: z
    .string()
    .min(5)
    .optional(),

  attachments: z
    .array(z.string())
    .optional(),
});

export const reviewClaimValidationSchema = z.object({
  status: z.enum([
    ClaimStatus.APPROVED,
    ClaimStatus.REJECTED,
  ]),

  adminNote: z
    .string()
    .optional(),
});