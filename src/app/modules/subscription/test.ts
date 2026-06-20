import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Subscription } from "./subscription.model";
import { ISubscription, PaymentStatus, SubscriptionStatus } from "./subscription.interface";
import { PlanType } from "../package/insurancepackage.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { subscriptionSearchableFields } from "./subscription.constants";
import { User } from "../user/user.model";
import { UserServices } from "../user/user.service";
import { Types } from "mongoose";
import { Role } from "../user/user.interface";
import { InsurancePackage } from "../package/insurancePackage.model";

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
  let customerId: Types.ObjectId;

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
  }

  else if (payload.customerPayload) {
    const existingCustomer = await User.findOne({
      phone: payload.customerPayload.phone,
    });

    if (existingCustomer) {
      customerId = existingCustomer._id;
    } else {
      const createdCustomer =
        await UserServices.createUserService({
          ...payload.customerPayload,
          role: Role.CUSTOMER,
          createdBy: new Types.ObjectId(userId),
        });

      customerId = createdCustomer._id as Types.ObjectId;
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
      status: SubscriptionStatus.ACTIVE,
      isDeleted: false,
    });

  if (existingSubscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Customer already has an active subscription for this package",
    );
  }

  // Create Subscription
  const subscription = await Subscription.create({
    customer: customerId,

    package: insurancePackage._id,

    planType: selectedPlan.type,

    durationInMonths:
      payload.planType === PlanType.LIFETIME
        ? undefined
        : selectedPlan.durationInMonths,

    price: payload.price,

    paymentStatus: PaymentStatus.UNPAID,

    status: SubscriptionStatus.PENDING,

    startDate,

    endDate,

    isLifetime:
      payload.planType === PlanType.LIFETIME,

    createdBy: new Types.ObjectId(userId),

    autoRenew: payload.autoRenew ?? false,

    isDeleted: false,

    isActive: true,
  });

  return subscription;
};

const getAllSubscriptions = async (query: any) => {
  const baseQuery = Subscription.find({
    isDeleted: false,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(subscriptionSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();

  return {
    data,
    meta,
  };
};

const getSingleSubscription = async (id: string) => {
  const subscription = await Subscription.findById(id)
    .populate("customer")
    .populate("package");

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
  getSingleSubscription,
  softDeleteSubscription,
  updateSubscription
};