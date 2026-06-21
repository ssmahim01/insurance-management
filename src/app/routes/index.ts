import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { packageRoutes } from "../modules/package/insurancePackage.route";
import { subscriptionRoutes } from "../modules/subscription/subscription.route";
import { paymentRoutes } from "../modules/payment/payment.route";
import { PartnerRoutes } from "../modules/partner/partner.route";
import { branchRoutes } from "../modules/branch/branch.route";
import { messageRoutes } from "../modules/message/message.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/package",
    route: packageRoutes
  },
  {
    path: "/subscription",
    route: subscriptionRoutes
  },
  {
    path: "/payment",
    route: paymentRoutes
  },
   {
    path: "/partner",
    route: PartnerRoutes
  },
     {
    path: "/branch",
    route: branchRoutes
  },
     {
    path: "/message",
    route: messageRoutes
  }
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
