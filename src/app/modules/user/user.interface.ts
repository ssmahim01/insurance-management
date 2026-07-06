
import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT_LEADER = "AGENT_LEADER",
  AGENT = "AGENT",
  CUSTOMER = "CUSTOMER",
  MANAGER = "MANAGER",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IAddress {
  division?: string;
  district?: string;
  thana?: string;
  union?: string;
}

// NOMINEE INFO (CUSTOMER ONLY)

export interface INominee {
  name?: string;
  age?: number;
  relationship?: string;
  phone?: string;
}

// USER INTERFACE

export interface IUser {
  _id?: Types.ObjectId;

  createdBy?: Types.ObjectId;

  agentLeader?: Types.ObjectId; // only for agents

  // BASIC INFO
  name: string; // full name (NID/Passport/Birth cert)

  phone: string; // mobile number (required)

  email?: string;

  password?: string;

  picture?: string;

  role: Role;

  // CUSTOMER SPECIFIC INFO
  nid?: string;

  dateOfBirth?: Date;

  gender?: "MALE" | "FEMALE" | "OTHER";

  address?: IAddress;

  // NOMINEE INFO
  nominee?: INominee;

  // EMPLOYEE RELATED
  salary?: string;

  salaryPerCustomer?: string;

  // SYSTEM FLAGS
  isActive?: IsActive;

  isVerified?: boolean;

  isDeleted?: boolean;

  lastLoginAt?: Date;
}