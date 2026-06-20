
import { Types } from "mongoose";

export enum PaymentStatus {
    UNPAID = "UNPAID",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}

export interface IPayment {
    subscription: Types.ObjectId;

    transactionId: string;

    amount: number;

    invoiceUrl?: string;

    paymentGatewayData?: any;

    status: PaymentStatus;

    createdAt?: Date;

    updatedAt?: Date;
}