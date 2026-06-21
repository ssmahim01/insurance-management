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

export interface IAddress {
  division?: string;
  district?: string;
  thana?: string;
  union?: string;
}

export interface IUser {
  _id?: Types.ObjectId;

  createdBy?: Types.ObjectId;

  agentLeader?: Types.ObjectId; // only for agents

  name: string;

  address?: IAddress;

  phone: string;

  email?: string;

  password?: string;

  role: Role;

  picture?: string;

  salary?: string;

  salaryPerCustomer?: string;

  isActive?: IsActive;

  isVerified?: boolean;

  isDeleted?: boolean;

  lastLoginAt?: Date;
}
