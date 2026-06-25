import { Router } from "express";

import { ClaimController } from "./claim.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
    createClaimValidationSchema,
    updateClaimValidationSchema,
    reviewClaimValidationSchema,
} from "./claim.validation";

import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// Customer Create Claim
// router.post(
//   "/create",
//   checkAuth(
//     Role.CUSTOMER,
//     Role.AGENT,
//     Role.AGENT_LEADER,
//   ),
//   validateRequest(
//     createClaimValidationSchema,
//   ),
//   ClaimController.createClaim,
// );

router.post(
    "/create",
    checkAuth(
        Role.CUSTOMER,
        Role.AGENT,
        Role.AGENT_LEADER,
    ),
    multerUpload.array("attachments", 10),
    validateRequest(createClaimValidationSchema),
    ClaimController.createClaim,
);

// Get All Claims
router.get(
    "/all-claims",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.AGENT_LEADER,
        Role.AGENT,
        Role.CUSTOMER,
    ),
    ClaimController.getAllClaims,
);

// Get Single Claim
router.get(
    "/:id",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.AGENT_LEADER,
        Role.AGENT,
        Role.CUSTOMER,
    ),
    ClaimController.getSingleClaim,
);

// Customer Resubmit / Update Claim
// router.patch(
//     "/:id",
//     checkAuth(
//         Role.CUSTOMER,
//     ),
//     validateRequest(
//         updateClaimValidationSchema,
//     ),
//     ClaimController.updateClaim,
// );

router.patch(
  "/:id",
  checkAuth(Role.CUSTOMER),
  multerUpload.array("attachments", 10),
  validateRequest(
    updateClaimValidationSchema,
  ),
  ClaimController.updateClaim,
);

// Admin Review Claim
router.patch(
    "/review/:id",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
    ),
    validateRequest(
        reviewClaimValidationSchema,
    ),
    ClaimController.reviewClaim,
);

// Soft Delete Claim
router.delete(
    "/:id",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
    ),
    ClaimController.softDeleteClaim,
);

export const ClaimRoutes = router;