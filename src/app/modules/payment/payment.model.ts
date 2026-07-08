
import { model, Schema } from "mongoose";
import { IPayment, PaymentStatus } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
    {
        subscription: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
            required: true,
            unique: true,
        },

        transactionId: {
            type: String,
            required: true,
            unique: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        invoiceUrl: {
            type: String,
        },

        paymentGatewayData: {
            type: Schema.Types.Mixed,
        },

        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.UNPAID,
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

export const PaymentModel = model<IPayment>(
    "Payment",
    paymentSchema
);