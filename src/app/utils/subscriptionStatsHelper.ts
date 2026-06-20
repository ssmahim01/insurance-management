import { Subscription } from "../modules/subscription/subscription.model";

export const getSubscriptionStats = async (
  match: Record<string, any>,
  dateField?: string,
  hasDateFilter?: boolean,
) => {
  const statsMatch: any = {
    isDeleted: false,
    ...match,
  };

  if (hasDateFilter && dateField) {
    statsMatch[dateField] = match[dateField];
  }

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