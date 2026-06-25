import { Types } from "mongoose";

export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IClaim {
  _id?: Types.ObjectId;

  customer: Types.ObjectId;

  subscription: Types.ObjectId;

  serviceTitle: string;

  description: string;

  attachments?: string[];

  status: ClaimStatus;

  adminNote?: string;

  reviewedBy?: Types.ObjectId;

  reviewedAt?: Date;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}