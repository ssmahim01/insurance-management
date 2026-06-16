import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT_LEADER = "AGENT_LEADER",
  AGENT = "AGENT",
  CUSTOMER = "CUSTOMER",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser {
  _id?: Types.ObjectId;

  createdBy?: Types.ObjectId;

  name: string;

  phone: string;

  password?: string;

  role: Role;

  picture?: string;

  isActive?: IsActive;

  isVerified?: boolean;

  isDeleted?: boolean;

  lastLoginAt?: Date;
}