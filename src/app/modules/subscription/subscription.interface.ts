import { Types } from "mongoose";

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PlanType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_YEARLY = "HALF_YEARLY",
  YEARLY = "YEARLY",
  LIFETIME = "LIFETIME"
}

export interface ISubscription {
  _id?: Types.ObjectId;

  customer: Types.ObjectId;          
  package: Types.ObjectId;         

  planType: PlanType;              
  durationInMonths: number;        

  startDate: Date;
  endDate: Date;

  status: SubscriptionStatus;

  paymentStatus: PaymentStatus;

  price: number;                 
  discountAmount?: number;
  payableAmount: number;

  transactionId?: string;
  paymentMethod?: string;

  autoRenew: boolean;

  policyNumber?: string;

  assignedAgent?: Types.ObjectId;
  assignedAgentLeader?: Types.ObjectId;

  createdBy?: Types.ObjectId;       // Agent/Admin who created

  createdAt?: Date;
  updatedAt?: Date;
}