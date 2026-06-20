import express from "express";
import { PartnerController } from "./partner.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = express.Router();

router.post(
    "/create-partner",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    PartnerController.createPartner
);

router.get(
    "/all-partners",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.AGENT_LEADER),
    PartnerController.getAllPartners
);

router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.AGENT_LEADER, Role.AGENT, Role.CUSTOMER),
    PartnerController.getSinglePartner
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    PartnerController.updatePartner
);

router.patch(
    "/soft-delete/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    PartnerController.softDeletePartner
);

export const PartnerRoutes = router;