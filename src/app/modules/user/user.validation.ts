
import { z } from "zod";
import { IsActive, Role } from "./user.interface";

const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

// ADDRESS VALIDATION
const addressSchema = z.object({
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  union: z.string().optional(),
});

// NOMINEE VALIDATION
const nomineeSchema = z.object({
  name: z.string().optional(),
  age: z.number().min(0).optional(),
  relationship: z.string().optional(),
  phone: z
    .string()
    .regex(bdPhoneRegex, {
      message: "Invalid nominee phone number",
    })
    .optional(),
});

// CREATE USER SCHEMA
export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50),

  phone: z.string().regex(bdPhoneRegex, {
    message:
      "Phone must be valid Bangladesh number (017XXXXXXXX / +88017XXXXXXXX)",
  }),

  password: z.string().min(8).optional(),

  role: z
    .enum([
      Role.SUPER_ADMIN,
      Role.AGENT_LEADER,
      Role.AGENT,
      Role.CUSTOMER,
      Role.ADMIN,
      Role.MANAGER,
    ])
    .optional(),

  picture: z.string().optional(),

  agentLeader: z.string().optional(),

  // CUSTOMER FIELDS (NEW)
  nid: z.string().optional(),

  dateOfBirth: z.string().date().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  address: addressSchema.optional(),

  nominee: nomineeSchema.optional(),
});

// UPDATE USER SCHEMA
export const updateUserZodSchema = z.object({
  name: z.string().min(2).max(50).optional(),

  phone: z.string().regex(bdPhoneRegex).optional(),

  password: z.string().min(8).optional(),

  role: z
    .enum([
      Role.SUPER_ADMIN,
      Role.AGENT_LEADER,
      Role.AGENT,
      Role.CUSTOMER,
      Role.ADMIN,
      Role.MANAGER
    ])
    .optional(),

  picture: z.string().optional(),

  isActive: z
    .enum([IsActive.ACTIVE, IsActive.INACTIVE, IsActive.BLOCKED])
    .optional(),

  isDeleted: z.boolean().optional(),

  isVerified: z.boolean().optional(),

  agentLeader: z.string().optional(),

  // CUSTOMER FIELDS (NEW)
  nid: z.string().optional(),

  dateOfBirth: z.string().date().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  address: addressSchema.optional(),

  nominee: nomineeSchema.optional(),
});