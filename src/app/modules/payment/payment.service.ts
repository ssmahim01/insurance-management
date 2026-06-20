

import { PaymentModel } from "./payment.model";
import { PaymentStatus } from "./payment.interface";
import { SSLCommerzService } from "../sslCommerz/sslCommerz.service";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes"
import mongoose from "mongoose";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { paymentSearchableFields } from "./payment.constants";
import { Subscription } from "../subscription/subscription.model";
import { SubscriptionStatus } from "../subscription/subscription.interface";


const initPayment = async (
    subscriptionId: any
) => {

    const payment = await PaymentModel
        .findOne({ subscription: subscriptionId });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    const subscription = await Subscription
        .findById(subscriptionId)

    const customer = await User.findById(subscription?.customer)

    if (!customer) {
        throw new AppError(httpStatus.BAD_REQUEST, "Customer not found")
    }

    const sslPayload = {
        amount: payment.amount,
        transactionId: payment.transactionId,
        name: customer.name,
        email: customer?.email,
        phone: customer.phone,
        address: customer?.address?.thana || "N/A",
        city: customer?.address?.district || "N/A"
    };

    const sslPayment = await SSLCommerzService.sslPaymentInit(
        sslPayload
    );

    return {
        paymentUrl:
            sslPayment.GatewayPageURL,
    };
};

const successPayment = async (query: Record<string, string>) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const transactionId =
            query.tran_id || query.transactionId;

        const updatedPayment =
            await PaymentModel.findOneAndUpdate(
                { transactionId },
                { status: PaymentStatus.COMPLETED },
                { returnDocument: "after", runValidators: true, session }
            );

        if (!updatedPayment) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Payment not found"
            );
        }

        // Fetch subscription to get plan details for date calculation
        const subscription = await Subscription.findById(
            updatedPayment.subscription
        ).session(session);

        if (!subscription) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Subscription not found"
            );
        }

        const startDate = new Date();

        // LIFETIME plan এ endDate থাকে না
        const endDate =
            subscription.isLifetime || !subscription.durationInMonths
                ? null
                : new Date(
                    startDate.getTime() +
                    subscription.durationInMonths * 30 * 24 * 60 * 60 * 1000
                );

        await Subscription.findByIdAndUpdate(
            updatedPayment.subscription,
            {
                status: SubscriptionStatus.ACTIVE,
                paymentStatus: PaymentStatus.COMPLETED,
                isActive: true,
                startDate,
                ...(endDate !== null && { endDate }),
            },
            { session }
        );

        await session.commitTransaction();

        return {
            success: true,
            message: "Payment complete and Subscription activated",
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};


const failPayment = async (query: Record<string, string>) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const transactionId =
            query.tran_id || query.transactionId;

        const updatedPayment =
            await PaymentModel.findOneAndUpdate(
                { transactionId },
                { status: PaymentStatus.FAILED },
                { returnDocument: "after", runValidators: true, session }
            );

        if (!updatedPayment) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Payment not found"
            );
        }

        await Subscription.findByIdAndUpdate(
            updatedPayment.subscription,
            { status: SubscriptionStatus.FAILED },
            { session }
        );

        await session.commitTransaction();

        return {
            success: false,
            message: "Payment Failed",
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const cancelPayment = async (query: Record<string, string>) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const transactionId =
            query.tran_id || query.transactionId;

        const updatedPayment =
            await PaymentModel.findOneAndUpdate(
                { transactionId },
                { status: PaymentStatus.CANCELLED },
                { returnDocument: "after", runValidators: true, session }
            );

        if (!updatedPayment) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Payment not found"
            );
        }

        await Subscription.findByIdAndUpdate(
            updatedPayment.subscription,
            {
                status: SubscriptionStatus.CANCELLED,
            },
            { session }
        );

        await session.commitTransaction();

        return {
            success: false,
            message: "Payment Cancelled",
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updatePayment = async (id: string, payload: any) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const updatedPayment = await PaymentModel.findByIdAndUpdate(
            id,
            payload,
            { returnDocument: "after", runValidators: true, session }
        );
        if (!updatedPayment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
        }

        if (payload.status) {
            const statusMap: Record<string, string> = {
                [PaymentStatus.COMPLETED]: SubscriptionStatus.ACTIVE,
                [PaymentStatus.FAILED]: SubscriptionStatus.FAILED,
                [PaymentStatus.CANCELLED]: SubscriptionStatus.CANCELLED,
            };

            const subscriptionStatus = statusMap[payload.status];

            if (subscriptionStatus) {
                await Subscription.findByIdAndUpdate(
                    updatedPayment.subscription,
                    { status: subscriptionStatus },
                    { session }
                );
            }
        }

        await session.commitTransaction();
        return { data: updatedPayment };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// =============================================================
// DATE FILTER HELPERS (payment-specific)
//
// Payment documents don't have their own startDate/endDate fields
// so the filter always targets a single date field (default: createdAt).
//
// dateType param controls which field is used:
//   created   -> createdAt  (default)
//   updatedAt -> updatedAt
//
// startDate + endDate together -> range (inclusive)
// only startDate               -> exact day match
// only endDate                 -> exact day match


const getPaymentDayBoundariesUTC = (dateStr: string) => {
    const d = new Date(dateStr);
    const start = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
    const end = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
    );
    return { start, end };
};

const buildPaymentDateFilter = (
    startDateStr: string | undefined,
    endDateStr: string | undefined,
): Record<string, { $gte?: Date; $lte?: Date }> => {
    if (!startDateStr && !endDateStr) return {};

    if (startDateStr && endDateStr) {
        return {
            createdAt: {
                $gte: getPaymentDayBoundariesUTC(startDateStr).start,
                $lte: getPaymentDayBoundariesUTC(endDateStr).end,
            },
        };
    }

    if (startDateStr) {
        const { start, end } = getPaymentDayBoundariesUTC(startDateStr);
        return { createdAt: { $gte: start, $lte: end } };
    }

    const { start, end } = getPaymentDayBoundariesUTC(endDateStr!);
    return { createdAt: { $gte: start, $lte: end } };
};

const buildPaymentQueryObj = (query: Record<string, string>) => {
    const queryObj: any = {};

    const startDateStr = query["startDate"];
    const endDateStr = query["endDate"];

    Object.assign(queryObj, buildPaymentDateFilter(startDateStr, endDateStr));

    if (query.status) queryObj.status = query.status;

    delete query.startDate;
    delete query.endDate;
    delete query.dateType;

    return { queryObj, startDateStr, endDateStr };
};

const getPaymentStats = async (match: Record<string, any>) => {
    const agg = await PaymentModel.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
                totalRevenue: {
                    $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$amount", 0] },
                },
            },
        },
    ]);

    return agg[0] || {
        total: 0, completed: 0, pending: 0,
        failed: 0, cancelled: 0, totalRevenue: 0,
    };
};

const getAllPayments = async (query: Record<string, string>) => {
    const { queryObj, startDateStr, endDateStr } =
        buildPaymentQueryObj(query);

    const baseQuery = PaymentModel.find(queryObj);
    const queryBuilder = new QueryBuilder(baseQuery, query);

    const data = await queryBuilder
        .search(paymentSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate()
        .build()
        .populate("subscription", "planType durationInMonths price status");

    const meta = await queryBuilder.getMeta();

    const statsMatch = buildPaymentDateFilter(startDateStr, endDateStr);
    const stats = await getPaymentStats(statsMatch);

    return { data, meta, stats };
};

const getSinglePayment = async (id: string) => {
    const result = await PaymentModel.findById(id)
        .populate("subscription");

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    return { data: result };
};

const softDeletePayment = async (id: string) => {
    await PaymentModel.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
        }
    );

    return null;
};

const deletePayment = async (id: string) => {
    const result = await PaymentModel.findByIdAndDelete(id);
    return { data: result };
};


export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    updatePayment,
    getAllPayments,
    getSinglePayment,
    softDeletePayment,
    deletePayment,
};