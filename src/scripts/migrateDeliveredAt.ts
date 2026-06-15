import mongoose from "mongoose";
import { Order } from "../app/modules/order/order.model";
import { envVars } from "../app/config/env";

const migrateDeliveredAt = async () => {
  try {
    await mongoose.connect(envVars.DB_URL!);

    const count = await Order.countDocuments({
  orderStatus: "COMPLETED",
  deliveredAt: { $exists: false },
});

console.log(count);

    console.log("Migration completed");
    // console.log("Matched:", result.matchedCount);
    // console.log("Modified:", result.modifiedCount);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrateDeliveredAt();
