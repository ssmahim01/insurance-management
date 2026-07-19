
import { Types } from "mongoose";

export enum PaymentStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}

// export interface IPayment {
//     subscription: Types.ObjectId;

//     transactionId: string;

//     amount: number;

//     invoiceUrl?: string;

//     paymentGatewayData?: any;

//     status: PaymentStatus;

//     isDeleted: boolean;
//     refundData?: any,
//     refundRefId?: string,
//     refundedAt?: string,

//     createdAt?: Date;

//     updatedAt?: Date;
// }


export interface IPayment {
  subscription: Types.ObjectId;

  transactionId: string;

  spOrderId?: string;

  amount: number;

  invoiceUrl?: string;

  paymentGatewayData?: any;

  status: PaymentStatus;

  isDeleted: boolean;

  refundData?: any;

  refundRefId?: string;

  refundedAt?: Date;
}