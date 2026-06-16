import { z } from "zod";
import { IsActive, Role } from "./user.interface";

const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),

  phone: z
    .string({ invalid_type_error: "Phone number must be string" })
    .regex(bdPhoneRegex, {
      message:
        "Phone number must be valid for Bangladesh. Example: 017XXXXXXXX or +88017XXXXXXXX",
    }),

  password: z
    .string({ invalid_type_error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long." }),

  role: z
    .enum([Role.SUPER_ADMIN, Role.AGENT_LEADER, Role.AGENT, Role.CUSTOMER, Role.ADMIN])
    .optional(),

  picture: z
    .string({ invalid_type_error: "Picture must be string" })
    .optional()
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),

  phone: z
    .string({ invalid_type_error: "Phone number must be string" })
    .regex(bdPhoneRegex, {
      message:
        "Phone number must be valid for Bangladesh. Example: 017XXXXXXXX or +88017XXXXXXXX",
    })
    .optional(),

  password: z
    .string({ invalid_type_error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long." })
    .optional(),

  role: z
    .enum([Role.SUPER_ADMIN, Role.AGENT_LEADER, Role.AGENT, Role.CUSTOMER])
    .optional(),

  picture: z
    .string({ invalid_type_error: "Picture must be string" })
    .optional(),

  isActive: z
    .enum([IsActive.ACTIVE, IsActive.INACTIVE, IsActive.BLOCKED])
    .optional(),

  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),

  isVerified: z
    .boolean({ invalid_type_error: "isVerified must be true or false" })
    .optional(),
});
