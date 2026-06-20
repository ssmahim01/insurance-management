import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { BranchControllers } from "./branch.controller";

const router = express.Router();

router.post(
  "/create-branch",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  BranchControllers.createPartnerBranch,
);

router.get(
  "/all-branches",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.CUSTOMER),
  BranchControllers.getAllPartnerBranches,
);

router.get(
  "/all-trash-branches",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.CUSTOMER),
  BranchControllers.getAllTrashPartnerBranches,
); 
router.get(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.CUSTOMER),
  BranchControllers.getSinglePartnerBranch,
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  BranchControllers.updatePartnerBranch,
);

router.patch(
  "/soft-delete/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  BranchControllers.softDeletePartnerBranch,
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  BranchControllers.deletePartnerBranch,
);

router.get(
  "/nearby/search",
  checkAuth(Role.CUSTOMER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  BranchControllers.getNearbyBranches,
);

export const branchRoutes = router;