
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Subscription } from "./subscription.model";
import { ISubscription, PaymentStatus, SubscriptionStatus } from "./subscription.interface";
import { PlanType } from "../package/insurancepackage.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { subscriptionSearchableFields } from "./subscription.constants";
import { User } from "../user/user.model";
import { UserServices } from "../user/user.service";
import mongoose, { Types } from "mongoose";
import { Role } from "../user/user.interface";
import { InsurancePackage } from "../package/insurancePackage.model";
import { PaymentModel } from "../payment/payment.model";
import { PaymentService } from "../payment/payment.service";
import { sendSMS } from "../../utils/sendSms";

const createSubscription = async (
  payload: Partial<ISubscription> & {
    customerPayload?: {
      name: string;
      phone: string;
      password?: string;
    };
  },
  userId: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let customerId: Types.ObjectId;
    let customer;

    // Customer Resolve
    if (payload.customer) {
      const existingCustomer = await User.findById(payload.customer);

      if (!existingCustomer) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Customer not found",
        );
      }

      customerId = existingCustomer._id;
      customer = existingCustomer;
    }

    else if (payload.customerPayload) {
      const existingCustomer = await User.findOne({
        phone: payload.customerPayload.phone,
      });

      if (existingCustomer) {
        customerId = existingCustomer._id;
        customer = existingCustomer;
      } else {
        const createdCustomer =
          await UserServices.createUserService({
            ...payload.customerPayload,
            role: Role.CUSTOMER,
            createdBy: new Types.ObjectId(userId),
          });

        customerId = createdCustomer._id as Types.ObjectId;
        customer = createdCustomer
      }
    }

    else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Customer information is required",
      );
    }

    // Package Validation
    const insurancePackage = await InsurancePackage.findById(
      payload.package,
    );

    if (!insurancePackage) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Package not found",
      );
    }

    // Plan Validation
    const selectedPlan = insurancePackage.plans.find(
      (plan) => plan.type === payload.planType,
    );

    if (!selectedPlan) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected plan is not available for this package",
      );
    }
    const expectedPrice =
      selectedPlan.discountPrice || selectedPlan.regularPrice;

    if (payload.price !== expectedPrice) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Price mismatch. Expected ${expectedPrice}`,
      );
    }

    // Date Calculation
    const startDate = new Date();

    let endDate: Date | null = null;

    if (payload.planType !== PlanType.LIFETIME) {
      endDate = new Date(startDate);

      endDate.setMonth(
        endDate.getMonth() + selectedPlan.durationInMonths,
      );
    }

    // Prevent Duplicate Active Subscription
    const existingSubscription =
      await Subscription.findOne({
        customer: customerId,
        package: insurancePackage._id,
        isDeleted: false,
      });

    if (existingSubscription) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Customer already has an active subscription for this package",
      );
    }

    const transactionId = `TXN-${Date.now()}`;

    // Create Subscription
    const subscription = await Subscription.create(
      [
        {
          customer: customerId,

          package: insurancePackage._id,

          planType: selectedPlan.type,

          durationInMonths:
            payload.planType === PlanType.LIFETIME
              ? undefined
              : selectedPlan.durationInMonths,

          price: payload.price,

          transactionId: transactionId,

          paymentStatus: PaymentStatus.UNPAID,

          status: SubscriptionStatus.PENDING,

          startDate,

          endDate,

          isLifetime:
            payload.planType === PlanType.LIFETIME,

          createdBy: new Types.ObjectId(userId),

          autoRenew: payload.autoRenew ?? false,

          isDeleted: false,

          isActive: false,
        }
      ],
      { session });

    const amount = subscription[0].price;

    if (!amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Course price not found"
      );
    }

    await PaymentModel.create(
      {
        subscription: subscription[0]._id,
        transactionId,
        amount,
      }

    );



    await session.commitTransaction();
    session.endSession();


    const paymentInitRes = await PaymentService.initPayment(subscription[0]._id);

    await sendSMS(
      customer.phone,
      `Your payment url is ${paymentInitRes?.paymentUrl}`
    );

    return {
      data: {
        subscription: subscription[0],
        paymentUrl: paymentInitRes.paymentUrl,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// =========================================================
// SHARED HELPERS (date filter + stats shape)
// Kept private to this module so every list endpoint stays
// in sync with the pattern used in getAllSubscriptions.
// =========================================================

const dateFieldMap: Record<string, string> = {
  created: "createdAt",
  updatedAt: "updatedAt",
  startDate: "startDate",
  endDate: "endDate",
};

// Subscription document stores `customer` as an ObjectId reference — you
// cannot regex-search `customer.name` on the raw document.  This helper
// looks up matching User IDs BEFORE the main query so we can inject
// { customer: { $in: [...ids] } } into the Subscription find filter.
//
// Also resolves `createdBy` the same way so agent-name search also works.
//
// Returns an empty object when no searchTerm is given (no extra filter).
const resolveCustomerFilter = async (
  searchTerm?: string,
): Promise<Record<string, any>> => {
  if (!searchTerm || !searchTerm.trim()) return {};

  const matchingUsers = await User.find({
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ],
  }).select("_id");

  if (!matchingUsers.length) return { _id: null }; // no user matched → force empty result

  const userIds = matchingUsers.map((u) => u._id);

  // match subscriptions where the customer OR the creator matches
  return {
    $or: [
      { customer: { $in: userIds } },
      { createdBy: { $in: userIds } },
    ],
  };
};

// Returns the 00:00:00.000 -> 23:59:59.999 UTC boundary for the calendar
// day represented by a date-only string like "2026-06-18". Using UTC
// components (instead of setHours, which uses server-local time) keeps
// this correct no matter what timezone the server runs in.
const getDayBoundariesUTC = (dateStr: string) => {
  const d = new Date(dateStr);

  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );

  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );

  return { start, end };
};

// Date filtering rules (per product requirement):
// - startDate AND endDate given -> inclusive range between the two days
// - ONLY startDate given        -> records on that single day only
// - ONLY endDate given          -> records on that single day only
// - neither given                -> no date filter
const buildDateRangeFilter = (
  startDateStr?: string,
  endDateStr?: string,
): { $gte: Date; $lte: Date } | null => {
  if (startDateStr && endDateStr) {
    return {
      $gte: getDayBoundariesUTC(startDateStr).start,
      $lte: getDayBoundariesUTC(endDateStr).end,
    };
  }

  if (startDateStr) {
    const { start, end } = getDayBoundariesUTC(startDateStr);
    return { $gte: start, $lte: end };
  }

  if (endDateStr) {
    const { start, end } = getDayBoundariesUTC(endDateStr);
    return { $gte: start, $lte: end };
  }

  return null;
};

// Decides WHICH field(s) the startDate/endDate query params apply to.
//
// - dateType given (created / updatedAt / startDate / endDate) -> EXPLICIT
//   mode: both params act as bounds on that ONE field (range if both
//   given, exact-day match if only one given) — same logic as before.
//
// - dateType NOT given -> DEFAULT mode:
//     * ONLY startDate given -> exact-day match on doc.startDate
//     * ONLY endDate given   -> exact-day match on doc.endDate
//     * BOTH given           -> RANGE: doc.startDate >= startDate param
//       AND doc.endDate <= endDate param, i.e. every subscription whose
//       active window falls inside the given two dates.
const buildDateFilterObject = (
  dateType: string | undefined,
  startDateStr?: string,
  endDateStr?: string,
): Record<string, { $gte?: Date; $lte?: Date }> => {
  const result: Record<string, { $gte?: Date; $lte?: Date }> = {};

  if (dateType && dateFieldMap[dateType]) {
    const dateField = dateFieldMap[dateType];
    const range = buildDateRangeFilter(startDateStr, endDateStr);

    if (range) {
      result[dateField] = range;
    }

    return result;
  }

  if (startDateStr && endDateStr) {
    result.startDate = { $gte: getDayBoundariesUTC(startDateStr).start };
    result.endDate = { $lte: getDayBoundariesUTC(endDateStr).end };
    return result;
  }

  if (startDateStr) {
    const { start, end } = getDayBoundariesUTC(startDateStr);
    result.startDate = { $gte: start, $lte: end };
    return result;
  }

  if (endDateStr) {
    const { start, end } = getDayBoundariesUTC(endDateStr);
    result.endDate = { $gte: start, $lte: end };
    return result;
  }

  return result;
};

const buildDateAndStatusFilter = (query: Record<string, string>) => {
  const queryObj: any = {};

  // capture the raw strings BEFORE we delete them from query, so the
  // stats aggregation below can reuse the exact same date range
  const dateType = query.dateType;
  const startDateStr = query["startDate"];
  const endDateStr = query["endDate"];

  Object.assign(
    queryObj,
    buildDateFilterObject(dateType, startDateStr, endDateStr),
  );

  if (query.status) {
    queryObj.status = query.status;
  }

  if (query.paymentStatus) {
    queryObj.paymentStatus = query.paymentStatus;
  }

  // remove special fields so QueryBuilder doesn't choke on them
  delete query.startDate;
  delete query.endDate;
  delete query.dateType;

  return { queryObj, dateType, startDateStr, endDateStr };
};

const buildStatsMatch = (
  baseMatch: Record<string, any>,
  dateType: string | undefined,
  startDateStr?: string,
  endDateStr?: string,
) => {
  return {
    ...baseMatch,
    ...buildDateFilterObject(dateType, startDateStr, endDateStr),
  };
};

const getSubscriptionStats = async (statsMatch: Record<string, any>) => {
  const statsAgg = await Subscription.aggregate([
    { $match: statsMatch },
    {
      $group: {
        _id: null,

        total: { $sum: 1 },

        active: {
          $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
        },

        pending: {
          $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
        },

        expired: {
          $sum: { $cond: [{ $eq: ["$status", "EXPIRED"] }, 1, 0] },
        },

        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
        },

        paid: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0] },
        },

        unpaid: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "UNPAID"] }, 1, 0] },
        },

        refunded: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "REFUNDED"] }, 1, 0] },
        },

        failed: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "FAILED"] }, 1, 0] },
        },

        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$paymentStatus", "PAID"] },
              "$price",
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    statsAgg[0] || {
      total: 0,
      active: 0,
      pending: 0,
      expired: 0,
      cancelled: 0,
      paid: 0,
      unpaid: 0,
      refunded: 0,
      failed: 0,
      totalRevenue: 0,
    }
  );
};

// Resolves a free-text searchTerm into a Subscription-level $or filter
// that matches customer name OR createdBy name.
//
// Perfectly Working version
const getAllSubscriptions = async (query: Record<string, string>) => {
  const { queryObj, dateType, startDateStr, endDateStr } =
    buildDateAndStatusFilter(query);

  const customerFilter = await resolveCustomerFilter(query.searchTerm);

  // =========================
  // BASE DATA QUERY
  // =========================
  const baseQuery = Subscription.find({
    isDeleted: false,
    ...queryObj,
    ...customerFilter,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name phone")
    .populate("package", "name slug description coverageAmount")
    .populate("createdBy", "name phone role");

  const meta = await queryBuilder.getMeta();

  // =========================
  // STATS QUERY
  // =========================
  const statsMatch = buildStatsMatch(
    { isDeleted: false },
    dateType,
    startDateStr,
    endDateStr,
  );
  const stats = await getSubscriptionStats(statsMatch);

  return {
    data,
    meta,
    stats,
  };
};

const getAllSubscriptionsByAgent = async ({
  query,
  userId,
}: {
  query: Record<string, string>;
  userId: string;
}) => {
  const { queryObj, dateType, startDateStr, endDateStr } =
    buildDateAndStatusFilter(query);

  const customerFilter = await resolveCustomerFilter(query.searchTerm);

  // =========================
  // BASE DATA QUERY
  // =========================
  const baseQuery = Subscription.find({
    isDeleted: false,
    createdBy: userId,
    ...queryObj,
    ...customerFilter,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name phone")
    .populate(
      "package",
      "name slug description coverageAmount",
    )
    .populate("createdBy", "name phone role");

  const meta = await queryBuilder.getMeta();

  // =========================
  // STATS QUERY
  // =========================
  const statsMatch = buildStatsMatch(
    { isDeleted: false, createdBy: new Types.ObjectId(userId) },
    dateType,
    startDateStr,
    endDateStr,
  );
  const stats = await getSubscriptionStats(statsMatch);

  return {
    data,
    meta,
    stats,
  };
};

const getMySubscriptions = async ({
  query,
  userId,
}: {
  query: Record<string, string>;
  userId: string;
}) => {
  const { queryObj, dateType, startDateStr, endDateStr } =
    buildDateAndStatusFilter(query);

  const customerFilter = await resolveCustomerFilter(query.searchTerm);

  const ownershipFilter = {
    $or: [
      { createdBy: userId },
      { customer: userId },
    ],
  };

  // =========================
  // BASE DATA QUERY
  // =========================
  const baseQuery = Subscription.find({
    isDeleted: false,
    ...queryObj,
    // combine ownership $or and customer-search $or safely with $and
    ...(customerFilter.$or
      ? { $and: [ownershipFilter, customerFilter] }
      : ownershipFilter),
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name phone")
    .populate(
      "package",
      "name slug description coverageAmount",
    )
    .populate("createdBy", "name phone role");

  const meta = await queryBuilder.getMeta();

  // =========================
  // STATS QUERY
  // =========================
  const statsMatch = buildStatsMatch(
    {
      isDeleted: false,
      $or: [
        { createdBy: new Types.ObjectId(userId) },
        { customer: new Types.ObjectId(userId) },
      ],
    },
    dateType,
    startDateStr,
    endDateStr,
  );
  const stats = await getSubscriptionStats(statsMatch);

  return {
    data,
    meta,
    stats,
  };
};

const getAllTrashSubscriptions = async (query: Record<string, string>) => {
  const { queryObj, dateType, startDateStr, endDateStr } =
    buildDateAndStatusFilter(query);

  const customerFilter = await resolveCustomerFilter(query.searchTerm);

  // =========================
  // BASE DATA QUERY
  // =========================
  const baseQuery = Subscription.find({
    isDeleted: true,
    ...queryObj,
    ...customerFilter,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name phone")
    .populate("package", "name slug description coverageAmount")
    .populate("createdBy", "name phone role");

  const meta = await queryBuilder.getMeta();

  // =========================
  // STATS QUERY
  // =========================
  const statsMatch = buildStatsMatch(
    { isDeleted: true },
    dateType,
    startDateStr,
    endDateStr,
  );
  const stats = await getSubscriptionStats(statsMatch);

  return {
    data,
    meta,
    stats,
  };
};

const getAgentLeaderSubscriptions = async ({
  query,
  userId,
}: {
  query: Record<string, string>;
  userId: string;
}) => {
  // 1. Get agents under leader
  const agents = await User.find({
    agentLeader: userId,
    role: Role.AGENT,
  }).select("_id");

  const agentIds = agents.map((a) => a._id);

  const { queryObj, dateType, startDateStr, endDateStr } =
    buildDateAndStatusFilter(query);

  const customerFilter = await resolveCustomerFilter(query.searchTerm);

  // =========================
  // BASE DATA QUERY (subscriptions created by those agents)
  // =========================
  const baseQuery = Subscription.find({
    isDeleted: false,
    createdBy: { $in: agentIds },
    ...queryObj,
    ...customerFilter,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("customer", "name phone")
    .populate("package", "name slug description coverageAmount")
    .populate("createdBy", "name phone role");

  const meta = await queryBuilder.getMeta();

  // =========================
  // STATS QUERY (scoped to this leader's agents)
  // =========================
  const statsMatch = buildStatsMatch(
    { isDeleted: false, createdBy: { $in: agentIds } },
    dateType,
    startDateStr,
    endDateStr,
  );
  const stats = await getSubscriptionStats(statsMatch);

  return {
    data,
    meta,
    stats,
  };
};

const getSingleSubscription = async (id: string) => {
  const subscription = await Subscription.findById(id)
    .populate("customer")
    .populate("package")
    .populate("createdBy", "name role");

  if (!subscription) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Subscription not found",
    );
  }

  return subscription;
};

const softDeleteSubscription = async (id: string) => {
  const subscription = await Subscription.findById(id);

  if (!subscription) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Subscription not found",
    );
  }

  return await Subscription.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
};

const updateSubscription = async (
  id: string,
  payload: Partial<ISubscription>,
) => {
  const existing = await Subscription.findById(id);

  if (!existing) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Subscription not found",
    );
  }

  // prevent invalid updates
  if (payload.planType === PlanType.LIFETIME) {
    payload.durationInMonths = undefined;
    payload.endDate = null;
  }

  if (payload.planType && payload.planType !== PlanType.LIFETIME) {
    const durationMap: Record<string, number> = {
      MONTHLY: 1,
      QUARTERLY: 3,
      HALF_YEARLY: 6,
      YEARLY: 12,
    };

    const duration = durationMap[payload.planType];

    payload.durationInMonths = duration;

    const startDate = payload.startDate || existing.startDate;

    payload.endDate = new Date(
      new Date(startDate).getTime() +
      duration * 30 * 24 * 60 * 60 * 1000,
    );
  }

  const updated = await Subscription.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  return updated;
};

export const SubscriptionServices = {
  createSubscription,
  getAllSubscriptions,
  getAllTrashSubscriptions,
  getSingleSubscription,
  softDeleteSubscription,
  updateSubscription,
  getAllSubscriptionsByAgent,
  getAgentLeaderSubscriptions,
  getMySubscriptions
};
