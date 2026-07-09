
import { Types } from "mongoose";
import { IUser } from "../user/user.interface";
import { PlanType } from "../package/insurance-package.interface";

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
  COMPLETED = "COMPLETED",
}

// Who the subscription is being purchased for
export enum SubscribeFor {
  SELF = "SELF",
  OTHER = "OTHER",
}

// Filled in only when subscribeFor === OTHER
export interface IBeneficiary {
  name: string;
  phone: string;
  dateOfBirth?: Date;
  relationship: string;
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

  // Who is actually covered by this subscription — the account holder
  // themself, or someone else (spouse, parent, child, etc.)
  subscribeFor: SubscribeFor;
  beneficiary?: IBeneficiary;

  createdBy?: Types.ObjectId;

  autoRenew?: boolean;

  isDeleted: boolean;
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}