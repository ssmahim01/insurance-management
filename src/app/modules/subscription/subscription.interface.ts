import { Types } from "mongoose";
import { PlanType } from "../package/insurancepackage.interface";
import { IUser } from "../user/user.interface";

export enum SubscriptionStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface ISubscription {
  _id?: Types.ObjectId;

  customer?: Types.ObjectId;
  customerPayload?: IUser;
  package: Types.ObjectId;

  planType: PlanType;

  durationInMonths?: number;

  price: number;

  paymentStatus: PaymentStatus;

  transactionId?: string;

  status: SubscriptionStatus;

  startDate: Date;

  endDate?: Date | null; // null for lifetime plan

  isLifetime?: boolean;

  createdBy?: Types.ObjectId;

  autoRenew?: boolean;

  isDeleted: boolean;
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}