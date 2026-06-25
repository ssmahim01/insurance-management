import express from "express";
import { ContactController } from "./contact.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = express.Router();

router.post("/create-contact", ContactController.createContact);

router.get(
  "/all-contacts",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ContactController.getAllContacts,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ContactController.getSingleContact,
);

router.patch(
  "/read/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ContactController.markAsRead,
);

router.patch(
  "/reply/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ContactController.markAsReplied,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ContactController.softDeleteContact,
);

export const ContactRoutes = router;