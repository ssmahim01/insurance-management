import express from "express";
import { SubscriptionControllers } from "./subscription.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createSubscriptionValidationSchema } from "./subscription.validation";

const router = express.Router();

router.post(
    "/create-subscription",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.CUSTOMER),
    validateRequest(createSubscriptionValidationSchema),
    SubscriptionControllers.createSubscription,
);

router.get(
    "/all-subscriptions",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    SubscriptionControllers.getAllSubscriptions,
);

router.get(
    "/agents-all-subscriptions/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.AGENT_LEADER),
    SubscriptionControllers.getAgentsAllSubscriptions,
);
router.get(
  "/leader-subscriptions/me",
  checkAuth(Role.AGENT_LEADER),
  SubscriptionControllers.getAgentLeaderSubscriptions,
);

router.get(
  "/leader-subscriptions/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SubscriptionControllers.getAgentLeaderSubscriptionsByAdmin,
);

router.get(
    "/my-subscriptions",
    checkAuth(...Object.values(Role)),
    SubscriptionControllers.getMySubscriptions,
);

router.get(
    "/all-trash-subscriptions",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    SubscriptionControllers.getAllTrashSubscriptions,
);

router.get(
    "/:id",
    checkAuth(...Object.values(Role)),
    SubscriptionControllers.getSingleSubscription,
);

router.patch(
    "/soft-delete/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    SubscriptionControllers.softDeleteSubscription,
);

router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT),
    SubscriptionControllers.updateSubscription,
);

export const subscriptionRoutes = router;