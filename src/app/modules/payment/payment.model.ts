import { Schema, model, Types } from "mongoose";
import {
  IPayment,
  PaymentMethod,
  PaymentStatus,
} from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    /** 🔗 Order reference */
    order: {
      type: Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.UNPAID,
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    invoiceUrl: {
      type: String,
    },
    checkoutUrl: {  
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
