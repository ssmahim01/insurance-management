import { Types } from "mongoose";

export enum PaymentMethod {
  COD = "COD",
  STRIPE = "STRIPE",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  FAILED = "FAILED",
}

export interface IPayment {
  _id?: Types.ObjectId;

  /** 🔥 Order reference */
  order: Types.ObjectId;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  transactionId?: string;
  amount: number;
  invoiceUrl?: string;
  checkoutUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
