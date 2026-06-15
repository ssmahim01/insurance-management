import express from "express";
import { UserControllers } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createUserZodSchema,
  updateUserZodSchema,
} from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/create-user",
  checkAuth(Role.SUPER_ADMIN),
  multerUpload.single("picture"),
  validateRequest(createUserZodSchema),
  UserControllers.createUser,
);

router.get(
  "/me",
  checkAuth(...Object.values(Role)),
  UserControllers.getMe,
);

router.patch(
  "/update-profile",
  checkAuth(...Object.values(Role)),
  multerUpload.single("picture"),
  validateRequest(updateUserZodSchema),
  UserControllers.updateProfile,
);

router.get(
  "/all-users",
  checkAuth(
    Role.SUPER_ADMIN,
    Role.AGENT_LEADER,
  ),
  UserControllers.getAllUsers,
);

router.get(
  "/all-trash-users",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.getAllTrashUsers,
);

router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  UserControllers.getSingleUser,
);

router.patch(
  "/:id",
  checkAuth(...Object.values(Role)),
  multerUpload.single("picture"),
  validateRequest(updateUserZodSchema),
  UserControllers.updateUser,
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  UserControllers.deleteUser,
);

export const userRoutes = router;