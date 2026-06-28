import express from "express";
import { PartnerController } from "./partner.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createPartnerZodSchema, updatePartnerZodSchema } from "./partner.validation";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/create-partner",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("logo"),          
  validateRequest(createPartnerZodSchema), 
  PartnerController.createPartner    
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("logo"),
  validateRequest(updatePartnerZodSchema),
  PartnerController.updatePartner
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
    "/soft-delete/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    PartnerController.softDeletePartner
);

export const PartnerRoutes = router;