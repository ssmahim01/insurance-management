import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/create-notification",checkAuth(...Object.values(Role)), NotificationController.createNotification);

router.get("/all-notifications",checkAuth(...Object.values(Role)), NotificationController.getAllNotifications);

router.get("/:id", checkAuth(...Object.values(Role)), NotificationController.getSingleNotification);

router.patch("/:id/read", checkAuth(...Object.values(Role)), NotificationController.markAsRead);

router.delete("/:id",checkAuth(...Object.values(Role)), NotificationController.softDeleteNotification);

export const NotificationRoutes = router;