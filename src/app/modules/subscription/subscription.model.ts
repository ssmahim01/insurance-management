import { Schema, model } from "mongoose";
import {
  ISubscription,
  SubscriptionStatus,
  PaymentStatus,
} from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    package: {
      type: Schema.Types.ObjectId,
      ref: "InsurancePackage",
      required: true,
    },

    planType: {
      type: String,
      required: true,
    },

    durationInMonths: {
      type: Number,
    },

    price: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },

    transactionId: {
      type: String,
    },

    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema
);